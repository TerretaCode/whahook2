import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/encryption'

// Lazy-initialized Supabase admin client
let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!url || !key) {
      throw new Error('Supabase configuration missing')
    }
    
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}

interface SmtpConfig {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  auth_user: string
  auth_pass: string  // Encrypted
  from_email: string
  from_name: string
  reply_to?: string
}

interface AgencyBranding {
  logo_url?: string
  logo_text?: string
  primary_color?: string
  agency_name?: string
  powered_by_text?: string
  show_powered_by?: boolean
}

interface WhatsAppConnectedData {
  user_name: string
  phone_number: string
  session_label: string
  connection_time: string
  device_info?: string
  dashboard_url: string
}

interface WhatsAppDisconnectedData {
  user_name: string
  phone_number: string
  session_label: string
  disconnection_reason: string
  disconnection_time: string
  login_url: string
}

interface WorkspaceInvitationData {
  workspace_name: string
  inviter_name?: string
  role: string
  access_link: string
  workspace_id?: string  // For branding lookup
}

function getWhatsAppConnectedTemplate(data: WhatsAppConnectedData, brandName: string = 'WhaHook') {
  const subject = `✅ WhatsApp Conectado Exitosamente - ${data.session_label}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ ¡WhatsApp Conectado!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${data.user_name}</strong>,</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Tu sesión de WhatsApp <strong>"${data.session_label}"</strong> se ha conectado exitosamente.
        </p>
        
        <div style="background: white; padding: 20px; border-left: 4px solid #25D366; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 14px;"><strong>📱 Número:</strong> ${data.phone_number}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>🕐 Conectado:</strong> ${data.connection_time}</p>
          ${data.device_info ? `<p style="margin: 10px 0 0 0; font-size: 14px;"><strong>📲 Dispositivo:</strong> ${data.device_info}</p>` : ''}
        </div>
        
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 14px; color: #155724;">
            ✅ <strong>¡Todo listo!</strong> Tu WhatsApp está conectado y listo para enviar y recibir mensajes.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboard_url}" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Ir al Dashboard
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          Este es un email automático de ${brandName}.
        </p>
      </div>
    </body>
    </html>
  `
  
  const text = `
¡WhatsApp Conectado!

Hola ${data.user_name},

Tu sesión de WhatsApp "${data.session_label}" se ha conectado exitosamente.

📱 Número: ${data.phone_number}
🕐 Conectado: ${data.connection_time}
${data.device_info ? `📲 Dispositivo: ${data.device_info}` : ''}

✅ ¡Todo listo! Tu WhatsApp está conectado y listo para enviar y recibir mensajes.

Ir al dashboard: ${data.dashboard_url}
  `.trim()
  
  return { subject, html, text }
}

function getWhatsAppDisconnectedTemplate(data: WhatsAppDisconnectedData, brandName: string = 'WhaHook') {
  const subject = `⚠️ Tu sesión de WhatsApp "${data.session_label}" se ha desconectado`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Sesión Desconectada</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${data.user_name}</strong>,</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Tu sesión de WhatsApp <strong>"${data.session_label}"</strong> (${data.phone_number}) se ha desconectado.
        </p>
        
        <div style="background: white; padding: 20px; border-left: 4px solid #e74c3c; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 14px;"><strong>Motivo:</strong> ${data.disconnection_reason}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Fecha:</strong> ${data.disconnection_time}</p>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Para volver a conectar tu sesión, inicia sesión en tu panel y escanea el código QR nuevamente.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.login_url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Ir al Panel
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          Este es un email automático de ${brandName}.
        </p>
      </div>
    </body>
    </html>
  `
  
  const text = `
Hola ${data.user_name},

Tu sesión de WhatsApp "${data.session_label}" (${data.phone_number}) se ha desconectado.

Motivo: ${data.disconnection_reason}
Fecha: ${data.disconnection_time}

Para volver a conectar tu sesión, inicia sesión en tu panel y escanea el código QR nuevamente.

Ir al panel: ${data.login_url}
  `.trim()
  
  return { subject, html, text }
}

function getWorkspaceInvitationTemplate(data: WorkspaceInvitationData, brandName: string = 'WhaHook', primaryColor?: string) {
  const color = primaryColor || '#10B981'
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    client: 'Cliente',
    agent: 'Agente',
    viewer: 'Visor (CRM)'
  }
  
  const roleLabel = roleLabels[data.role] || data.role
  const subject = `🎉 Has sido invitado a ${data.workspace_name} en ${brandName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 ¡Estás Invitado!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">¡Hola!</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          ${data.inviter_name ? `<strong>${data.inviter_name}</strong> te ha invitado` : 'Has sido invitado'} a unirte al workspace <strong>"${data.workspace_name}"</strong> en ${brandName}.
        </p>
        
        <div style="background: white; padding: 20px; border-left: 4px solid ${color}; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 14px;"><strong>📋 Workspace:</strong> ${data.workspace_name}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>👤 Tu rol:</strong> ${roleLabel}</p>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Haz clic en el botón de abajo para acceder al workspace:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.access_link}" style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Acceder al Workspace
          </a>
        </div>
        
        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; font-size: 14px; color: #92400E;">
            ⚠️ <strong>Importante:</strong> Este enlace es personal y no debe compartirse con nadie.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          Este es un email automático de ${brandName}. Si no esperabas esta invitación, puedes ignorar este mensaje.
        </p>
      </div>
    </body>
    </html>
  `
  
  const text = `
¡Estás Invitado!

${data.inviter_name ? `${data.inviter_name} te ha invitado` : 'Has sido invitado'} a unirte al workspace "${data.workspace_name}" en ${brandName}.

📋 Workspace: ${data.workspace_name}
👤 Tu rol: ${roleLabel}

Accede al workspace: ${data.access_link}

⚠️ Importante: Este enlace es personal y no debe compartirse con nadie.
  `.trim()
  
  return { subject, html, text }
}

/**
 * Get SMTP config for a workspace owner (for custom SMTP)
 */
async function getWorkspaceSmtpConfig(workspaceId: string): Promise<{ smtp: SmtpConfig | null; branding: AgencyBranding | null }> {
  console.log(`📧 getWorkspaceSmtpConfig called with workspaceId: ${workspaceId}`)
  
  try {
    // Get workspace owner (column is user_id, not owner_id)
    const { data: workspace, error: wsError } = await getSupabaseAdmin()
      .from('workspaces')
      .select('user_id')
      .eq('id', workspaceId)
      .single()
    
    console.log(`📧 Workspace query result: workspace=${JSON.stringify(workspace)}, error=${wsError?.message || 'none'}`)
    
    if (wsError || !workspace?.user_id) {
      console.error('Workspace not found or no user_id:', wsError)
      return { smtp: null, branding: null }
    }
    
    // Get owner's SMTP config and branding
    const { data: profile, error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .select('smtp_config, agency_branding')
      .eq('id', workspace.user_id)
      .single()
    
    console.log(`📧 Profile query result: has_branding=${!!profile?.agency_branding}, error=${profileError?.message || 'none'}`)
    
    if (profileError || !profile) {
      console.error('Profile not found:', profileError)
      return { smtp: null, branding: null }
    }
    
    console.log(`📧 Profile found, agency_branding type: ${typeof profile.agency_branding}`)
    
    const smtp = profile.smtp_config as SmtpConfig | null
    
    // Handle agency_branding - it might be stored as a JSON string or as an object
    let branding: AgencyBranding | null = null
    if (profile.agency_branding) {
      if (typeof profile.agency_branding === 'string') {
        try {
          branding = JSON.parse(profile.agency_branding) as AgencyBranding
        } catch {
          console.error('Failed to parse agency_branding JSON string')
        }
      } else {
        branding = profile.agency_branding as AgencyBranding
      }
    }
    
    // Always return branding, only return SMTP if enabled
    return { 
      smtp: smtp?.enabled ? smtp : null, 
      branding 
    }
  } catch (error) {
    console.error('Error fetching workspace SMTP config:', error)
    return { smtp: null, branding: null }
  }
}

/**
 * Create nodemailer transporter (custom or default)
 */
function createTransporter(smtpConfig: SmtpConfig | null) {
  if (smtpConfig) {
    // Decrypt password
    let password: string
    try {
      password = decrypt(smtpConfig.auth_pass)
    } catch (error) {
      console.error('Failed to decrypt SMTP password, using default:', error)
      return createDefaultTransporter()
    }
    
    return nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth_user,
        pass: password,
      },
    })
  }
  
  return createDefaultTransporter()
}

function createDefaultTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, to, data, workspace_id } = body

    if (!to || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: to, type' },
        { status: 400 }
      )
    }

    // Get custom SMTP config if workspace_id is provided
    // workspace_id can be in the body directly or inside data (for workspace_invitation)
    let smtpConfig: SmtpConfig | null = null
    let branding: AgencyBranding | null = null
    
    const effectiveWorkspaceId = workspace_id || data?.workspace_id
    
    console.log(`📧 Email request: type=${type}, to=${to}, workspace_id=${effectiveWorkspaceId}`)
    
    if (effectiveWorkspaceId) {
      const result = await getWorkspaceSmtpConfig(effectiveWorkspaceId)
      smtpConfig = result.smtp
      branding = result.branding
      console.log(`📧 Branding loaded: agency_name=${branding?.agency_name}, primary_color=${branding?.primary_color}`)
    } else {
      console.log(`📧 No workspace_id provided, using default branding`)
    }

    let subject: string
    let html: string
    let text: string

    // Get brand name for templates
    const brandName = branding?.agency_name || 'WhaHook'

    if (type === 'whatsapp_connected') {
      const template = getWhatsAppConnectedTemplate(data as WhatsAppConnectedData, brandName)
      subject = template.subject
      html = template.html
      text = template.text
    } else if (type === 'whatsapp_disconnected') {
      const template = getWhatsAppDisconnectedTemplate(data as WhatsAppDisconnectedData, brandName)
      subject = template.subject
      html = template.html
      text = template.text
    } else if (type === 'workspace_invitation') {
      console.log(`📧 Invitation template: brandName=${brandName}, primaryColor=${branding?.primary_color}`)
      const template = getWorkspaceInvitationTemplate(data as WorkspaceInvitationData, brandName, branding?.primary_color)
      subject = template.subject
      html = template.html
      text = template.text
    } else {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      )
    }

    // Create transporter (custom or default)
    const transporter = createTransporter(smtpConfig)
    
    // Determine from address
    const fromEmail = smtpConfig?.from_email || process.env.EMAIL_FROM || 'noreply@whahook.com'
    const fromName = smtpConfig?.from_name || branding?.agency_name || 'WhaHook'
    const replyTo = smtpConfig?.reply_to
    
    console.log(`📧 Sending email: from="${fromName} <${fromEmail}>", brandName=${brandName}, branding=${JSON.stringify(branding)}`)

    // Send email
    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      text,
      html,
      replyTo,
    })

    // eslint-disable-next-line no-console
    console.log(`✅ Email sent via ${smtpConfig ? 'custom SMTP' : 'default'}:`, info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      debug: {
        workspace_id: effectiveWorkspaceId,
        branding_found: !!branding,
        agency_name: branding?.agency_name || null,
        primary_color: branding?.primary_color || null,
        from_name: fromName,
        from_email: fromEmail,
      }
    })
  } catch (error) {
    console.error('❌ Error sending email:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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

function getWhatsAppConnectedTemplate(data: WhatsAppConnectedData) {
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
          Este es un email automático de WhaHook.
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

function getWhatsAppDisconnectedTemplate(data: WhatsAppDisconnectedData) {
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
          Este es un email automático de WhaHook.
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, to, data } = body

    if (!to || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: to, type' },
        { status: 400 }
      )
    }

    let subject: string
    let html: string
    let text: string

    if (type === 'whatsapp_connected') {
      const template = getWhatsAppConnectedTemplate(data as WhatsAppConnectedData)
      subject = template.subject
      html = template.html
      text = template.text
    } else if (type === 'whatsapp_disconnected') {
      const template = getWhatsAppDisconnectedTemplate(data as WhatsAppDisconnectedData)
      subject = template.subject
      html = template.html
      text = template.text
    } else {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      )
    }

    // Create transporter with SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'WhaHook <noreply@whahook.com>',
      to,
      subject,
      text,
      html,
    })

    // eslint-disable-next-line no-console
    console.log('✅ Email sent:', info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
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

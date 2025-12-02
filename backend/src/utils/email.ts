/**
 * Email utilities - sends emails via frontend API route
 * This bypasses Railway's SMTP limitations by using Vercel's infrastructure
 */

interface WhatsAppConnectedEmailData {
  user_name: string
  phone_number: string
  session_label: string
  connection_time: string
  device_info?: string
  dashboard_url: string
}

interface WhatsAppDisconnectedEmailData {
  user_name: string
  phone_number: string
  session_label: string
  disconnection_reason: string
  disconnection_time: string
  login_url: string
}

/**
 * Generic email sender via frontend API route
 */
async function sendEmailViaFrontend(
  type: string,
  to: string,
  data: unknown
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    
    console.log(`📧 Sending ${type} email to ${to} via ${frontendUrl}`)
    
    const response = await fetch(`${frontendUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, to, data }),
    })

    const result = await response.json() as { success?: boolean; messageId?: string; error?: string }

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email')
    }

    console.log(`✅ Email sent successfully: ${result.messageId}`)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error(`❌ Error sending ${type} email:`, error)
    return { success: false }
  }
}

/**
 * Send WhatsApp connection success email
 */
export async function sendWhatsAppConnectedEmail(
  to: string,
  data: WhatsAppConnectedEmailData
): Promise<{ success: boolean; messageId?: string }> {
  return sendEmailViaFrontend('whatsapp_connected', to, data)
}

/**
 * Send WhatsApp disconnection email
 */
export async function sendWhatsAppDisconnectedEmail(
  to: string,
  data: WhatsAppDisconnectedEmailData
): Promise<{ success: boolean; messageId?: string }> {
  return sendEmailViaFrontend('whatsapp_disconnected', to, data)
}

interface WorkspaceInvitationEmailData {
  workspace_name: string
  inviter_name?: string
  role: string
  access_link: string
  workspace_id?: string  // To fetch branding
}

/**
 * Send workspace invitation email
 */
export async function sendWorkspaceInvitationEmail(
  to: string,
  data: WorkspaceInvitationEmailData
): Promise<{ success: boolean; messageId?: string }> {
  return sendEmailViaFrontend('workspace_invitation', to, data)
}

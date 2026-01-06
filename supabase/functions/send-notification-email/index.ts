import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface NotificationPayload {
  userId: string
  email: string
  type: 'budget_alert' | 'goal_milestone' | 'bill_reminder' | 'spending_summary' | 'savings_milestone'
  title: string
  message: string
  data?: Record<string, string | number>
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const payload: NotificationPayload = await req.json()

    // Validate payload
    if (!payload.email || !payload.title || !payload.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // Check if user has email notifications enabled
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: preferences } = await supabase
      .from('preferences')
      .select('notifications_email')
      .eq('user_id', payload.userId)
      .single()

    if (preferences && !preferences.notifications_email) {
      return new Response(
        JSON.stringify({ message: 'Email notifications disabled for user' }),
        { status: 200 }
      )
    }

    // Generate email HTML based on notification type
    const emailHtml = generateEmailHTML(payload)

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'BudgetTracker <noreply@budgettracker.app>',
        to: payload.email,
        subject: payload.title,
        html: emailHtml,
        reply_to: 'support@budgettracker.app',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 500 }
      )
    }

    const result = await response.json()

    // Log the sent notification
    await supabase
      .from('notification_queue')
      .update({
        email_sent: true,
        sent_at: new Date().toISOString(),
      })
      .eq('user_id', payload.userId)
      .eq('title', payload.title)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        data: result 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})

function generateEmailHTML(payload: NotificationPayload): string {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #333;
    line-height: 1.6;
  `

  const containerStyles = `
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9fafb;
  `

  const cardStyles = `
    background-color: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  `

  const headerStyles = `
    font-size: 24px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 12px;
  `

  const messageStyles = `
    font-size: 16px;
    color: #4b5563;
    margin-bottom: 20px;
  `

  const buttonStyles = `
    display: inline-block;
    background-color: #3b82f6;
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    margin-top: 20px;
  `

  const footerStyles = `
    text-align: center;
    font-size: 12px;
    color: #9ca3af;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
  `

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="${baseStyles}">
        <div style="${containerStyles}">
          <div style="${cardStyles}">
            <h1 style="${headerStyles}">${escapeHtml(payload.title)}</h1>
            <p style="${messageStyles}">${escapeHtml(payload.message)}</p>
            
            ${payload.data ? `
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                ${Object.entries(payload.data)
                  .map(([key, value]) => `
                    <p style="margin: 8px 0; font-size: 14px;">
                      <strong>${escapeHtml(String(key))}:</strong> ${escapeHtml(String(value))}
                    </p>
                  `)
                  .join('')}
              </div>
            ` : ''}
            
            <a href="${process.env.APP_URL || 'https://budgettracker.app'}" style="${buttonStyles}">
              View in BudgetTracker
            </a>
            
            <div style="${footerStyles}">
              <p>You received this email because you have notifications enabled in your BudgetTracker settings.</p>
              <p><a href="${process.env.APP_URL || 'https://budgettracker.app'}/settings" style="color: #3b82f6; text-decoration: none;">Manage notification preferences</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

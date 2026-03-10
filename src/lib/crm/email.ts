import { createClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL, FROM_NAME } from '@/lib/resend'

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// Replace template variables like {{name}}, {{property_title}}, etc.
function replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '')
    }
    return result
}

// Send an email using a template
export async function sendTemplateEmail(
    templateId: string,
    toEmail: string,
    variables: Record<string, string>,
    leadId?: string
) {
    const supabase = getSupabase()

    // Fetch template
    const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (!template) throw new Error('Template not found')

    const subject = replaceVariables(template.subject, variables)
    const bodyHtml = replaceVariables(template.body_html, variables)

    // Send via Resend
    const { data: emailResult, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: toEmail,
        subject,
        html: bodyHtml,
    })

    // Log the email
    await supabase.from('email_logs').insert({
        lead_id: leadId || null,
        template_id: templateId,
        to_email: toEmail,
        subject,
        status: error ? 'failed' : 'sent',
        resend_id: emailResult?.id || null,
    })

    // Log as lead activity if linked to a lead
    if (leadId) {
        await supabase.from('lead_activities').insert({
            lead_id: leadId,
            type: 'email_sent',
            title: `Email sent: ${subject}`,
            description: `Template: ${template.name}`,
            created_by: 'system',
        })
    }

    if (error) throw error
    return emailResult
}

// Schedule an email to be sent later
export async function scheduleEmail(
    templateId: string,
    toEmail: string,
    toName: string,
    variables: Record<string, string>,
    scheduledFor: Date,
    leadId?: string
) {
    const supabase = getSupabase()

    const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single()

    if (!template) throw new Error('Template not found')

    const subject = replaceVariables(template.subject, variables)
    const bodyHtml = replaceVariables(template.body_html, variables)

    await supabase.from('email_queue').insert({
        lead_id: leadId || null,
        template_id: templateId,
        to_email: toEmail,
        to_name: toName,
        subject,
        body_html: bodyHtml,
        variables,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
    })
}

// Process pending emails in the queue (called by cron)
export async function processEmailQueue() {
    const supabase = getSupabase()

    const { data: pendingEmails } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(50)

    if (!pendingEmails || pendingEmails.length === 0) return { processed: 0 }

    let processed = 0
    for (const email of pendingEmails) {
        try {
            const { data: emailResult, error } = await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: email.to_email,
                subject: email.subject,
                html: email.body_html,
            })

            await supabase.from('email_queue')
                .update({
                    status: error ? 'failed' : 'sent',
                    sent_at: error ? null : new Date().toISOString(),
                    error_message: error ? JSON.stringify(error) : null,
                })
                .eq('id', email.id)

            // Log to email_logs
            await supabase.from('email_logs').insert({
                lead_id: email.lead_id,
                template_id: email.template_id,
                to_email: email.to_email,
                subject: email.subject,
                status: error ? 'failed' : 'sent',
                resend_id: emailResult?.id || null,
            })

            if (!error) processed++
        } catch (err) {
            await supabase.from('email_queue')
                .update({ status: 'failed', error_message: String(err) })
                .eq('id', email.id)
        }
    }

    return { processed }
}

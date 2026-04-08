export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/crm/task-reminders — Check for tasks due in next 15 minutes and send notifications
// This can be called by Vercel cron or the client periodically
export async function GET(request: NextRequest) {
    try {
        const now = new Date()
        const in15Min = new Date(now.getTime() + 15 * 60 * 1000)

        // Find lead tasks due in the next 15 minutes that are not completed
        const { data: dueTasks } = await supabase
            .from('lead_tasks')
            .select('*, leads (name), creator:created_by (id, full_name)')
            .eq('is_completed', false)
            .gte('due_date', now.toISOString())
            .lte('due_date', in15Min.toISOString())

        // Find HRM tasks due today that are not done (hrm_tasks use DATE type)
        const todayStr = now.toISOString().split('T')[0]
        const { data: hrmTasks } = await supabase
            .from('hrm_tasks')
            .select('*, assignee:assigned_to (id, full_name)')
            .eq('due_date', todayStr)
            .neq('status', 'done')

        let notifCount = 0

        // Send notifications for lead tasks
        for (const task of (dueTasks || [])) {
            // Check if we already sent a reminder for this task
            const { data: existing } = await supabase
                .from('notifications')
                .select('id')
                .eq('type', 'task_due')
                .ilike('body', `%${task.id}%`)
                .limit(1)

            if (existing && existing.length > 0) continue

            // Notify the task creator and/or assigned person
            const notifyUserIds = new Set<string>()
            if (task.created_by) notifyUserIds.add(task.created_by)
            if (task.assigned_to) notifyUserIds.add(task.assigned_to)

            for (const userId of notifyUserIds) {
                await supabase.from('notifications').insert({
                    type: 'task_due',
                    title: `Task due soon: ${task.title}`,
                    body: `Task "${task.title}" for lead ${task.leads?.name || 'Unknown'} is due in less than 15 minutes. [ref:${task.id}]`,
                    link: `/crm/leads/${task.lead_id}`,
                    user_id: userId,
                })
                notifCount++
            }
        }

        // Send notifications for HRM tasks due today (once per day check)
        for (const task of (hrmTasks || [])) {
            if (!task.assigned_to) continue

            const { data: existing } = await supabase
                .from('notifications')
                .select('id')
                .eq('type', 'task_due')
                .ilike('body', `%hrm-${task.id}%`)
                .limit(1)

            if (existing && existing.length > 0) continue

            await supabase.from('notifications').insert({
                type: 'task_due',
                title: `Task due today: ${task.title}`,
                body: `Your task "${task.title}" is due today. [ref:hrm-${task.id}]`,
                link: '/hrms/tasks',
                user_id: task.assigned_to,
            })
            notifCount++
        }

        return NextResponse.json({ checked: true, notificationsSent: notifCount, leadTasks: dueTasks?.length || 0, hrmTasks: hrmTasks?.length || 0 })
    } catch (err) {
        console.error('Task reminder error:', err)
        return NextResponse.json({ error: 'Failed to check task reminders' }, { status: 500 })
    }
}

import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, WidthType, convertInchesToTwip,
} from 'docx'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pt = n => n * 2
const sp = (after = 6) => ({ after })

const h1 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: sp(4) })
const h2 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: sp(3) })
const p  = text => new Paragraph({ children: [new TextRun({ text, size: pt(11) })], spacing: sp(6) })
const b  = text => new Paragraph({ children: [new TextRun({ text, bold: true, size: pt(11) })], spacing: sp(4) })
const li = (text, level = 0) => new Paragraph({ children: [new TextRun({ text, size: pt(11) })], bullet: { level }, spacing: sp(3) })
const gap = () => new Paragraph({ text: '' })

function table(headers, rows, colWidths) {
    const cell = (text, isHeader) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: isHeader, size: pt(10) })] })],
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
        ...(colWidths ? {} : {}),
    })
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ children: headers.map(h => cell(h, true)), tableHeader: true }),
            ...rows.map(row => new TableRow({ children: row.map(t => cell(t, false)) })),
        ],
    })
}

const doc = new Document({
    creator: '27 Estates',
    title: '27 Estates CRM User Guide',
    styles: {
        default: {
            document: {
                run: { font: 'Calibri', size: pt(11), color: '000000' },
                paragraph: { spacing: { line: 280 } },
            },
            heading1: {
                run: { font: 'Calibri', bold: true, size: pt(14), color: '000000' },
                paragraph: { spacing: { before: 200, after: 80 } },
            },
            heading2: {
                run: { font: 'Calibri', bold: true, size: pt(12), color: '000000' },
                paragraph: { spacing: { before: 160, after: 60 } },
            },
        },
    },
    sections: [{
        properties: {
            page: {
                margin: {
                    top: convertInchesToTwip(1),
                    bottom: convertInchesToTwip(1),
                    left: convertInchesToTwip(1.25),
                    right: convertInchesToTwip(1.25),
                },
            },
        },
        children: [

            // Title
            new Paragraph({
                children: [new TextRun({ text: '27 Estates CRM — User Guide', bold: true, size: pt(22) })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
            }),
            new Paragraph({
                children: [new TextRun({ text: 'March 2026', size: pt(11), color: '555555' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
            }),

            // 1. Login
            h1('1. Getting Started'),
            p('Open /crm in your browser. Log in with the email and password given by your Super Admin. Only Super Admins, Admins, and Agents can access the CRM. After logging in you land on the Dashboard. To log out, click the logout icon at the bottom of the sidebar.'),
            gap(),

            // 2. Roles
            h1('2. Roles and Permissions'),
            p('There are three roles in the CRM. Each controls what a person can see and do.'),
            gap(),
            table(
                ['Feature', 'Super Admin', 'Admin', 'Agent'],
                [
                    ['View Dashboard',               'Yes', 'Yes', 'Yes'],
                    ['View All Leads',               'Yes', 'Yes', 'Own only'],
                    ['Add and Edit Leads',           'Yes', 'Yes', 'Yes'],
                    ['Reassign Leads',               'Yes', 'Yes', 'No'],
                    ['View Analytics and Reports',   'Yes', 'Yes', 'No'],
                    ['Manage Employees',             'Yes', 'Yes', 'No'],
                    ['View All Attendance',          'Yes', 'Yes', 'Own only'],
                    ['Approve Leaves',               'Yes', 'Yes', 'No'],
                    ['Approve Regularisations',      'Yes', 'No',  'No'],
                    ['Manage Connectors / Webhooks', 'Yes', 'Yes', 'No'],
                    ['Work Settings',                'Yes', 'No',  'No'],
                    ['Leave Allocations',            'Yes', 'No',  'No'],
                ]
            ),
            gap(),

            // 3. Dashboard
            h1('3. Dashboard'),
            p('The Dashboard is the first page you see after login. At the top you have stat cards showing total leads, new leads today, hot leads, leads this week, and the overall conversion rate.'),
            p('Below that is a Lead Funnel bar chart showing how many leads are at each stage from New all the way to Converted. There is also a Lead Sources donut chart showing which marketing channels are bringing in leads, and a list of the 5 most recently added leads.'),
            gap(),

            // 4. Leads
            h1('4. Leads'),
            p('Go to Sales → Leads in the sidebar. This page has three tabs: All Leads, Schedule, and Analytics.'),
            gap(),

            h2('All Leads'),
            p('This is a table of every lead. You can search by name, email, or phone, and filter by status, source, or assigned agent. Each row shows the lead name, source, status, priority, assigned agent, next scheduled call time (in red if overdue), and whether the lead has been escalated.'),
            gap(),
            b('Adding a lead'),
            p('Click + Add Lead at the top right. Fill in the name, email, phone, source, status, priority, and any notes. Click Save. The lead is automatically assigned to the next available agent right away — no manual action needed.'),
            gap(),
            b('Reassigning a lead'),
            p('Admins can click the Reassign button on any lead row and pick a different agent. The schedule is updated immediately.'),
            gap(),

            h2('Schedule'),
            p('This tab shows the call schedule for the day, grouped by time slot. Each slot shows the lead name, phone number, and scheduled time.'),
            gap(),
            b('Actions you can take on a slot:'),
            li('Called — opens a form to log the outcome of the call'),
            li('No Answer — marks the attempt as no answer'),
            li('Request Postpone — asks the manager to push the call to the next working day'),
            li('Reassign — moves the slot to another agent (Admin only)'),
            gap(),
            b('When logging a call outcome you can choose:'),
            li('Interested, Not Interested, Call Back, Converted, or Wrong Number'),
            li('Add free-text notes and save'),
            gap(),
            b('Postpone flow'),
            p('An agent submits a postpone request. The manager sees it highlighted in the schedule and either approves or rejects it. If approved, a new slot is created for the next working day. The agent gets a notification either way.'),
            gap(),

            h2('Analytics'),
            p('Shows a status distribution chart, lead source breakdown, agent performance table (assigned, contacted, converted, conversion rate), and a list of escalated leads.'),
            gap(),

            // 5. Auto-assignment
            h1('5. Lead Auto-Assignment'),
            p('Every new lead is automatically assigned to an agent the moment it is created — whether added manually or received from an ad platform. No button needs to be clicked.'),
            gap(),
            b('How it works'),
            li('The system goes through agents one by one in rotation (round-robin)'),
            li('Only users with the Agent role are included — Admins are never auto-assigned'),
            li('The system finds the first free 15-minute gap in the agent\'s day and books the call'),
            li('If the lead comes in outside working hours, it gets scheduled for the next working day'),
            gap(),
            b('If an agent is absent'),
            p('Their pending call slots are moved to other available agents automatically.'),
            gap(),
            b('Escalation — 15-minute rule'),
            p('If a lead is not attended within 15 minutes of being assigned, it is marked as Escalated. An email goes to all reporting managers and an in-app notification is created.'),
            gap(),
            b('Postponing a lead'),
            p('Agents cannot push a lead to the next day on their own. They must submit a postpone request which a manager approves or rejects.'),
            gap(),

            // 6. Site Visits
            h1('6. Site Visits'),
            p('Go to Sales → Site Visits. Here you can track property visits linked to leads. Add a visit with the date, time, property name, and notes. Mark visits as completed or cancelled. Visit history is also visible on each lead\'s detail page.'),
            gap(),

            // 7. Automation
            h1('7. Automation'),
            gap(),
            h2('Connectors (Webhooks)'),
            p('Go to Automation → Connectors. This is where you connect external lead sources so their leads flow into the CRM automatically.'),
            gap(),
            b('Supported platforms:'),
            p('Meta Ads, Google Ads, 99acres, MagicBricks, Housing.com, JustDial, B2BBricks, Sulekha, WhatsApp, Chatbot'),
            gap(),
            b('Setting up a connector:'),
            li('Click + New Connector and select the platform'),
            li('Copy the Webhook URL that is generated'),
            li('Paste that URL into the platform\'s lead delivery settings'),
            li('Send a test lead — it should appear in the CRM within seconds and be auto-assigned'),
            gap(),
            h2('Email Templates'),
            p('Go to Automation → Email to create and manage email templates for lead follow-ups.'),
            gap(),

            // 8. HRM
            h1('8. HRM — Human Resource Management'),
            p('The HRM module covers attendance, leaves, tasks, and work schedules for your team. Find it in the HRM section of the sidebar.'),
            gap(),

            h2('HRM Overview'),
            p('A summary of your team. Shows total employees by role, a team composition chart, task status breakdown, top performing agents by conversion rate, and recent tasks.'),
            gap(),

            h2('Employees'),
            p('A list of all CRM users with their role and lead stats. Admins can set a Reporting Manager for each employee using the dropdown on their card. The reporting manager is the person who receives escalation emails for that employee\'s leads. Only Admin and Super Admin users can be set as reporting managers.'),
            gap(),

            h2('Tasks'),
            p('Assign and track tasks for team members. Each task has a title, description, assignee, priority (Low, Medium, High, Urgent), due date, and status (To Do, In Progress, Review, Done). Agents see only their own tasks. Admins see all.'),
            gap(),

            h2('Attendance'),
            p('Agents check in and out using the buttons on their attendance page. Hours worked are calculated automatically. After checkout, the system sets a status based on hours worked:'),
            gap(),
            table(
                ['Hours Worked', 'Status'],
                [
                    ['8 hours or more (default)',  'Present'],
                    ['4 hours or more (default)',  'Half Day'],
                    ['Less than 4 hours',          'Absent — employee gets an email'],
                ]
            ),
            gap(),
            p('Admins see a monthly calendar grid for all employees, colour-coded by status: green for present, red for absent, amber for late, orange for half day, and blue for work from home.'),
            gap(),

            h2('Leaves'),
            b('Applying for leave'),
            li('Click + Apply Leave'),
            li('Select the leave type: Annual, Sick, Casual, Unpaid, or Comp-off'),
            li('Choose dates and enter a reason, then submit'),
            li('The request sits as Pending until a manager acts on it'),
            gap(),
            b('Approving or rejecting'),
            p('Admins see pending requests at the top of the Leaves page. Clicking Approve or Reject sends the employee an email with the decision.'),
            gap(),

            h2('Regularisations'),
            p('A regularisation is a correction request for an attendance record — for example if someone was marked absent but was actually working.'),
            gap(),
            b('Attendance Calendar tab'),
            p('Shows the current month as a calendar grid. Absent or no-record weekdays are clickable for agents. Click a day, type a reason, and submit. The calendar shows the status of existing requests as overlays on each day.'),
            gap(),
            b('Requests tab'),
            p('Lists all requests by status. Super Admins can approve or reject with optional notes. The employee gets an email with the decision. Only Super Admins can approve or reject regularisations.'),
            gap(),

            h2('Leave Allocations'),
            p('Super Admin only. Set the number of days each employee is entitled to for each leave type per year.'),
            gap(),

            h2('Work Settings'),
            p('Super Admin only. Configure the working hours used across the system.'),
            gap(),
            table(
                ['Setting', 'What it controls'],
                [
                    ['Work Start Time',             'When the working day begins'],
                    ['Work End Time',               'When the working day ends'],
                    ['Full Day Hours',              'Minimum hours to be marked Present'],
                    ['Half Day Hours',              'Minimum hours to be marked Half Day'],
                    ['Max Regularisations / Month', 'How many requests an employee can make per month'],
                    ['Max Regularisations / Year',  'Annual cap on requests'],
                ]
            ),
            gap(),

            // 9. Analytics & Reports
            h1('9. Analytics and Reports'),
            p('Both pages are for Admins and above. Analytics shows lead volume over time, source performance, agent conversion rates, and the full sales funnel. Reports lets you generate and export detailed breakdowns.'),
            gap(),

            // 10. Notifications
            h1('10. Notifications'),
            p('The bell icon in the top bar shows in-app notifications. They refresh every 30 seconds. Click any notification to go straight to the relevant lead or task. Click Mark all read to clear the count.'),
            gap(),
            b('Notifications are sent for:'),
            li('New lead assigned to you'),
            li('Lead escalated (managers only)'),
            li('Postpone request approved or rejected'),
            li('Task due or overdue'),
            gap(),

            // 11. Email Alerts
            h1('11. Automatic Email Alerts'),
            table(
                ['When this happens', 'Who gets the email'],
                [
                    ['Lead not attended within 15 minutes',      'All reporting managers'],
                    ['Employee auto-marked Absent on checkout',  'The employee'],
                    ['Employee manually marked Absent',          'The employee'],
                    ['Regularisation approved',                  'The employee'],
                    ['Regularisation rejected',                  'The employee'],
                    ['Leave approved',                           'The employee'],
                    ['Leave rejected',                           'The employee'],
                ]
            ),
            gap(),

            // 12. Reference
            h1('12. Quick Reference'),
            gap(),
            h2('Lead Statuses'),
            table(
                ['Status', 'Meaning'],
                [
                    ['New',         'Just created, not yet contacted'],
                    ['Contacted',   'First call has been made'],
                    ['Qualified',   'Confirmed as a genuine buyer'],
                    ['Negotiation', 'Price or terms being discussed'],
                    ['Site Visit',  'Property visit scheduled or done'],
                    ['Converted',   'Deal closed'],
                    ['Lost',        'Lead dropped out'],
                ]
            ),
            gap(),
            h2('Lead Sources'),
            table(
                ['Source', 'Where it comes from'],
                [
                    ['Website',     'Enquiry from the company website'],
                    ['Meta Ads',    'Facebook or Instagram paid ad'],
                    ['Google Ads',  'Google paid search ad'],
                    ['99acres',     '99acres property portal'],
                    ['MagicBricks', 'MagicBricks property portal'],
                    ['Housing.com', 'Housing.com portal'],
                    ['JustDial',    'JustDial enquiry'],
                    ['Chatbot',     'Automated chatbot on the website'],
                    ['WhatsApp',    'Direct WhatsApp message'],
                    ['Manual',      'Added manually by the team'],
                    ['Referral',    'Referred by an existing client'],
                    ['B2BBricks',   'B2BBricks portal'],
                ]
            ),
        ],
    }],
})

const buffer = await Packer.toBuffer(doc)
const outPath = path.join(__dirname, '..', 'docs', '27_Estates_CRM_User_Guide.docx')
writeFileSync(outPath, buffer)
console.log('Done:', outPath)

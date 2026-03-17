# 27 Estates CRM — Complete User Guide

> **URL:** `/crm` (login required)
> **Roles:** Super Admin · Admin · Agent

---

## Table of Contents

1. [Getting Started & Login](#1-getting-started--login)
2. [Roles & Permissions](#2-roles--permissions)
3. [Dashboard](#3-dashboard)
4. [Leads Management](#4-leads-management)
   - [All Leads](#41-all-leads)
   - [Lead Schedule](#42-lead-schedule)
   - [Analytics](#43-analytics)
5. [Lead Auto-Assignment System](#5-lead-auto-assignment-system)
6. [Site Visits](#6-site-visits)
7. [Automation](#7-automation)
   - [Connectors (Webhooks)](#71-connectors-webhooks)
   - [Email Templates](#72-email-templates)
8. [HRM Module](#8-hrm-module)
   - [HRM Overview](#81-hrm-overview)
   - [Employees](#82-employees)
   - [Tasks](#83-tasks)
   - [Attendance](#84-attendance)
   - [Leaves](#85-leaves)
   - [Regularisations](#86-regularisations)
   - [Leave Allocations](#87-leave-allocations)
   - [Work Settings](#88-work-settings)
9. [Analytics & Reports](#9-analytics--reports)
10. [System Settings](#10-system-settings)
11. [Notifications](#11-notifications)
12. [Email Alerts Summary](#12-email-alerts-summary)

---

## 1. Getting Started & Login

Navigate to `/crm` in your browser. You will be redirected to the login page if you are not already signed in.

- Enter your **email** and **password** provided by the Super Admin.
- Only users with roles `super_admin`, `admin`, or `agent` can access the CRM.
- After login you land on the **Dashboard**.

To log out, click the **logout icon** at the bottom of the left sidebar.

---

## 2. Roles & Permissions

| Feature | Super Admin | Admin | Agent |
|---|:---:|:---:|:---:|
| View Dashboard | ✅ | ✅ | ✅ |
| View All Leads | ✅ | ✅ | ✅ (own leads) |
| Add / Edit Leads | ✅ | ✅ | ✅ |
| Reassign Leads | ✅ | ✅ | ❌ |
| View Analytics | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ❌ |
| Manage Employees | ✅ | ✅ | ❌ |
| View All Attendance | ✅ | ✅ | Own only |
| Mark Attendance | ✅ | ✅ | Self check-in/out |
| Approve Leaves | ✅ | ✅ | ❌ |
| Approve Regularisations | ✅ | ❌ | ❌ |
| Manage Connectors | ✅ | ✅ | ❌ |
| Work Settings | ✅ | ❌ | ❌ |
| Leave Allocations | ✅ | ❌ | ❌ |
| Set Reporting Manager | ✅ | ✅ | ❌ |

---

## 3. Dashboard

The Dashboard (`/crm`) is the first screen you see after login. It gives a real-time snapshot of business health.

### Stat Cards (top row)
| Card | What it shows |
|---|---|
| **Total Leads** | All leads ever created |
| **New Today** | Leads created today |
| **Hot Leads** | Leads marked as high priority |
| **This Week** | Leads created in the last 7 days |
| **Conversion Rate** | % of leads that reached "Converted" status |

### Lead Funnel
A horizontal bar chart showing how many leads are at each stage:
`New → Contacted → Qualified → Negotiation → Site Visit → Converted`

### Lead Sources Pie Chart
A donut chart showing which channels are generating leads (Meta Ads, Google Ads, 99acres, Chatbot, Manual, etc.). Each source has a distinct colour.

### Recent Leads
A live list of the 5 most recently added leads with their status, source, and time of creation. Click any row to open the lead detail page.

### API Usage
Shows how many AI/API tokens have been consumed today and this month with a cost estimate in INR.

---

## 4. Leads Management

Navigate via **Sales → Leads** in the sidebar.

### 4.1 All Leads

A full table of leads with real-time filtering and search.

**Columns:**
- **Lead** — Name, email, phone
- **Source** — Where the lead came from (colour-coded badge)
- **Status** — Current stage (colour-coded)
- **Priority** — Hot / Medium / Low
- **Assigned To** — Which agent the lead is assigned to (with avatar)
- **Next Call** — Scheduled call time (shown in red if overdue)
- **⚡ Escalated** — Red badge if the lead was not attended within 15 minutes of assignment
- **Created** — Date and time the lead was added

**Filters (top bar):**
- **Search** — Search by name, email, or phone
- **Status** — Filter by lead stage
- **Source** — Filter by lead source
- **Agent** — Filter by assigned agent (admin only)

**Adding a Lead:**
1. Click **+ Add Lead** (top right)
2. Fill in Name, Email, Phone, Source, Status, Priority, and Notes
3. Click **Save Lead**
4. The lead is automatically assigned to the next available agent via round-robin (see [Section 5](#5-lead-auto-assignment-system))

**Reassigning a Lead (Admin only):**
1. Click the **Reassign** button on a lead row
2. Select the new agent from the dropdown
3. The lead schedule is updated immediately

**Check Escalations (Admin only):**
Clicking **Check Escalations** scans all assigned leads. Any lead not attended within 15 minutes triggers an escalation email to all managers and creates an in-app notification.

---

### 4.2 Lead Schedule

Click the **Schedule** tab on the Leads page.

This view shows the call schedule for the day, organised by time slot.

**For Agents:**
- See only your own scheduled calls
- Each slot shows: lead name, phone, scheduled time, and current status
- **Actions per slot:**
  - **Called** — Log the call outcome (opens outcome form)
  - **No Answer** — Mark as no answer
  - **Request Postpone** — Ask manager to push the call to the next working day
  - **Reassign** (admin) — Move the slot to another agent

**Outcome Form:**
After clicking "Called", choose an outcome:
- Interested / Not Interested / Call Back / Converted / Wrong Number
- Add notes
- Click **Save Outcome**

**For Admins:**
- See all agents' schedules grouped by agent
- Can filter by date and by agent
- Can approve or reject postpone requests

**Postpone Flow:**
1. Agent clicks **Request Postpone** on a slot
2. Status changes to `postpone_requested`
3. Manager sees it highlighted in the schedule
4. Manager clicks **Approve** → a new slot is created for the next working day
5. Manager clicks **Reject** → slot remains for the current day
6. Agent receives an in-app notification about the decision

---

### 4.3 Analytics

Click the **Analytics** tab on the Leads page.

Shows performance data for the current lead list:

| Chart / Table | What it shows |
|---|---|
| **Status Distribution** | Bar chart of leads at each stage |
| **Lead Sources** | Bar chart breakdown by channel |
| **Agent Performance** | Table: assigned / contacted / converted per agent with conversion % |
| **Escalated Leads** | List of leads that required escalation |

---

## 5. Lead Auto-Assignment System

Every new lead — whether added manually or received via webhook (Meta, Google, 99acres, etc.) — is **automatically assigned** to an agent the moment it is created. No manual action is needed.

### How It Works

**Round-Robin Assignment:**
- The system maintains a pointer to the last agent who was assigned a lead.
- On each new lead, it moves to the next agent in the list.
- Only users with role `agent` are included — admins and super admins are never assigned leads automatically.

**Slot Scheduling:**
- The system checks the agent's existing schedule for the day.
- It finds the first available 15-minute gap and books the lead into that slot.
- If the lead arrives **outside working hours**, it is scheduled for the **next working day** at the earliest available slot.

**Absent Agent Handling:**
- If the assigned agent is marked absent for the day, their pending slots are redistributed to available agents.
- This can be triggered manually via **Check Escalations → Redistribute Absent**.

**Escalation:**
- If a lead has been assigned but not attended (no call logged) for **15 minutes**, it is marked as escalated.
- An email is sent to all managers.
- An in-app notification is created.

**Postpone Approval:**
- Agents cannot push leads to the next day on their own.
- They must submit a **postpone request** which a manager approves or rejects.

---

## 6. Site Visits

Navigate via **Sales → Site Visits** in the sidebar.

Track scheduled and completed property site visits.

**What you can do:**
- Add a new site visit (linked to a lead)
- Record visit date, time, property, and notes
- Mark visit as completed or cancelled
- View visit history per lead (also visible in the Lead Detail page)

---

## 7. Automation

### 7.1 Connectors (Webhooks)

Navigate via **Automation → Connectors**.

Connectors allow external lead sources to send leads directly into the CRM automatically.

**Supported platforms:** Meta Ads · Google Ads · 99acres · MagicBricks · Housing.com · JustDial · B2BBricks · Sulekha · WhatsApp · Chatbot

**How to set up a connector:**
1. Go to **Connectors** and click **+ New Connector**
2. Select the platform
3. Copy the generated **Webhook URL**
4. Paste this URL into the platform's lead delivery settings
5. Test with a sample lead — it should appear in the CRM within seconds and be auto-assigned to an agent

**How it works:**
When a lead form is filled on an ad platform, the platform sends the data to the webhook URL. The CRM receives it, creates the lead, and immediately runs auto-assignment.

---

### 7.2 Email Templates

Navigate via **Automation → Email**.

Create and manage outgoing email templates for lead follow-ups, confirmations, and notifications.

---

## 8. HRM Module

The HRM (Human Resource Management) module helps manage your team's attendance, leaves, tasks, and work schedule.

Navigate via the **HRM** section in the left sidebar.

---

### 8.1 HRM Overview

A summary dashboard of your team:

- **Team Stats** — Total employees, agents, admins
- **Team Composition** — Donut chart split by role (Agents / Admins / Super Admins)
- **Task Summary** — Bar chart showing tasks by status (To Do / In Progress / Done)
- **Top Performers** — Agents ranked by lead conversion rate
- **Recent Tasks** — Latest tasks with status, priority, and due date

---

### 8.2 Employees

Navigate via **HRM → Employees** (Admin and above).

A full list of all CRM users with their roles and details.

**What you can see:**
- Name, email, role
- Number of leads assigned and converted
- Reporting Manager (who this person reports to)

**Setting a Reporting Manager:**
1. Find the employee card
2. In the **Reporting Manager** dropdown, select their manager
3. Click save — this is used to determine who receives escalation notifications

**Note:** Only users with role `admin` or `super_admin` can be selected as a reporting manager.

---

### 8.3 Tasks

Navigate via **HRM → Tasks**.

Assign and track tasks for team members.

**Task fields:**
- Title and description
- Assignee (which team member)
- Priority (Low / Medium / High / Urgent)
- Due date
- Status (To Do / In Progress / Review / Done)

**For Agents:** See only tasks assigned to you.
**For Admins:** See all tasks; can create, edit, and delete.

---

### 8.4 Attendance

Navigate via **HRM → Attendance** (or **My Attendance** for agents).

#### Check-In / Check-Out (for agents)
- Click **Check In** when you start work
- Click **Check Out** when you finish
- Your location is optionally recorded
- Hours worked are calculated automatically

#### Automatic Status Calculation
After checkout, the system compares hours worked against the work settings:
| Hours Worked | Status |
|---|---|
| ≥ Full Day Hours (default 8h) | Present |
| ≥ Half Day Hours (default 4h) | Half Day |
| < Half Day Hours | Absent |

#### Monthly Calendar View (Admin)
Admins see a month-by-month grid with every employee's attendance colour-coded:
- 🟢 Green = Present
- 🔴 Red = Absent
- 🟡 Amber = Late
- 🟠 Orange = Half Day
- 🔵 Blue = Work from Home

#### Marking Attendance Manually (Admin)
Admins can manually mark attendance for any employee for any date by selecting the employee and the status.

---

### 8.5 Leaves

Navigate via **HRM → Leaves**.

#### Applying for Leave (Agent)
1. Click **+ Apply Leave**
2. Select leave type (Annual / Sick / Casual / Unpaid / Comp-off)
3. Select start and end dates
4. Enter reason
5. Submit — status will show **Pending**

#### Approving / Rejecting Leave (Admin)
1. Go to **Leaves** — pending requests are shown first
2. Click **Approve** or **Reject** on any request
3. The employee receives an **email notification** with the decision

#### Leave Balance
Leave allocations are managed by the Super Admin in **Leave Allocations** (see Section 8.7).

---

### 8.6 Regularisations

Navigate via **HRM → Regularisations**.

A regularisation is a request to correct an attendance record — for example, if an employee was marked absent but was actually working.

#### Attendance Calendar Tab
- Shows the current month's attendance in a calendar grid
- Days marked **Absent** or with **No Record** are clickable (for agents)
- Click on a day → fill in the reason → click **Submit Request**
- Your existing regularisation requests for the month are shown as overlays on the calendar:
  - `…` = Pending
  - `✓` = Approved
  - `✗` = Rejected

**Navigate between months** using the `‹` and `›` arrows.

#### Requests Tab
Shows all regularisation requests as a list, filterable by status (Pending / Approved / Rejected / All).

#### Approving / Rejecting (Super Admin only)
1. Go to the **Requests** tab, filter by **Pending**
2. Add an optional admin note
3. Click **Approve** or **Reject**
4. The employee receives an **email notification** with the decision

---

### 8.7 Leave Allocations

Navigate via **HRM → Leave Allocations** (Super Admin only).

Set how many days of each leave type each employee is entitled to per year.

---

### 8.8 Work Settings

Navigate via **HRM → Work Settings** (Super Admin only).

Configure global working hour rules used across the system:

| Setting | Purpose |
|---|---|
| **Work Start Time** | When the working day begins |
| **Work End Time** | When the working day ends |
| **Full Day Hours** | Minimum hours for "Present" |
| **Half Day Hours** | Minimum hours for "Half Day" |
| **Max Regularisations / Month** | How many regularisation requests per employee per month |
| **Max Regularisations / Year** | Annual cap on regularisation requests |

These settings affect:
- Automatic attendance status on checkout
- Lead schedule slot generation (when outside working hours)
- Absent agent detection for lead redistribution

---

## 9. Analytics & Reports

### Analytics (`/crm/analytics`)
Admin and above only. Shows overall CRM metrics including:
- Lead volume over time
- Source performance
- Agent performance comparison
- Conversion funnel

### Reports (`/crm/reports`)
Generate and export detailed reports.

---

## 10. System Settings

### API Usage (`/crm/usage`)
Track AI API token consumption, cost estimates, and daily usage trends.

### Settings (`/crm/settings`)
Configure CRM-wide preferences.

---

## 11. Notifications

The **bell icon** in the top bar shows real-time in-app notifications.

Notifications are created for:
- New lead assigned to you
- Lead escalated (manager)
- Postpone request approved / rejected (agent)
- Task due / overdue
- Status changes

Click a notification to navigate directly to the relevant lead or task.
Click **Mark all read** to clear the unread count.

Notifications refresh automatically every 30 seconds.

---

## 12. Email Alerts Summary

The following events trigger automatic emails via the system:

| Event | Who Gets the Email |
|---|---|
| Lead unattended for 15 min | All managers (reporting managers) |
| Absent after checkout (low hours) | The employee |
| Manually marked Absent | The employee |
| Regularisation Approved | The employee |
| Regularisation Rejected | The employee (with admin note if added) |
| Leave Approved | The employee |
| Leave Rejected | The employee |

---

## Quick Reference — Lead Status Meanings

| Status | Meaning |
|---|---|
| **New** | Just created, not yet contacted |
| **Contacted** | First call made |
| **Qualified** | Lead confirmed as a genuine buyer |
| **Negotiation** | Price / terms being discussed |
| **Site Visit** | Property visit scheduled or completed |
| **Converted** | Deal closed |
| **Lost** | Lead dropped out of the funnel |

---

## Quick Reference — Lead Sources

| Source | Colour |
|---|---|
| Website | Blue |
| Meta Ads | Pink |
| Google Ads | Amber |
| 99acres | Red |
| MagicBricks | Orange |
| Housing.com | Cyan |
| JustDial | Purple |
| Chatbot | Green |
| WhatsApp | WhatsApp Green |
| Manual | Violet |
| Referral | Gold |
| B2BBricks | Rose |

---

*Last updated: March 2026 — 27 Estates CRM v2*

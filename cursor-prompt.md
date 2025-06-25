# Project Overview

Build a full-stack app using **Next.js (App Router)** and **Supabase (PostgreSQL)** with the following core features:

---

## 🧾 User Authentication

- Use Supabase Auth (email + password) for login/register
- Only **traders** (business owners) can log in
- Each trader owns their own data (orders, workers, services)

---

## 📦 Data Models (PostgreSQL)

Convert these into Supabase-compatible Postgres tables:

### Users
- Trader account (email, password, createdAt)

### Workers
- WorkerID
- Belongs to trader (UserID)
- Name, Email, Phone
- Assigned orders

### Clients
- Contact/billing info only (not app users)
- Linked to trader

### Services
- Name, Description, Price
- Optional QuickBooksServiceID

### WorkOrders
- Belongs to trader
- Linked to client
- Assignable to either:
  - Trader themself (`AssignedToType: 'Self'`)
  - A Worker (`AssignedToType: 'Worker'`)
- Includes:
  - Status: Pending / In Progress / Completed / Cancelled / Archived
  - ScheduleDateTime
  - OrderAmount
  - OrderPaymentStatus: Unpaid / Pending Invoice / Paid
  - QuickBooksInvoiceID
  - Multiple services (via junction table)

### WorkOrderServices (Junction)
- WorkOrderID, ServiceID, Quantity

### Tags and ClientTags
- Standard tagging for clients

---

## ⚙️ QuickBooks Integration

- Allow OAuth connection for trader (use API routes or edge functions)
- On order creation:
  - Optionally create invoice in QuickBooks
  - Store `QuickBooksInvoiceID`
- Set up webhook listener to:
  - Update `OrderPaymentStatus` when invoice is sent/paid
- Use `.env.local` for sensitive keys

---

## 📆 Scheduling & Assignment

- Trader can create & schedule orders
- Trader can assign order to themselves or one of their workers
- View scheduled orders in a dashboard
- Filter by status, worker, date

---

## 📊 Dashboard

Create the following pages:

- `/dashboard`: overview (revenue, upcoming jobs, etc.)
- `/orders`: list, assign, schedule, update
- `/services`: CRUD for services
- `/clients`: manage client details
- `/settings`: OAuth connection, preferences

---

## 🔔 Notifications

Optional: Use Supabase Edge Functions or Realtime Channels for notifications when:

- Order scheduled
- Worker assigned
- Invoice paid

---

## 🛠️ Stack

- Next.js App Router
- Supabase (auth, DB, storage, optional edge functions)
- TailwindCSS
- ShadCN UI
- PostgreSQL schema
- QuickBooks API v3 (OAuth2)


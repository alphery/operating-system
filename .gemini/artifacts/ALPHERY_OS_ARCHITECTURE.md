# 🏗️ Alphery OS: The Next-Generation ERP Architecture
> **System Architecture & Strategy Document**
> **Version:** 1.0 (Foundation)
> **Author:** Alphery CTO (AI Agent)
> **Target:** Scalable to $100M ARR

---

## 🌍 Executive Summary
Alphery OS is designed not just as software, but as a **Business Operating System**.
Unlike legacy ERPs (SAP, Oracle) which are rigid, or SMB tools (Zoho, Hubspot) which are fragmented, Alphery OS is built on a **Dynamic Entity Engine**. This allows it to morph from a Hospital Management System to a Manufacturing ERP without changing a single line of core code.

**Our Core Philosophy:** "Same Core, Any Industry."

---

## 1. 🛡️ CORE ERP PLATFORM (The Non-Negotiable Foundation)
This layer is the "Operating System" itself. It manages security, data, and logic.

### 1.1 Multi-Tenancy Architecture
We use a **Shared Database, Isolated Schema/Row-Level Security** approach for cost-efficiency and speed, scalable to **Database-per-Tenant** for Enterprise clients.
- **Tenant Isolation**: Every database query MUST fetch `tenantId` from the JWT token.
- **Data Leak Prevention**: Global Prisma Middleware automatically injects `where: { tenantId }` into every query.

### 1.2 Authentication & Identity (IAM)
- **Centralized IAM**: A dedicated service handling Lock, Key, and Biometrics.
- **SSO Ready**: Built for Google Workspace, Office 365, and SAML (for Enterprise).
- **Session Management**: Redis-backed robust session handling with force-logout capabilities.

### 1.3 The Security Matrix (RBAC + ABAC)
We move beyond simple "Admin/User" roles.
- **Role-Based (RBAC)**: "Sales Manager", "Doctor", "Accountant".
- **Attribute-Based (ABAC)**: "Can view *Leads* where *Region* == 'North' AND *Value* < $10k".
- **Field-Level Security**: Hide "Salary" field from "Junior HR".

### 1.4 The Central Nervous System
- **Audit Trail**: Immutable log of every WRITE/DELETE action. Who, What, When, Old Value, New Value.
- **Notification Engine**: A centralized bus that dispatches alerts via:
    - In-App (Toast/Bell)
    - Email (Transactional)
    - Push (Mobile)
    - Webhook (External Systems)

---

## 2. 🧬 THE DYNAMIC ENTITY ENGINE (The Secret Sauce)
Instead of hardcoding "Leads" or "Patients", we build an engine that defines them.

### 2.1 The Concept
We create a **Meta-Schema**.
- **Entity Definition**: JSON config defining "What is this object?"
- **Field Definition**: JSON config defining "What data does it hold?"

### 2.2 How It Morphs (Examples)

#### Scenario A: IT Company (CRM)
- **Entity**: `Lead`
- **Fields**: `Company Name` (Text), `Tech Stack` (Multi-select), `Budget` (Currency).
- **Workflow**: New -> Discovered -> Proposal -> Won.

#### Scenario B: Hospital (HMS)
- **Entity**: `Patient` (Reuses the concept of a "Contact")
- **Fields**: `Blood Group` (Enum), `Last Visit` (Date), `Insurance ID` (Text).
- **Workflow**: Admitted -> Treated -> Discharged.

### 2.3 The "No-Code" Promise
Because these are defined as data (not code), a Tenant Admin can add a field "Referral Source" to a Lead instantly without engineering involvement.

---

## 3. ❤️ MODULE 1: CRM (The Heart)
The first proof-of-concept of our Engine.

### 3.1 Core Components
1.  **Leads & Deals (Pipeline)**: Kanban-first view. Drag-and-drop.
2.  **Universal Contact Book**: A unified distinct list of People and Organizations.
3.  **Activity Stream**: The "Lifebeat" of the CRM. Emails, Calls, Meetings, Tasks.
4.  **The "Smart Feed"**: A timeline view of everything happening with a customer.

### 3.2 Key Features
- **360° View**: Clicking a Contact shows Profile, Deals, Tickets, Invoices, and Emails in one tab.
- **Email Sync**: Two-way sync with Gmail/Outlook (Future MVP).
- **Document Vault**: Store contracts and proposals against the Deal.

---

## 4. 🚀 UNIQUE DIFFERENTIATORS
Why customers will choose Alphery OS over Zoho/Salesforce.

### 4.1 🎯 Daily Focus Mode
"Stop guessing what to do."
When a user logs in, they don't see a dashboard. They see a **Mission List**:
1.  Call 3 high-value leads (Critical)
2.  Follow up on 2 proposals (Overdue)
3.  Review 1 contract (Pending)

### 4.2 📉 Deal Confidence Meter
Instead of manually setting "Probability %", the system calculates it based on actions.
- No email for 5 days? **-10%**
- Client opened proposal 3 times? **+20%**
- Scheduled a meeting? **+15%**

### 4.3 🧠 Customer Memory
A summary widget: "Last time you spoke, John mentioned his daughter's graduation. Ask about it." (Simple AI text analysis on notes).

---

## 5. 🔭 EXPANSION STRATEGY
How we go from CRM to ERP.

1.  **Phase 1: CRM (Revenue)** - Help them make money.
2.  **Phase 2: Project Management (Delivery)** - Once sold, help them deliver. convert `Deal` -> `Project`.
3.  **Phase 3: Finance (Billing)** - Once delivered, help them bill. Convert `Quote` -> `Invoice`.
4.  **Phase 4: HR (People)** - Manage the people doing the work.

All phases use the **SAME** Entity Engine. An Invoice is just another Entity with "Status" fields and "Line Items".

---

## 6. 💾 HIGH-LEVEL DATABASE SCHEMA
Using PostgreSQL + JSONB for flexibility.

### Core Tables
```prisma
model Tenant {
  id          String   @id @default(uuid())
  name        String
  domain      String   @unique
  plan        Enum     // Free, Pro, Enterprise
  settings    Json     // Global tenant settings
}

model User {
  id          String   @id @default(uuid())
  tenantId    String
  email       String
  roleId      String   // Link to custom Role
  profile     Json
}

model Role {
  id          String   @id @default(uuid())
  tenantId    String
  name        String   // "Sales Manager"
  permissions Json     // { "lead": { "read": true, "write": true }, "salary": { "read": false } }
}
```

### The Entity Engine Tables
```prisma
model EntityDefinition {
  id          String   @id @default(uuid())
  tenantId    String
  name        String   // "Lead", "Patient", "Order"
  fields      Json     // Array of field definitions { name, type, validation }
  layout      Json     // How to render the form
}

model EntityRecord {
  id          String   @id @default(uuid())
  tenantId    String
  entityDefId String   // Link to "Lead" definition
  data        Jsonb    // The actual dynamic data: { "blood_group": "A+", "budget": 50000 }
  
  // Standard indexed fields for performance
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  status      String
  ownerId     String
}
```

---

## 7. 🏗️ SYSTEM ARCHITECTURE

### Backend (The Brain)
- **Framework**: NestJS (Node.js). Modular, Type-safe.
- **Database**: PostgreSQL (Reliable, JSONB support).
- **Cache**: Redis (Session storage, API caching).
- **Queue**: BullMQ (Email sending, Report generation).

### Frontend (The Face)
- **Framework**: Next.js (React). Fast SSR.
- **State**: React Query (Server state management).
- **UI Library**: Custom System (Tailwind CSS based) using the "Glassmorphism" premium design language.

### API Strategy
- **REST + GraphQL**: Core CRUD via REST. Complex reporting via GraphQL.
- **Webhooks**: `POST /hook/lead-created` -> Zapier/Slack.

---

## 8. 🗺️ DEVELOPMENT ROADMAP (90-Day MVP)

### Month 1: Foundation
- [x] Multi-tenant setup
- [x] Auth & User Management
- [ ] **The Entity Engine V1** (Core task)
- [ ] Basic CRM UI Skeleton

### Month 2: The Logic
- [ ] Dynamic Form Renderer (crucial for Entity Engine)
- [ ] Kanban Board V2 (connected to Entity Engine)
- [ ] Activity Stream & LocalStorage sync to DB
- [ ] Basic "Focus Mode" dashboard

### Month 3: Polish & Launch
- [ ] Email Integration (basic)
- [ ] Reporting Dashboard V1
- [ ] Onboarding Wizard (Industry selection)
- [ ] **Beta Launch** to 5 pilot users.

---

## 9. 📢 POSITIONING
**"The Enterprise Power of SAP. The Design of Apple. The Price of Netflix."**

- **vs Zoho**: "We aren't 50 disjointed apps. We are one fluid system."
- **vs Salesforce**: "We don't need a consultant to set up. Get started in 5 minutes."
- **vs Odoo**: "We look beautiful. Your team will actually *want* to use us."

Alphery OS is the **Operating System for Business Freedom**.

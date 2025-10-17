# **Product Specification – Job Application Tracker MVP**

### **1. Overview**

This MVP is a simple web-based tool to help users (starting with the creator) track job applications efficiently. It automates reminders, status updates, and (optionally) leverages workflow automation to handle deadlines and document generation such as cover letters.

---

### **2. Goals**

* Simplify personal job tracking (applications, interviews, offers).
* Automate repetitive tasks like reminders and archiving.
* Provide an optional backend powered by **Temporal.io** or **IWF (Indeed Workflow Framework)** to manage long-running workflows and automate reminders.

---

### **3. Target User**

* Individual job seekers managing multiple job applications simultaneously.
* (Future expansion: recruiters managing candidate applications.)

---

### **4. Assumptions**

* User has a single account (no authentication needed in MVP; use local storage or single-user backend).
* Each application has one lifecycle workflow.
* The system uses simple UI forms and notifications (in-app and email optional).
* IWF SDK (TS) is unavailable; workflows can be mocked or implemented using Temporal.io directly.
* Cover letter generation will call an **LLM API (e.g., OpenAI API)** with job description + resume as inputs.

---

### **5. Core Features**

#### **A. Add Application**

**Goal:** Capture essential application data and start tracking automatically.

**Inputs:**

* Company name
* Role / Job title
* Job description (text or pasted link)
* Resume (upload or text)
* Application deadline (default = 4 weeks from creation)

**Behavior:**

* Creates an application record in the database.
* Starts a unique workflow instance in Temporal/IWF.
* (Optional) Automatically generates a cover letter draft via LLM API.

**UX Elements:**

* “Add Application” button on dashboard.
* Form modal or separate screen for data entry.
* Confirmation message with timeline visualization (applied → waiting → interview → archived).

---

#### **B. Update Status**

**Goal:** Allow the user to manually update the application stage.

**Inputs:**

* Status (Interview Scheduled / Offer Received / Rejected / Withdrawn)
* Optional note field

**Behavior:**

* Sends a **Signal** or **Query** to the running workflow.
* Updates the application timeline in the UI.
* Cancels pending reminders if final status (e.g., Offer/Rejected) is reached.

**UX Elements:**

* Status dropdown or “Update” button next to each record.
* Color-coded badges for each stage.

---

#### **C. Reminders**

**Goal:** Keep user aware of upcoming or missed deadlines.

**Logic:**

* System checks each active application’s deadline daily.
* If current date ≥ deadline:

  * Sends a **reminder notification** in-app (email optional).
* After a **3-day grace period**, auto-archives the application if no update.

**Behavior:**

* Reminders triggered by workflow timer (Temporal timer or scheduled job).
* Auto-archiving sets `status = Archived` and stops the workflow.

**UX Elements:**

* In-app banner or toast notification: “Your application to [Company] has reached its deadline.”
* Archived applications moved to separate “Archived” tab.

---

#### **D. Auto-Archiving**

**Goal:** Reduce clutter in dashboard by closing inactive applications automatically.

**Behavior:**

* Workflow automatically transitions state after grace period expiration.
* Archived records remain viewable but read-only.

**UX Elements:**

* Archived section toggle.
* Ability to restore manually (optional in MVP).

---

### **6. Workflow Logic (Temporal/IWF)**

**Workflow States:**

1. **Created** → Start workflow, set timers.
2. **Active** → Waiting for signals (status updates).
3. **Remind** → Trigger reminder event if deadline reached.
4. **Grace Period** → Wait extra N days (configurable).
5. **Archived** → End workflow, mark record inactive.

**Signals:**

* `updateStatus(status, note)`
* `extendDeadline(days)`
* `cancelWorkflow()`

**Timers:**

* `deadlineTimer` (4 weeks default)
* `gracePeriodTimer` (3 days after deadline)

---

### **7. Data Model (Example)**

```typescript
Application {
  id: string;
  company: string;
  role: string;
  jobDescription: string;
  resumeLink: string;
  coverLetterLink?: string;
  status: 'Active' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn' | 'Archived';
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### **8. Tech Stack (Proposed)**

* **Frontend:** Next.js (React), Tailwind CSS
* **Backend:** Node.js (Express) or Temporal.io Worker
* **Database:** PostgreSQL (via Prisma ORM)
* **LLM Integration:** OpenAI API (for cover letter generation)
* **Workflow Engine:** Temporal.io (recommended) or mock IWF logic
* **Notifications:** In-app (email optional via SendGrid)

---

### **9. Future Enhancements (Post-MVP)**

* Multi-user accounts and authentication (Auth0 / Supabase Auth).
* Email-based reminders and notifications.
* Job description scraping from LinkedIn / Indeed.
* Analytics dashboard (e.g., offer rate, rejection trends).
* Calendar integration for interview reminders.



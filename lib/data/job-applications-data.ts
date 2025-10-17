export type ApplicationStatus =
  | "Active"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn"
  | "Archived";

export interface Application {
  id: string;
  company: string;
  role: string;
  jobDescription: string;
  resumeLink?: string; // Made optional to match API response
  coverLetterLink?: string;
  status: ApplicationStatus;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  interviewDate?: Date;
  salary?: string;
  location?: string;
  jobType?: "Full-time" | "Part-time" | "Contract" | "Internship";
}

export interface TimelineEvent {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  note?: string;
  timestamp: Date;
}

// Helper function to calculate days until deadline
export function getDaysUntilDeadline(deadline: Date): number {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Helper function to check if deadline is overdue
export function isOverdue(deadline: Date): boolean {
  return getDaysUntilDeadline(deadline) < 0;
}

// Helper function to check if in grace period
export function isInGracePeriod(deadline: Date): boolean {
  const daysOverdue = Math.abs(getDaysUntilDeadline(deadline));
  return isOverdue(deadline) && daysOverdue <= 3;
}

// Mock applications data
export const mockApplications: Application[] = [
  {
    id: "1",
    company: "TechCorp",
    role: "Senior Frontend Engineer",
    jobDescription:
      "We are looking for an experienced frontend engineer to join our team. You will work on building scalable web applications using React, TypeScript, and modern web technologies.",
    resumeLink: "/resumes/resume-1.pdf",
    coverLetterLink: "/cover-letters/cover-1.pdf",
    status: "Interview",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    notes:
      "Had initial phone screen, technical interview scheduled for next week",
    interviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    salary: "$120k - $150k",
    location: "San Francisco, CA (Hybrid)",
    jobType: "Full-time",
  },
  {
    id: "2",
    company: "StartupXYZ",
    role: "Full Stack Developer",
    jobDescription:
      "Join our fast-growing startup as a full stack developer. Work with Node.js, React, and PostgreSQL to build innovative products.",
    resumeLink: "/resumes/resume-1.pdf",
    coverLetterLink: "/cover-letters/cover-2.pdf",
    status: "Active",
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    salary: "$100k - $130k",
    location: "Remote",
    jobType: "Full-time",
  },
  {
    id: "3",
    company: "Enterprise Solutions Inc",
    role: "Software Engineer",
    jobDescription:
      "Looking for a software engineer to work on enterprise-level applications. Experience with Java, Spring Boot, and microservices required.",
    resumeLink: "/resumes/resume-1.pdf",
    coverLetterLink: "/cover-letters/cover-3.pdf",
    status: "Offer",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    notes: "Received offer! Need to respond by deadline",
    salary: "$140k - $160k",
    location: "New York, NY (On-site)",
    jobType: "Full-time",
  },
  {
    id: "4",
    company: "CloudTech",
    role: "DevOps Engineer",
    jobDescription:
      "Seeking a DevOps engineer to manage our cloud infrastructure. AWS, Kubernetes, and Terraform experience preferred.",
    resumeLink: "/resumes/resume-1.pdf",
    coverLetterLink: "/cover-letters/cover-4.pdf",
    status: "Rejected",
    deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (overdue)
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    notes: "Received rejection email - they went with another candidate",
    salary: "$130k - $150k",
    location: "Seattle, WA (Hybrid)",
    jobType: "Full-time",
  },
  {
    id: "5",
    company: "DataCorp",
    role: "Data Engineer",
    jobDescription:
      "Build and maintain data pipelines using Python, Spark, and Airflow. Work with large-scale data processing systems.",
    resumeLink: "/resumes/resume-1.pdf",
    coverLetterLink: "/cover-letters/cover-5.pdf",
    status: "Active",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
    notes: "Deadline approaching - need to follow up",
    salary: "$110k - $140k",
    location: "Austin, TX (Remote)",
    jobType: "Full-time",
  },
  {
    id: "6",
    company: "FinTech Solutions",
    role: "Backend Engineer",
    jobDescription:
      "Work on financial technology solutions using Go and microservices architecture.",
    resumeLink: "/resumes/resume-1.pdf",
    coverLetterLink: "/cover-letters/cover-6.pdf",
    status: "Archived",
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    notes: "Auto-archived after grace period",
    salary: "$125k - $145k",
    location: "Boston, MA (On-site)",
    jobType: "Full-time",
  },
];

// Mock timeline events
export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: "t1",
    applicationId: "1",
    status: "Active",
    note: "Application submitted",
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: "t2",
    applicationId: "1",
    status: "Interview",
    note: "Phone screen completed, moving to technical round",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "t3",
    applicationId: "3",
    status: "Active",
    note: "Application submitted",
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "t4",
    applicationId: "3",
    status: "Interview",
    note: "First round interview",
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
  {
    id: "t5",
    applicationId: "3",
    status: "Offer",
    note: "Offer received! Salary: $140k-$160k",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

// Statistics helper
export function getApplicationStats(applications: Application[]) {
  const active = applications.filter((app) => app.status === "Active").length;
  const interview = applications.filter(
    (app) => app.status === "Interview"
  ).length;
  const offer = applications.filter((app) => app.status === "Offer").length;
  const rejected = applications.filter(
    (app) => app.status === "Rejected"
  ).length;
  const archived = applications.filter(
    (app) => app.status === "Archived"
  ).length;
  const total = applications.length;

  return { active, interview, offer, rejected, archived, total };
}

export const demoResearchUser = {
  id: "res-1",
  fullName: "Dr. Yasmin Ali",
  email: "research@qalinraac.local",
  role: "Research" as const,
  avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Yasmin",
  phone: "+252 61 888 9999",
  bio: "Lead researcher — EdTech outcomes and mobile learning access.",
  registeredAt: "2025-03-15T00:00:00.000Z",
  accountStatus: "Active",
  researchArea: "Education Technology",
};

export const demoResearchStats = {
  totalResearchers: 6,
  activeProjects: 4,
  draftPapers: 5,
  submittedPapers: 3,
  underReview: 4,
  approvedPapers: 7,
  publishedPapers: 12,
};

export type ResearchProjectStatus =
  | "Draft"
  | "Active"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Completed"
  | "Archived";

export const demoResearchProjects = [
  {
    id: "rp1",
    title: "Somali EdTech Outcomes",
    description: "Measuring learning outcomes across LMS cohorts.",
    area: "Education Technology",
    objectives: "Quantify completion and quiz performance trends.",
    methodology: "Mixed methods · surveys + platform analytics",
    researchers: ["Dr. Yasmin Ali", "Ibrahim Nur"],
    startDate: "01 Feb 2026",
    endDate: "30 Nov 2026",
    documents: 4,
    progress: 62,
    status: "Active" as ResearchProjectStatus,
  },
  {
    id: "rp2",
    title: "Mobile Learning Access",
    description: "Barriers to mobile course consumption in Mogadishu.",
    area: "Digital Access",
    objectives: "Identify connectivity and UX constraints.",
    methodology: "Field interviews · 120 participants",
    researchers: ["Ibrahim Nur"],
    startDate: "15 Mar 2026",
    endDate: "15 Sep 2026",
    documents: 2,
    progress: 40,
    status: "Under Review" as ResearchProjectStatus,
  },
  {
    id: "rp3",
    title: "Instructor Facilitation Patterns",
    description: "How instructors structure assignments and feedback.",
    area: "Pedagogy",
    objectives: "Map facilitation patterns to retention.",
    methodology: "Content analysis of course curricula",
    researchers: ["Dr. Yasmin Ali", "Amina Warsame"],
    startDate: "10 Jan 2026",
    endDate: "10 Jul 2026",
    documents: 6,
    progress: 100,
    status: "Completed" as ResearchProjectStatus,
  },
  {
    id: "rp4",
    title: "Certificate Value Perception",
    description: "Employer perception of academy certificates.",
    area: "Workforce",
    objectives: "Assess hiring signal strength.",
    methodology: "Employer survey",
    researchers: ["Amina Warsame"],
    startDate: "01 Sep 2026",
    endDate: "01 Mar 2027",
    documents: 1,
    progress: 15,
    status: "Draft" as ResearchProjectStatus,
  },
];

export type ResearchPaperStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Revision Requested"
  | "Approved"
  | "Rejected"
  | "Final Submission"
  | "Published";

export const demoResearchPapers = [
  {
    id: "paper1",
    title: "LMS Engagement and Quiz Outcomes",
    abstract:
      "This study examines correlations between weekly engagement and quiz averages across 1,200 enrollments.",
    keywords: "engagement, quizzes, LMS",
    area: "Education Technology",
    authors: ["Dr. Yasmin Ali", "Ibrahim Nur"],
    project: "Somali EdTech Outcomes",
    projectId: "rp1",
    document: "engagement-outcomes-v3.pdf",
    references: 28,
    submissionDate: "02 Sep 2026",
    version: "v3",
    status: "Under Review" as ResearchPaperStatus,
    authorIds: ["res-1", "res-2"],
  },
  {
    id: "paper2",
    title: "Connectivity Barriers in Mobile Learning",
    abstract:
      "Field evidence on bandwidth, device type, and completion rates for video lessons.",
    keywords: "mobile, access, bandwidth",
    area: "Digital Access",
    authors: ["Ibrahim Nur"],
    project: "Mobile Learning Access",
    projectId: "rp2",
    document: "mobile-access-v2.docx",
    references: 19,
    submissionDate: "28 Aug 2026",
    version: "v2",
    status: "Revision Requested" as ResearchPaperStatus,
    authorIds: ["res-2"],
  },
  {
    id: "paper3",
    title: "Facilitation Patterns and Retention",
    abstract:
      "Content analysis of instructor assignment design and student retention.",
    keywords: "facilitation, retention, pedagogy",
    area: "Pedagogy",
    authors: ["Dr. Yasmin Ali", "Amina Warsame"],
    project: "Instructor Facilitation Patterns",
    projectId: "rp3",
    document: "facilitation-retention-v1.pdf",
    references: 34,
    submissionDate: "12 Jul 2026",
    version: "v1",
    status: "Published" as ResearchPaperStatus,
    authorIds: ["res-1", "res-3"],
  },
  {
    id: "paper4",
    title: "Certificate Signaling in Hiring",
    abstract: "Draft analysis of employer survey responses.",
    keywords: "certificates, employers, signaling",
    area: "Workforce",
    authors: ["Amina Warsame"],
    project: "Certificate Value Perception",
    projectId: "rp4",
    document: "certificate-signaling-draft.docx",
    references: 8,
    submissionDate: "—",
    version: "v0",
    status: "Draft" as ResearchPaperStatus,
    authorIds: ["res-3"],
  },
  {
    id: "paper5",
    title: "Peer Feedback Loops in Assignments",
    abstract: "Submitted for first review.",
    keywords: "peer feedback, assignments",
    area: "Pedagogy",
    authors: ["Ibrahim Nur", "Dr. Yasmin Ali"],
    project: "Somali EdTech Outcomes",
    projectId: "rp1",
    document: "peer-feedback-v1.pdf",
    references: 15,
    submissionDate: "05 Sep 2026",
    version: "v1",
    status: "Submitted" as ResearchPaperStatus,
    authorIds: ["res-2", "res-1"],
  },
];

export const demoResearchers = [
  {
    id: "res-1",
    name: "Dr. Yasmin Ali",
    email: "research@qalinraac.local",
    area: "Education Technology",
    activeProjects: 2,
    papers: 4,
    publications: 3,
    status: "Active",
  },
  {
    id: "res-2",
    name: "Ibrahim Nur",
    email: "ibrahim@research.local",
    area: "Digital Access",
    activeProjects: 2,
    papers: 3,
    publications: 1,
    status: "Active",
  },
  {
    id: "res-3",
    name: "Amina Warsame",
    email: "amina.w@research.local",
    area: "Workforce",
    activeProjects: 1,
    papers: 2,
    publications: 1,
    status: "Active",
  },
  {
    id: "res-4",
    name: "Omar Said",
    email: "omar@research.local",
    area: "Pedagogy",
    activeProjects: 0,
    papers: 1,
    publications: 0,
    status: "Inactive",
  },
];

export type SubmissionStatus =
  | "Submitted"
  | "Under Review"
  | "Revision Requested"
  | "Resubmitted"
  | "Approved"
  | "Rejected";

export const demoSubmissions = [
  {
    id: "sub1",
    paper: "LMS Engagement and Quiz Outcomes",
    paperId: "paper1",
    researcher: "Dr. Yasmin Ali",
    version: "v3",
    submittedDate: "02 Sep 2026",
    reviewer: "Omar Said",
    status: "Under Review" as SubmissionStatus,
    feedback: "—",
  },
  {
    id: "sub2",
    paper: "Connectivity Barriers in Mobile Learning",
    paperId: "paper2",
    researcher: "Ibrahim Nur",
    version: "v2",
    submittedDate: "28 Aug 2026",
    reviewer: "Dr. Yasmin Ali",
    status: "Revision Requested" as SubmissionStatus,
    feedback: "Expand methodology section and add device-type breakdown.",
  },
  {
    id: "sub3",
    paper: "Peer Feedback Loops in Assignments",
    paperId: "paper5",
    researcher: "Ibrahim Nur",
    version: "v1",
    submittedDate: "05 Sep 2026",
    reviewer: "Amina Warsame",
    status: "Submitted" as SubmissionStatus,
    feedback: "—",
  },
  {
    id: "sub4",
    paper: "Facilitation Patterns and Retention",
    paperId: "paper3",
    researcher: "Dr. Yasmin Ali",
    version: "v1",
    submittedDate: "12 Jul 2026",
    reviewer: "Omar Said",
    status: "Approved" as SubmissionStatus,
    feedback: "Ready for publication.",
  },
];

export const demoReviews = [
  {
    id: "rev1",
    paperId: "paper1",
    paper: "LMS Engagement and Quiz Outcomes",
    researcher: "Dr. Yasmin Ali",
    submittedDate: "02 Sep 2026",
    status: "Under Review",
    abstract:
      "This study examines correlations between weekly engagement and quiz averages across 1,200 enrollments.",
    document: "engagement-outcomes-v3.pdf",
    authorIds: ["res-1", "res-2"],
    assignedReviewerId: "res-4",
  },
  {
    id: "rev2",
    paperId: "paper5",
    paper: "Peer Feedback Loops in Assignments",
    researcher: "Ibrahim Nur",
    submittedDate: "05 Sep 2026",
    status: "Submitted",
    abstract: "Submitted for first review.",
    document: "peer-feedback-v1.pdf",
    authorIds: ["res-2", "res-1"],
    assignedReviewerId: "res-3",
  },
  {
    id: "rev3",
    paperId: "paper2",
    paper: "Connectivity Barriers in Mobile Learning",
    researcher: "Ibrahim Nur",
    submittedDate: "28 Aug 2026",
    status: "Revision Requested",
    abstract:
      "Field evidence on bandwidth, device type, and completion rates for video lessons.",
    document: "mobile-access-v2.docx",
    authorIds: ["res-2"],
    assignedReviewerId: "res-1",
  },
];

export type PublicationStatus =
  | "Approved"
  | "Ready for Publication"
  | "Published"
  | "Archived";

export const demoPublications = [
  {
    id: "pub1",
    title: "Facilitation Patterns and Retention",
    authors: ["Dr. Yasmin Ali", "Amina Warsame"],
    area: "Pedagogy",
    publicationDate: "01 Aug 2026",
    doi: "10.qalinraac/edu.2026.081",
    document: "facilitation-retention-v1.pdf",
    status: "Published" as PublicationStatus,
  },
  {
    id: "pub2",
    title: "Cohort Completion Predictors",
    authors: ["Dr. Yasmin Ali"],
    area: "Education Technology",
    publicationDate: "—",
    doi: "pending",
    document: "completion-predictors-final.pdf",
    status: "Ready for Publication" as PublicationStatus,
  },
  {
    id: "pub3",
    title: "Assignment Rubric Clarity Study",
    authors: ["Omar Said"],
    area: "Pedagogy",
    publicationDate: "—",
    doi: "pending",
    document: "rubric-clarity.pdf",
    status: "Approved" as PublicationStatus,
  },
];

export const demoResearchResources = [
  {
    id: "rr1",
    title: "Research Guidelines 2026",
    type: "Guidelines",
    format: "PDF",
    updatedAt: "01 Jan 2026",
  },
  {
    id: "rr2",
    title: "Paper Submission Template",
    type: "Template",
    format: "DOCX",
    updatedAt: "12 Feb 2026",
  },
  {
    id: "rr3",
    title: "Methodology Handbook",
    type: "Methodology",
    format: "PDF",
    updatedAt: "05 Mar 2026",
  },
  {
    id: "rr4",
    title: "Target Journals List",
    type: "Journals",
    format: "XLSX",
    updatedAt: "20 Apr 2026",
  },
  {
    id: "rr5",
    title: "Reference Style Guide",
    type: "Reference",
    format: "PDF",
    updatedAt: "08 May 2026",
  },
  {
    id: "rr6",
    title: "Research Ethics Policy",
    type: "Policy",
    format: "PDF",
    updatedAt: "01 Jun 2026",
  },
];

export const demoResearchReports = {
  researchers: { total: 6, active: 5 },
  projects: { total: 12, active: 4, completed: 5 },
  papers: {
    total: 31,
    draft: 5,
    underReview: 4,
    approved: 7,
    rejected: 2,
    published: 12,
  },
};

export const demoResearchNotifications = [
  {
    id: "rn1",
    actor: "Submissions",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Sub",
    message:
      "📄 New Research Submission — Peer Feedback Loops in Assignments (v1).",
    time: "about 2 hours ago",
    read: false,
  },
  {
    id: "rn2",
    actor: "Reviews",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Rev",
    message:
      "🔍 Paper Under Review — LMS Engagement and Quiz Outcomes assigned to Omar Said.",
    time: "about 5 hours ago",
    read: false,
  },
  {
    id: "rn3",
    actor: "Revisions",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Revise",
    message:
      "✏️ Revision Requested — Connectivity Barriers in Mobile Learning.",
    time: "about 1 day ago",
    read: true,
  },
  {
    id: "rn4",
    actor: "Publications",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Pub",
    message: "📗 Publication Ready — Cohort Completion Predictors.",
    time: "about 3 days ago",
    read: true,
  },
];

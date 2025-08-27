// App-wide constants and mock data
export const APP_CONFIG = {
  name: 'LearnSmart',
  description: 'Advanced educational platform for students and instructors',
} as const

// Theme colors (matching Flutter app)
export const COLORS = {
  primary: '#2563eb', // Blue theme color
  secondary: '#f8fafc', // Light background
  light: '#ffffff', // Alternative light background
} as const

// Mock data for criminology platform
export const MOCK_STATS = [
  {
    title: "Total Students",
    value: "409",
    change: "+12.3%",
    changeType: "positive",
  },
  {
    title: "Active Courses", 
    value: "6",
    change: "+5.2%",
    changeType: "positive",
  },
  {
    title: "Mock Exam Average Score",
    value: "68.9%",
    change: "+3.1%",
    changeType: "positive", 
  },
  {
    title: "Completion Rate",
    value: "59%",
    change: "+8.7%",
    changeType: "positive",
  },
] as const

export const MOCK_ACTIVITIES = [
  { user: "Maria Santos", action: "completed Criminal Law Module 1", time: "30 minutes ago" },
  { user: "Juan Dela Cruz", action: "started Active Recall session", time: "1 hour ago" },
  { user: "Anna Reyes", action: "failed quiz - remedial path triggered", time: "2 hours ago" },
  { user: "Jose Garcia", action: "achieved 85% in Criminal Procedure", time: "3 hours ago" },
  { user: "Lisa Torres", action: "enrolled in Criminology Review", time: "4 hours ago" },
] as const

export const MOCK_COURSES = [
  { course: "Criminal Jurisprudence and Procedure", students: 73, progress: 68, status: "active" },
  { course: "Law Enforcement Administration", students: 65, progress: 72, status: "active" },
  { course: "Crime Detection and Investigation", students: 58, progress: 45, status: "active" },
  { course: "Correctional Administration", students: 52, progress: 62, status: "active" },
  { course: "Criminalistic", students: 48, progress: 55, status: "active" },
  { course: "Criminology", students: 71, progress: 78, status: "active" },
] as const

// Criminology-specific mock data
export const CRIMINOLOGY_MODULES = [
  {
    id: "1",
    title: "Introduction to Philippine Criminal Justice System",
    description: "Learn the principles of criminal law and the legal process, including investigation, trial, and sentencing.",
    status: "active",
    enrolledStudents: 73,
    progress: 68,
    topics: ["Criminal Law Basics", "Court System", "Investigation Process", "Sentencing Guidelines"]
  },
  {
    id: "2", 
    title: "Revised Penal Code",
    description: "Comprehensive study of Philippine criminal laws and penalties.",
    status: "active",
    enrolledStudents: 65,
    progress: 72,
    topics: ["Felonies", "Circumstances", "Penalties", "Criminal Liability"]
  },
  {
    id: "3",
    title: "Municipal Law vs International Law",
    description: "Understanding the relationship between local and international legal frameworks.",
    status: "active", 
    enrolledStudents: 58,
    progress: 45,
    topics: ["Sovereignty", "Treaties", "Jurisdiction", "Conflict of Laws"]
  }
] as const

export const STUDY_TECHNIQUES = [
  {
    name: "Active Recall",
    description: "AI-generated flashcards before material review",
    usage: "35%",
    effectiveness: "87%"
  },
  {
    name: "Pomodoro Technique", 
    description: "25min study + 5min break cycles",
    usage: "28%",
    effectiveness: "82%"
  },
  {
    name: "Feynman Technique",
    description: "Explain concepts in your own words",
    usage: "22%", 
    effectiveness: "90%"
  },
  {
    name: "Retrieval Practice",
    description: "Immediate quizzes after reading",
    usage: "15%",
    effectiveness: "85%"
  }
] as const

export const AT_RISK_STUDENTS = [
  {
    name: "Anna Reyes",
    email: "anna.reyes@email.com",
    riskLevel: "High",
    avgScore: "45%",
    lastActive: "2 days ago",
    weakAreas: ["Criminal Negligence", "Criminal Procedure"]
  },
  {
    name: "Carlos Santos",
    email: "carlos.santos@email.com", 
    riskLevel: "Medium",
    avgScore: "62%",
    lastActive: "1 day ago",
    weakAreas: ["Constitutional Law"]
  }
] as const

// Mock users data for criminology platform
export const MOCK_USERS = [
  { id: 1, name: "Maria Santos", email: "maria.santos@email.com", role: "Student", status: "Active", lastActive: "30 minutes ago", courses: 3, avgScore: "78%", riskLevel: "Low" },
  { id: 2, name: "Prof. Juan Dela Cruz", email: "juan.delacruz@email.com", role: "Instructor", status: "Active", lastActive: "1 hour ago", courses: 2, specialty: "Criminal Law" },
  { id: 3, name: "Anna Reyes", email: "anna.reyes@email.com", role: "Student", status: "Active", lastActive: "2 days ago", courses: 2, avgScore: "45%", riskLevel: "High" },
  { id: 4, name: "Jose Garcia", email: "jose.garcia@email.com", role: "Student", status: "Active", lastActive: "1 hour ago", courses: 4, avgScore: "85%", riskLevel: "Low" },
  { id: 5, name: "Dr. Rosa Martinez", email: "rosa.martinez@email.com", role: "Instructor", status: "Active", lastActive: "3 hours ago", courses: 1, specialty: "Criminal Procedure" },
  { id: 6, name: "Lisa Torres", email: "lisa.torres@email.com", role: "Student", status: "Active", lastActive: "4 hours ago", courses: 2, avgScore: "72%", riskLevel: "Low" },
  { id: 7, name: "Carlos Santos", email: "carlos.santos@email.com", role: "Student", status: "Active", lastActive: "1 day ago", courses: 1, avgScore: "62%", riskLevel: "Medium" },
  { id: 8, name: "Prof. Elena Rodriguez", email: "elena.rodriguez@email.com", role: "Instructor", status: "Active", lastActive: "2 hours ago", courses: 3, specialty: "Criminology" },
  { id: 9, name: "Miguel Fernandez", email: "miguel.fernandez@email.com", role: "Student", status: "Inactive", lastActive: "1 week ago", courses: 1, avgScore: "58%", riskLevel: "High" },
  { id: 10, name: "Sofia Morales", email: "sofia.morales@email.com", role: "Student", status: "Active", lastActive: "2 hours ago", courses: 3, avgScore: "80%", riskLevel: "Low" },
] as const

export const USER_ROLES = [
  "All",
  "Student", 
  "Instructor",
  "Admin"
] as const

export const USER_STATS = {
  totalUsers: 409,
  activeStudents: 367,
  instructors: 15,
  pendingReviews: 8
} as const

// Instructor-specific mock data
export const INSTRUCTOR_COURSE = {
  id: "1",
  title: "Criminal Jurisprudence and Procedure",
  instructor: "Prof. Juan Dela Cruz",
  description: "Comprehensive study of Philippine criminal law and legal procedures",
  totalStudents: 73,
  activeStudents: 68,
  completionRate: 68,
  averageScore: 72.5,
  modules: [
    {
      id: "1",
      title: "Introduction to Criminal Law",
      status: "published",
      studentsCompleted: 58,
      averageScore: 78,
      difficulty: "Beginner"
    },
    {
      id: "2", 
      title: "Elements of Crime",
      status: "published",
      studentsCompleted: 52,
      averageScore: 74,
      difficulty: "Intermediate"
    },
    {
      id: "3",
      title: "Criminal Procedure",
      status: "draft",
      studentsCompleted: 35,
      averageScore: 65,
      difficulty: "Advanced"
    }
  ]
} as const

export const INSTRUCTOR_STUDENTS = [
  {
    id: 1,
    name: "Maria Santos",
    email: "maria.santos@email.com", 
    progress: 78,
    lastActive: "30 minutes ago",
    avgScore: 78,
    riskLevel: "Low",
    strongAreas: ["Criminal Law Basics", "Court System"],
    weakAreas: ["Criminal Procedure"],
    studySessions: 24,
    streak: 7
  },
  {
    id: 2,
    name: "Anna Reyes",
    email: "anna.reyes@email.com",
    progress: 45,
    lastActive: "2 days ago",
    avgScore: 45,
    riskLevel: "High", 
    strongAreas: ["Investigation Process"],
    weakAreas: ["Criminal Negligence", "Constitutional Law"],
    studySessions: 8,
    streak: 0
  },
  {
    id: 3,
    name: "Jose Garcia",
    email: "jose.garcia@email.com",
    progress: 85,
    lastActive: "1 hour ago", 
    avgScore: 85,
    riskLevel: "Low",
    strongAreas: ["Criminal Jurisprudence", "Legal Writing"],
    weakAreas: ["Case Analysis"],
    studySessions: 32,
    streak: 12
  },
  {
    id: 4,
    name: "Carlos Santos", 
    email: "carlos.santos@email.com",
    progress: 62,
    lastActive: "1 day ago",
    avgScore: 62,
    riskLevel: "Medium",
    strongAreas: ["Evidence", "Investigation"],
    weakAreas: ["Constitutional Law", "Legal Ethics"],
    studySessions: 18,
    streak: 3
  }
] as const

// Note: INSTRUCTOR_STATS has been removed - all instructor statistics now come from real database data via API calls
// This ensures accurate, real-time information about enrolled students rather than mock data

export const INSTRUCTOR_RECENT_ACTIVITIES = [
  { student: "Maria Santos", action: "completed Module 2: Elements of Crime", time: "30 minutes ago", type: "completion" },
  { student: "Jose Garcia", action: "scored 90% on Criminal Procedure quiz", time: "1 hour ago", type: "achievement" },
  { student: "Anna Reyes", action: "missed deadline for Assignment 3", time: "2 hours ago", type: "alert" },
  { student: "Carlos Santos", action: "requested help with Constitutional Law", time: "3 hours ago", type: "support" },
  { student: "Lisa Torres", action: "started Active Recall study session", time: "4 hours ago", type: "activity" },
] as const

export const TEACHING_INSIGHTS = [
  {
    title: "High-Performing Study Technique",
    description: "Students using Feynman Technique show 23% higher retention in Criminal Procedure topics",
    type: "success",
    action: "Recommend to struggling students"
  },
  {
    title: "Content Gap Identified", 
    description: "8 students struggling with Constitutional Law concepts. Consider creating remedial content",
    type: "warning", 
    action: "Generate AI content"
  },
  {
    title: "Engagement Opportunity",
    description: "Students most active during 7-9 PM. Schedule live sessions for maximum participation",
    type: "info",
    action: "Schedule sessions"
  }
] as const

// Landing page content
export const LANDING_FEATURES = [
  {
    title: "AI-Powered Active Recall",
    description: "Intelligent flashcards generated before you study. Our AI creates targeted questions based on your reading material to maximize retention.",
    icon: "brain",
    stats: "87% effectiveness rate"
  },
  {
    title: "Feynman Technique",
    description: "Master complex criminology concepts by explaining them in your own words. Perfect for understanding legal principles and procedures.",
    icon: "message",
    stats: "90% effectiveness rate"
  },
  {
    title: "Pomodoro Study Sessions",
    description: "Structured 25-minute study blocks with smart breaks. Optimized for criminology coursework and exam preparation.",
    icon: "clock",
    stats: "82% effectiveness rate"
  },
  {
    title: "Retrieval Practice",
    description: "Immediate quizzes after reading to reinforce learning. Adaptive questioning based on your comprehension level.",
    icon: "target",
    stats: "85% effectiveness rate"
  }
] as const

export const LANDING_TESTIMONIALS = [
  {
    name: "Maria Santos",
    role: "Criminology Student",
    quote: "LearnSmart's Active Recall feature helped me increase my Criminal Law exam score from 65% to 85%. The AI-generated questions were spot-on!",
    rating: 5,
    course: "Criminal Jurisprudence"
  },
  {
    name: "Jose Garcia", 
    role: "Final Year Student",
    quote: "The Feynman Technique made complex legal concepts so much clearer. I finally understand Constitutional Law principles that confused me for months.",
    rating: 5,
    course: "Constitutional Law"
  },
  {
    name: "Anna Reyes",
    role: "Pre-Board Student",
    quote: "Using Pomodoro sessions for studying Criminal Procedure helped me stay focused and retain more information. My grades improved dramatically!",
    rating: 5,
    course: "Criminal Procedure"
  }
] as const

export const LANDING_STATS = [
  {
    number: "409",
    label: "Active Students",
    description: "Criminology students using LearnSmart"
  },
  {
    number: "6",
    label: "Core Courses", 
    description: "Complete criminology curriculum covered"
  },
  {
    number: "85%",
    label: "Pass Rate",
    description: "Students pass board exams after using LearnSmart"
  },
  {
    number: "23%",
    label: "Score Improvement",
    description: "Average grade increase with our study techniques"
  }
] as const

export const LANDING_NAVIGATION = [
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Success Stories", href: "#testimonials" }
] as const

export const FOOTER_LINKS = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Study Techniques", href: "#techniques" },
    { name: "Courses", href: "#courses" },
    { name: "Mobile App", href: "#mobile" }
  ],
  company: [
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
    { name: "Blog", href: "#blog" },
    { name: "Careers", href: "#careers" }
  ],
  legal: [
    { name: "Privacy Policy", href: "#privacy" },
    { name: "Terms of Service", href: "#terms" },
    { name: "Cookie Policy", href: "#cookies" }
  ]
} as const
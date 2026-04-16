export const students = [
  { id: 1, name: "Emma Johnson", grade: "10A", email: "emma.j@school.edu", status: "active", gpa: 3.8, attendance: 96 },
  { id: 2, name: "Liam Williams", grade: "11B", email: "liam.w@school.edu", status: "active", gpa: 3.5, attendance: 92 },
  { id: 3, name: "Olivia Brown", grade: "9C", email: "olivia.b@school.edu", status: "active", gpa: 3.9, attendance: 98 },
  { id: 4, name: "Noah Davis", grade: "12A", email: "noah.d@school.edu", status: "inactive", gpa: 2.8, attendance: 78 },
  { id: 5, name: "Ava Martinez", grade: "10B", email: "ava.m@school.edu", status: "active", gpa: 4.0, attendance: 99 },
  { id: 6, name: "Ethan Wilson", grade: "11A", email: "ethan.w@school.edu", status: "active", gpa: 3.2, attendance: 88 },
  { id: 7, name: "Sophia Anderson", grade: "9A", email: "sophia.a@school.edu", status: "active", gpa: 3.7, attendance: 94 },
  { id: 8, name: "Mason Taylor", grade: "12B", email: "mason.t@school.edu", status: "active", gpa: 3.6, attendance: 91 },
  { id: 9, name: "Isabella Thomas", grade: "10C", email: "isabella.t@school.edu", status: "inactive", gpa: 2.5, attendance: 70 },
  { id: 10, name: "James Jackson", grade: "11C", email: "james.j@school.edu", status: "active", gpa: 3.3, attendance: 85 },
];

export const teachers = [
  { id: 1, name: "Dr. Sarah Mitchell", subject: "Mathematics", email: "s.mitchell@school.edu", status: "active", classes: 4, experience: 12 },
  { id: 2, name: "Mr. Robert Chen", subject: "Physics", email: "r.chen@school.edu", status: "active", classes: 3, experience: 8 },
  { id: 3, name: "Ms. Patricia Lewis", subject: "English Literature", email: "p.lewis@school.edu", status: "active", classes: 5, experience: 15 },
  { id: 4, name: "Mr. David Kim", subject: "History", email: "d.kim@school.edu", status: "active", classes: 4, experience: 10 },
  { id: 5, name: "Dr. Jennifer Scott", subject: "Chemistry", email: "j.scott@school.edu", status: "active", classes: 3, experience: 11 },
  { id: 6, name: "Mr. Michael Torres", subject: "Physical Education", email: "m.torres@school.edu", status: "inactive", classes: 6, experience: 7 },
  { id: 7, name: "Ms. Amanda Harris", subject: "Art", email: "a.harris@school.edu", status: "active", classes: 4, experience: 9 },
  { id: 8, name: "Mr. Christopher White", subject: "Computer Science", email: "c.white@school.edu", status: "active", classes: 3, experience: 6 },
];

export const classes = [
  { id: 1, name: "Mathematics 10A", teacher: "Dr. Sarah Mitchell", students: 28, room: "101", schedule: "Mon/Wed/Fri 9:00-10:00", subject: "Mathematics" },
  { id: 2, name: "Physics 11B", teacher: "Mr. Robert Chen", students: 24, room: "Lab 2", schedule: "Tue/Thu 10:00-11:30", subject: "Physics" },
  { id: 3, name: "English Lit 9C", teacher: "Ms. Patricia Lewis", students: 30, room: "205", schedule: "Mon/Wed/Fri 11:00-12:00", subject: "English" },
  { id: 4, name: "History 12A", teacher: "Mr. David Kim", students: 22, room: "302", schedule: "Tue/Thu 13:00-14:30", subject: "History" },
  { id: 5, name: "Chemistry 11A", teacher: "Dr. Jennifer Scott", students: 26, room: "Lab 1", schedule: "Mon/Wed 14:00-15:30", subject: "Chemistry" },
  { id: 6, name: "Computer Science 10B", teacher: "Mr. Christopher White", students: 20, room: "CS Lab", schedule: "Fri 13:00-15:00", subject: "CS" },
];

export const attendanceData = [
  { date: "2024-03-11", present: 245, absent: 18, late: 7 },
  { date: "2024-03-12", present: 252, absent: 12, late: 6 },
  { date: "2024-03-13", present: 238, absent: 25, late: 7 },
  { date: "2024-03-14", present: 248, absent: 16, late: 6 },
  { date: "2024-03-15", present: 255, absent: 10, late: 5 },
  { date: "2024-03-18", present: 243, absent: 20, late: 7 },
  { date: "2024-03-19", present: 250, absent: 14, late: 6 },
];

export const gradeDistribution = [
  { grade: "A", name: "A (87)", count: 87, color: "#3b82f6" },
  { grade: "B", name: "B (124)", count: 124, color: "#22c55e" },
  { grade: "C", name: "C (68)", count: 68, color: "#f59e0b" },
  { grade: "D", name: "D (31)", count: 31, color: "#ef4444" },
  { grade: "F", name: "F (12)", count: 12, color: "#6b7280" },
];

export const enrollmentTrend = [
  { month: "Sep", students: 245 },
  { month: "Oct", students: 252 },
  { month: "Nov", students: 258 },
  { month: "Dec", students: 255 },
  { month: "Jan", students: 262 },
  { month: "Feb", students: 268 },
  { month: "Mar", students: 270 },
];

export const recentActivities = [
  { id: 1, type: "enrollment", message: "New student Emma Johnson enrolled in Grade 10A", time: "2 minutes ago" },
  { id: 2, type: "grade", message: "Grades submitted for Mathematics 10A", time: "15 minutes ago" },
  { id: 3, type: "attendance", message: "Attendance marked for all classes", time: "1 hour ago" },
  { id: 4, type: "teacher", message: "Mr. Robert Chen added a new assignment", time: "2 hours ago" },
  { id: 5, type: "class", message: "Chemistry Lab session rescheduled to Friday", time: "3 hours ago" },
];

export const scheduleData = [
  { id: 1, time: "08:00 - 09:00", monday: "Mathematics 10A", tuesday: "Physics 11B", wednesday: "Mathematics 10A", thursday: "Physics 11B", friday: "Chemistry 11A", room: "101" },
  { id: 2, time: "09:00 - 10:00", monday: "English Lit 9C", tuesday: "History 12A", wednesday: "English Lit 9C", thursday: "History 12A", friday: "English Lit 9C", room: "205" },
  { id: 3, time: "10:00 - 11:00", monday: "Chemistry 11A", tuesday: "CS 10B", wednesday: "Chemistry 11A", thursday: "CS 10B", friday: "Mathematics 10A", room: "Lab 1" },
  { id: 4, time: "11:00 - 12:00", monday: "History 12A", tuesday: "English Lit 9C", wednesday: "Physics 11B", thursday: "Mathematics 10A", friday: "Physics 11B", room: "302" },
  { id: 5, time: "13:00 - 14:00", monday: "CS 10B", tuesday: "Chemistry 11A", wednesday: "History 12A", thursday: "English Lit 9C", friday: "CS 10B", room: "CS Lab" },
  { id: 6, time: "14:00 - 15:00", monday: "Physics 11B", tuesday: "Mathematics 10A", wednesday: "CS 10B", thursday: "Chemistry 11A", friday: "History 12A", room: "Lab 2" },
];

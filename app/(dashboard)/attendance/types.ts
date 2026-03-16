export interface ClassAttendanceSummary {
  classId: string;
  className: string;
  gradeName: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
  recorded: boolean;
}

export interface WeeklyTrend {
  date: string;
  dayName: string;
  rate: number;
  present: number;
  total: number;
}

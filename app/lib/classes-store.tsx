"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase, timeAgo } from "./supabase";
import {
  TEACHERS_SEED,
  type Announcement,
  type Assignment,
  type Classe,
  type Course,
  type Grade,
  type Person,
  type StreamPost,
  type Student,
  type Teacher,
} from "./mock-data";

/* ============================================================
   DB ↔ App type converters
   ============================================================ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToClasse(r: any): Classe {
  return {
    id: r.id,
    name: r.name,
    level: r.level,
    section: r.section,
    studentCount: r.student_count,
    accent: r.accent,
    emoji: r.emoji,
  };
}
function classeToDb(c: Classe) {
  return {
    id: c.id,
    name: c.name,
    level: c.level,
    section: c.section,
    student_count: c.studentCount,
    accent: c.accent,
    emoji: c.emoji,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToCourse(r: any): Course {
  return {
    id: r.id,
    classeId: r.classe_id,
    name: r.name,
    teacher: r.teacher,
    accent: r.accent,
    emoji: r.emoji,
    progress: r.progress,
  };
}
function courseToDb(c: Course) {
  return {
    id: c.id,
    classe_id: c.classeId,
    name: c.name,
    teacher: c.teacher,
    accent: c.accent,
    emoji: c.emoji,
    progress: c.progress,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToStudent(r: any): Student {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    classeId: r.classe_id,
    emoji: r.emoji,
    birthDate: r.birth_date,
    parentName: r.parent_name,
    parentPhone: r.parent_phone,
    email: r.email,
  };
}
function studentToDb(s: Student) {
  return {
    id: s.id,
    first_name: s.firstName,
    last_name: s.lastName,
    classe_id: s.classeId,
    emoji: s.emoji,
    birth_date: s.birthDate,
    parent_name: s.parentName,
    parent_phone: s.parentPhone,
    email: s.email,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToGrade(r: any): Grade {
  return { studentId: r.student_id, assignmentId: r.assignment_id, score: r.score };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToAnnouncement(r: any): Announcement {
  return {
    id: r.id,
    author: r.author,
    role: r.role,
    body: r.body,
    when: r.created_at ? timeAgo(r.created_at) : "—",
    classeId: r.classe_id ?? undefined,
    courseId: r.course_id ?? undefined,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToAssignment(r: any): Assignment {
  return {
    id: r.id,
    title: r.title,
    courseId: r.course_id,
    dueLabel: r.due_label,
    done: r.done,
  };
}
export type ScheduleSlot = {
  id: string;
  classeId: string;
  dayOfWeek: number; // 0=Lundi, 1=Mardi, ..., 5=Samedi
  startTime: string; // "08:00"
  endTime: string;   // "09:00"
  subject: string;
  teacher: string;
  room: string;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToScheduleSlot(r: any): ScheduleSlot {
  return {
    id: r.id,
    classeId: r.classe_id,
    dayOfWeek: r.day_of_week,
    startTime: r.start_time,
    endTime: r.end_time,
    subject: r.subject,
    teacher: r.teacher ?? "",
    room: r.room ?? "",
  };
}
function scheduleSlotToDb(s: ScheduleSlot) {
  return {
    id: s.id,
    classe_id: s.classeId,
    day_of_week: s.dayOfWeek,
    start_time: s.startTime,
    end_time: s.endTime,
    subject: s.subject,
    teacher: s.teacher || null,
    room: s.room || null,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToStreamPost(r: any): StreamPost {
  return {
    id: r.id,
    courseId: r.course_id,
    author: r.author,
    role: r.role,
    when: r.created_at ? timeAgo(r.created_at) : "—",
    body: r.body,
    kind: r.kind,
    title: r.title ?? undefined,
  };
}

/* ============================================================
   Store type
   ============================================================ */
type StoreValue = {
  ready: boolean;
  classes: Classe[];
  courses: Course[];
  announcements: Announcement[];
  assignments: Assignment[];
  stream: StreamPost[];
  people: Record<string, Person[]>;
  students: Student[];
  teachers: Teacher[];
  grades: Grade[];
  schedule: ScheduleSlot[];

  findClasse: (id?: string | null) => Classe | undefined;
  findStudent: (id?: string | null) => Student | undefined;
  findTeacher: (id?: string | null) => Teacher | undefined;
  coursesByClasse: (classeId: string) => Course[];
  announcementsForClasse: (classeId: string) => Announcement[];
  assignmentsForClasse: (classeId: string) => Assignment[];
  studentsByClasse: (classeId: string) => Student[];
  coursesByTeacher: (teacherId: string) => Course[];
  classesByTeacher: (teacherId: string) => Classe[];
  gradeFor: (studentId: string, assignmentId: string) => number | undefined;
  gradesByStudent: (studentId: string) => Grade[];
  scheduleByClasse: (classeId: string) => ScheduleSlot[];

  addClasse: (data: Omit<Classe, "id">) => Promise<{ classe: Classe; error: string | null }>;
  updateClasse: (id: string, patch: Partial<Omit<Classe, "id">>) => void;
  removeClasse: (id: string) => void;
  addCourse: (data: Omit<Course, "id">) => Course;
  removeCourse: (id: string) => void;
  addStudent: (data: Omit<Student, "id">) => Student;
  updateStudent: (id: string, patch: Partial<Omit<Student, "id">>) => void;
  removeStudent: (id: string) => void;
  setGrade: (studentId: string, assignmentId: string, score: number | null) => void;
  addAnnouncement: (data: Omit<Announcement, "id" | "when">) => Announcement;
  addAssignment: (data: Omit<Assignment, "id">) => Assignment;
  addStreamPost: (data: Omit<StreamPost, "id" | "when">) => StreamPost;
  addScheduleSlot: (data: Omit<ScheduleSlot, "id">) => ScheduleSlot;
  updateScheduleSlot: (id: string, patch: Partial<Omit<ScheduleSlot, "id">>) => void;
  removeScheduleSlot: (id: string) => void;
  refresh: () => Promise<void>;
  resetAll: () => void;
};

const Ctx = createContext<StoreValue | null>(null);

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30) || `c-${Date.now().toString(36)}`;
}
function uniqueId(base: string, existing: Set<string>) {
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export function ClassesProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stream, setStream] = useState<StreamPost[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);

  /* ---- Initial load ---- */
  useEffect(() => {
    // Fallback : on débloque l'app même si Supabase traîne
    const timeout = setTimeout(() => setReady(true), 5000);
    async function load() {
      try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safe = async (q: PromiseLike<any>): Promise<{ data: any[] }> => {
        try {
          const r = await q;
          return { data: r?.data ?? [] };
        } catch {
          return { data: [] };
        }
      };
      const [
        { data: cls },
        { data: crs },
        { data: sts },
        { data: grd },
        { data: ann },
        { data: asg },
        { data: stm },
        { data: sch },
      ] = await Promise.all([
        safe(supabase.from("classes").select("*").order("created_at")),
        safe(supabase.from("courses").select("*").order("created_at")),
        safe(supabase.from("students").select("*").order("first_name")),
        safe(supabase.from("grades").select("*")),
        safe(supabase.from("announcements").select("*").order("created_at", { ascending: false })),
        safe(supabase.from("assignments").select("*").order("created_at", { ascending: false })),
        safe(supabase.from("stream_posts").select("*").order("created_at", { ascending: false })),
        safe(supabase.from("schedule_slots").select("*")),
      ]);

      // No more auto-seed — admin creates everything manually
      setClasses((cls ?? []).map(dbToClasse));
      setCourses((crs ?? []).map(dbToCourse));
      setStudents((sts ?? []).map(dbToStudent));
      setGrades((grd ?? []).map(dbToGrade));
      setAnnouncements((ann ?? []).map(dbToAnnouncement));
      setAssignments((asg ?? []).map(dbToAssignment));
      setStream((stm ?? []).map(dbToStreamPost));
      setSchedule((sch ?? []).map(dbToScheduleSlot));
      } catch {
        /* ignore — ready sera mis à true ci-dessous */
      } finally {
        clearTimeout(timeout);
        setReady(true);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Real-time subscriptions ---- */
  useEffect(() => {
    const channel = supabase
      .channel("db-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "grades" }, async () => {
        const { data } = await supabase.from("grades").select("*");
        setGrades((data ?? []).map(dbToGrade));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, async () => {
        const { data } = await supabase.from("students").select("*").order("first_name");
        setStudents((data ?? []).map(dbToStudent));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, async () => {
        const { data } = await supabase.from("classes").select("*").order("created_at");
        setClasses((data ?? []).map(dbToClasse));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, async () => {
        const { data } = await supabase.from("courses").select("*").order("created_at");
        setCourses((data ?? []).map(dbToCourse));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, (payload) => {
        setAnnouncements((prev) => [dbToAnnouncement(payload.new), ...prev]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "stream_posts" }, (payload) => {
        setStream((prev) => [dbToStreamPost(payload.new), ...prev]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "assignments" }, (payload) => {
        setAssignments((prev) => [dbToAssignment(payload.new), ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ---- Selectors ---- */
  const findClasse = useCallback(
    (id?: string | null) => (id ? classes.find((c) => c.id === id) : undefined),
    [classes]
  );
  const findStudent = useCallback(
    (id?: string | null) => (id ? students.find((s) => s.id === id) : undefined),
    [students]
  );
  const findTeacher = useCallback(
    (id?: string | null) => (id ? TEACHERS_SEED.find((t) => t.id === id) : undefined),
    []
  );
  const coursesByClasse = useCallback(
    (classeId: string) => courses.filter((c) => c.classeId === classeId),
    [courses]
  );
  const studentsByClasse = useCallback(
    (classeId: string) => students.filter((s) => s.classeId === classeId),
    [students]
  );
  const announcementsForClasse = useCallback(
    (classeId: string) =>
      announcements.filter((a) => !a.classeId || a.classeId === classeId),
    [announcements]
  );
  const assignmentsForClasse = useCallback(
    (classeId: string) => {
      const ids = new Set(courses.filter((c) => c.classeId === classeId).map((c) => c.id));
      return assignments.filter((a) => ids.has(a.courseId));
    },
    [assignments, courses]
  );
  const coursesByTeacher = useCallback(
    (teacherId: string) => {
      const t = TEACHERS_SEED.find((x) => x.id === teacherId);
      if (!t) return [];
      return courses.filter((c) => c.teacher === t.name && t.classeIds.includes(c.classeId));
    },
    [courses]
  );
  const classesByTeacher = useCallback(
    (teacherId: string) => {
      const t = TEACHERS_SEED.find((x) => x.id === teacherId);
      if (!t) return [];
      return classes.filter((c) => t.classeIds.includes(c.id));
    },
    [classes]
  );
  const gradeFor = useCallback(
    (studentId: string, assignmentId: string) =>
      grades.find((g) => g.studentId === studentId && g.assignmentId === assignmentId)?.score,
    [grades]
  );
  const gradesByStudent = useCallback(
    (studentId: string) => grades.filter((g) => g.studentId === studentId),
    [grades]
  );

  const teachers = useMemo(() => TEACHERS_SEED, []);

  const scheduleByClasse = useCallback(
    (classeId: string) => schedule.filter((s) => s.classeId === classeId),
    [schedule]
  );

  /* ---- Mutations ---- */
  const addClasse = useCallback(
    async (data: Omit<Classe, "id">): Promise<{ classe: Classe; error: string | null }> => {
      const existing = new Set(classes.map((c) => c.id));
      const id = uniqueId(slugify(data.name), existing);
      const classe: Classe = { ...data, id };
      setClasses((cs) => [...cs, classe]);
      const { error } = await supabase.from("classes").insert(classeToDb(classe));
      if (error) {
        // Annule l'ajout local si la DB a rejeté
        setClasses((cs) => cs.filter((c) => c.id !== id));
        return { classe, error: error.message };
      }
      return { classe, error: null };
    },
    [classes]
  );

  const addCourse = useCallback(
    (data: Omit<Course, "id">) => {
      const existing = new Set(courses.map((c) => c.id));
      const id = uniqueId(slugify(`${data.classeId}-${data.name}`), existing);
      const course: Course = { ...data, id };
      setCourses((xs) => [...xs, course]);
      supabase.from("courses").insert(courseToDb(course));
      return course;
    },
    [courses]
  );

  const removeCourse = useCallback((id: string) => {
    setCourses((xs) => xs.filter((c) => c.id !== id));
    supabase.from("courses").delete().eq("id", id);
  }, []);

  const addStudent = useCallback(
    (data: Omit<Student, "id">) => {
      const existing = new Set(students.map((s) => s.id));
      const id = uniqueId(slugify(`${data.classeId}-${data.firstName}-${data.lastName}`), existing);
      const student: Student = { ...data, id };
      setStudents((ss) => [...ss, student]);
      supabase.from("students").insert(studentToDb(student));
      return student;
    },
    [students]
  );

  const updateStudent = useCallback((id: string, patch: Partial<Omit<Student, "id">>) => {
    setStudents((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbPatch: any = {};
    if (patch.classeId !== undefined) dbPatch.classe_id = patch.classeId;
    if (patch.firstName !== undefined) dbPatch.first_name = patch.firstName;
    if (patch.lastName !== undefined) dbPatch.last_name = patch.lastName;
    if (patch.email !== undefined) dbPatch.email = patch.email;
    if (patch.emoji !== undefined) dbPatch.emoji = patch.emoji;
    if (patch.birthDate !== undefined) dbPatch.birth_date = patch.birthDate;
    if (patch.parentName !== undefined) dbPatch.parent_name = patch.parentName;
    if (patch.parentPhone !== undefined) dbPatch.parent_phone = patch.parentPhone;
    supabase.from("students").update(dbPatch).eq("id", id);
  }, []);

  const removeStudent = useCallback((id: string) => {
    setStudents((ss) => ss.filter((s) => s.id !== id));
    supabase.from("students").delete().eq("id", id);
  }, []);

  const updateClasse = useCallback((id: string, patch: Partial<Omit<Classe, "id">>) => {
    setClasses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const updated = { ...patch };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbPatch: any = {};
    if (updated.name !== undefined) dbPatch.name = updated.name;
    if (updated.level !== undefined) dbPatch.level = updated.level;
    if (updated.section !== undefined) dbPatch.section = updated.section;
    if (updated.studentCount !== undefined) dbPatch.student_count = updated.studentCount;
    if (updated.accent !== undefined) dbPatch.accent = updated.accent;
    if (updated.emoji !== undefined) dbPatch.emoji = updated.emoji;
    supabase.from("classes").update(dbPatch).eq("id", id);
  }, []);

  const removeClasse = useCallback((id: string) => {
    setClasses((cs) => cs.filter((c) => c.id !== id));
    setCourses((xs) => xs.filter((x) => x.classeId !== id));
    setStudents((ss) => ss.filter((s) => s.classeId !== id));
    setGrades((gs) => gs.filter((g) => !g.studentId.startsWith(`${id}-`)));
    supabase.from("classes").delete().eq("id", id); // cascades to courses, students, grades
  }, []);

  const setGrade = useCallback(
    (studentId: string, assignmentId: string, score: number | null) => {
      setGrades((gs) => {
        const filtered = gs.filter(
          (g) => !(g.studentId === studentId && g.assignmentId === assignmentId)
        );
        if (score === null || Number.isNaN(score)) {
          supabase.from("grades").delete().eq("student_id", studentId).eq("assignment_id", assignmentId);
          return filtered;
        }
        supabase.from("grades").upsert({
          student_id: studentId,
          assignment_id: assignmentId,
          score,
          updated_at: new Date().toISOString(),
        });
        return [...filtered, { studentId, assignmentId, score }];
      });
    },
    []
  );

  const addAnnouncement = useCallback(
    (data: Omit<Announcement, "id" | "when">) => {
      const id = `a-${Date.now().toString(36)}`;
      const a: Announcement = { ...data, id, when: "à l'instant" };
      setAnnouncements((xs) => [a, ...xs]);
      supabase.from("announcements").insert({
        id,
        author: data.author,
        role: data.role,
        body: data.body,
        classe_id: data.classeId ?? null,
        course_id: data.courseId ?? null,
      });
      return a;
    },
    []
  );

  const addAssignment = useCallback((data: Omit<Assignment, "id">) => {
    const id = `t-${Date.now().toString(36)}`;
    const a: Assignment = { ...data, id };
    setAssignments((xs) => [a, ...xs]);
    supabase.from("assignments").insert({
      id,
      title: data.title,
      course_id: data.courseId,
      due_label: data.dueLabel,
      done: data.done,
    });
    return a;
  }, []);

  const addStreamPost = useCallback((data: Omit<StreamPost, "id" | "when">) => {
    const id = `s-${Date.now().toString(36)}`;
    const p: StreamPost = { ...data, id, when: "à l'instant" };
    setStream((xs) => [p, ...xs]);
    supabase.from("stream_posts").insert({
      id,
      course_id: data.courseId,
      author: data.author,
      role: data.role,
      body: data.body,
      kind: data.kind,
      title: data.title ?? null,
    });
    return p;
  }, []);

  const addScheduleSlot = useCallback((data: Omit<ScheduleSlot, "id">) => {
    const id = `sch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const slot: ScheduleSlot = { ...data, id };
    setSchedule((xs) => [...xs, slot]);
    supabase.from("schedule_slots").insert(scheduleSlotToDb(slot));
    return slot;
  }, []);

  const updateScheduleSlot = useCallback((id: string, patch: Partial<Omit<ScheduleSlot, "id">>) => {
    setSchedule((xs) => xs.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbPatch: any = {};
    if (patch.classeId !== undefined) dbPatch.classe_id = patch.classeId;
    if (patch.dayOfWeek !== undefined) dbPatch.day_of_week = patch.dayOfWeek;
    if (patch.startTime !== undefined) dbPatch.start_time = patch.startTime;
    if (patch.endTime !== undefined) dbPatch.end_time = patch.endTime;
    if (patch.subject !== undefined) dbPatch.subject = patch.subject;
    if (patch.teacher !== undefined) dbPatch.teacher = patch.teacher || null;
    if (patch.room !== undefined) dbPatch.room = patch.room || null;
    supabase.from("schedule_slots").update(dbPatch).eq("id", id);
  }, []);

  const removeScheduleSlot = useCallback((id: string) => {
    setSchedule((xs) => xs.filter((s) => s.id !== id));
    supabase.from("schedule_slots").delete().eq("id", id);
  }, []);

  const refresh = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safe = async (q: PromiseLike<any>): Promise<{ data: any[] }> => {
      try {
        const r = await q;
        return { data: r?.data ?? [] };
      } catch {
        return { data: [] };
      }
    };
    const [{ data: cls }, { data: crs }, { data: sts }] = await Promise.all([
      safe(supabase.from("classes").select("*").order("created_at")),
      safe(supabase.from("courses").select("*").order("created_at")),
      safe(supabase.from("students").select("*").order("first_name")),
    ]);
    setClasses((cls ?? []).map(dbToClasse));
    setCourses((crs ?? []).map(dbToCourse));
    setStudents((sts ?? []).map(dbToStudent));
  }, []);

  const resetAll = useCallback(async () => {
    // Delete everything (no reseed — admin fills manually)
    await supabase.from("classes").delete().neq("id", "___never___");
    await supabase.from("announcements").delete().neq("id", "___never___");
    await supabase.from("schedule_slots").delete().neq("id", "___never___");
    window.location.reload();
  }, []);

  const value: StoreValue = {
    ready,
    classes,
    courses,
    announcements,
    assignments,
    stream,
    people: {},
    students,
    teachers,
    grades,
    schedule,
    findClasse,
    findStudent,
    findTeacher,
    coursesByClasse,
    announcementsForClasse,
    assignmentsForClasse,
    studentsByClasse,
    coursesByTeacher,
    classesByTeacher,
    gradeFor,
    gradesByStudent,
    scheduleByClasse,
    addClasse,
    updateClasse,
    removeClasse,
    addCourse,
    removeCourse,
    addStudent,
    updateStudent,
    removeStudent,
    setGrade,
    addAnnouncement,
    addAssignment,
    addStreamPost,
    addScheduleSlot,
    updateScheduleSlot,
    removeScheduleSlot,
    refresh,
    resetAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useClasses() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useClasses must be used inside ClassesProvider");
  return ctx;
}

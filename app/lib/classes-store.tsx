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
  CLASSES_SEED,
  COURSES_SEED,
  STUDENTS_SEED,
  GRADES_SEED,
  ANNOUNCEMENTS_SEED,
  ASSIGNMENTS_SEED,
  STREAM_SEED,
  TEACHERS_SEED,
  buildCoursesForClasse,
  buildStudentsForClasse,
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

  addClasse: (data: Omit<Classe, "id">) => Classe;
  updateClasse: (id: string, patch: Partial<Omit<Classe, "id">>) => void;
  removeClasse: (id: string) => void;
  setGrade: (studentId: string, assignmentId: string, score: number | null) => void;
  addAnnouncement: (data: Omit<Announcement, "id" | "when">) => Announcement;
  addAssignment: (data: Omit<Assignment, "id">) => Assignment;
  addStreamPost: (data: Omit<StreamPost, "id" | "when">) => StreamPost;
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

  /* ---- Seed helper ---- */
  async function seedDatabase() {
    await supabase.from("classes").insert(CLASSES_SEED.map(classeToDb));
    await supabase.from("courses").insert(COURSES_SEED.map(courseToDb));
    await supabase.from("students").insert(STUDENTS_SEED.map(studentToDb));
    await supabase.from("grades").insert(
      GRADES_SEED.map((g) => ({
        student_id: g.studentId,
        assignment_id: g.assignmentId,
        score: g.score,
      }))
    );
    await supabase.from("announcements").insert(
      ANNOUNCEMENTS_SEED.map((a) => ({
        id: a.id,
        author: a.author,
        role: a.role,
        body: a.body,
        classe_id: a.classeId ?? null,
        course_id: a.courseId ?? null,
      }))
    );
    await supabase.from("assignments").insert(
      ASSIGNMENTS_SEED.map((a) => ({
        id: a.id,
        title: a.title,
        course_id: a.courseId,
        due_label: a.dueLabel,
        done: a.done,
      }))
    );
    // Only seed stream posts for valid course IDs (exclude dummy s16)
    const validCourseIds = new Set(COURSES_SEED.map((c) => c.id));
    await supabase.from("stream_posts").insert(
      STREAM_SEED.filter((p) => validCourseIds.has(p.courseId)).map((p) => ({
        id: p.id,
        course_id: p.courseId,
        author: p.author,
        role: p.role,
        body: p.body,
        kind: p.kind,
        title: p.title ?? null,
      }))
    );
  }

  /* ---- Initial load ---- */
  useEffect(() => {
    async function load() {
      const [
        { data: cls },
        { data: crs },
        { data: sts },
        { data: grd },
        { data: ann },
        { data: asg },
        { data: stm },
      ] = await Promise.all([
        supabase.from("classes").select("*").order("created_at"),
        supabase.from("courses").select("*").order("created_at"),
        supabase.from("students").select("*").order("first_name"),
        supabase.from("grades").select("*"),
        supabase.from("announcements").select("*").order("created_at", { ascending: false }),
        supabase.from("assignments").select("*").order("created_at", { ascending: false }),
        supabase.from("stream_posts").select("*").order("created_at", { ascending: false }),
      ]);

      // Seed if DB empty
      if (!cls || cls.length === 0) {
        await seedDatabase();
        // Reload after seed
        const [{ data: cls2 }, { data: crs2 }, { data: sts2 }, { data: grd2 }, { data: ann2 }, { data: asg2 }, { data: stm2 }] = await Promise.all([
          supabase.from("classes").select("*").order("created_at"),
          supabase.from("courses").select("*").order("created_at"),
          supabase.from("students").select("*").order("first_name"),
          supabase.from("grades").select("*"),
          supabase.from("announcements").select("*").order("created_at", { ascending: false }),
          supabase.from("assignments").select("*").order("created_at", { ascending: false }),
          supabase.from("stream_posts").select("*").order("created_at", { ascending: false }),
        ]);
        setClasses((cls2 ?? []).map(dbToClasse));
        setCourses((crs2 ?? []).map(dbToCourse));
        setStudents((sts2 ?? []).map(dbToStudent));
        setGrades((grd2 ?? []).map(dbToGrade));
        setAnnouncements((ann2 ?? []).map(dbToAnnouncement));
        setAssignments((asg2 ?? []).map(dbToAssignment));
        setStream((stm2 ?? []).map(dbToStreamPost));
      } else {
        setClasses((cls ?? []).map(dbToClasse));
        setCourses((crs ?? []).map(dbToCourse));
        setStudents((sts ?? []).map(dbToStudent));
        setGrades((grd ?? []).map(dbToGrade));
        setAnnouncements((ann ?? []).map(dbToAnnouncement));
        setAssignments((asg ?? []).map(dbToAssignment));
        setStream((stm ?? []).map(dbToStreamPost));
      }

      setReady(true);
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

  /* ---- Mutations ---- */
  const addClasse = useCallback(
    (data: Omit<Classe, "id">) => {
      const existing = new Set(classes.map((c) => c.id));
      const id = uniqueId(slugify(data.name), existing);
      const classe: Classe = { ...data, id };
      const newCourses = buildCoursesForClasse(classe);
      const newStudents = buildStudentsForClasse(classe);
      // Optimistic
      setClasses((cs) => [...cs, classe]);
      setCourses((xs) => [...xs, ...newCourses]);
      setStudents((ss) => [...ss, ...newStudents]);
      // DB
      supabase.from("classes").insert(classeToDb(classe));
      supabase.from("courses").insert(newCourses.map(courseToDb));
      supabase.from("students").insert(newStudents.map(studentToDb));
      return classe;
    },
    [classes]
  );

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

  const resetAll = useCallback(async () => {
    // Delete everything and re-seed
    await supabase.from("classes").delete().neq("id", "___never___");
    await seedDatabase();
    window.location.reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    addClasse,
    updateClasse,
    removeClasse,
    setGrade,
    addAnnouncement,
    addAssignment,
    addStreamPost,
    resetAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useClasses() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useClasses must be used inside ClassesProvider");
  return ctx;
}

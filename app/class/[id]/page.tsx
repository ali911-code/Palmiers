"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, notFound } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import TopBar from "../../components/TopBar";
import { useAuth } from "../../lib/auth";
import { useClasses } from "../../lib/classes-store";
import type { Assignment, Student, StreamPost } from "../../lib/mock-data";

const EASE = [0.22, 1, 0.36, 1] as const;

const TABS = [
  { id: "stream", label: "Fil" },
  { id: "classwork", label: "Travaux" },
  { id: "people", label: "Personnes" },
  { id: "grades", label: "Notes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId) || "stream";
  const { user, ready } = useAuth();
  const {
    courses,
    stream,
    assignments,
    people: peopleByCourse,
    findClasse,
    studentsByClasse,
    gradeFor,
    setGrade,
    addAssignment,
    addStreamPost,
  } = useClasses();
  const [tab, setTab] = useState<TabId>(initialTab);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  const course = useMemo(() => courses.find((c) => c.id === id), [courses, id]);
  if (!course) notFound();
  const classe = findClasse(course.classeId);

  const posts = stream.filter((p) => p.courseId === id);
  const classwork = assignments.filter((a) => a.courseId === id);
  const people = peopleByCourse[id] ?? [];
  const classStudents = course ? studentsByClasse(course.classeId) : [];
  const isTeacher = user?.role === "teacher" && course ? user.name === course.teacher : false;
  const canPost = isTeacher || user?.role === "admin";
  const canGrade = isTeacher || user?.role === "admin";
  const visibleTabs = TABS.filter((t) => t.id !== "grades" || canGrade);

  if (!ready || !user) {
    return (
      <div className="flex-1 grid place-items-center">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="text-sm text-slate-500"
        >
          Chargement…
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar />

      {/* Hero header */}
      <div className={`relative bg-gradient-to-br ${course.accent} text-white`}>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-5 pb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.4 10l4.3 4.3a1 1 0 1 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0z" />
            </svg>
            Tous les cours
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-4 flex items-start gap-4"
          >
            <div className="h-16 w-16 rounded-2xl bg-white/90 grid place-items-center text-3xl shadow-lg">
              {course.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow">
                {course.name}
              </h1>
              <p className="text-sm text-white/85">
                {classe?.name ?? ""} · {course.teacher}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200/70 bg-white/70 backdrop-blur sticky top-14 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex gap-1">
          {visibleTabs.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  active ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
                {active && (
                  <motion.span
                    layoutId="tab-underline"
                    className={`absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r ${course.accent}`}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            {tab === "stream" && (
              <Stream
                posts={posts}
                accent={course.accent}
                canPost={canPost}
                authorName={user.name}
                authorRole={user.role}
                onPost={(kind, title, body) =>
                  addStreamPost({
                    courseId: course.id,
                    author: user.name,
                    role: user.role,
                    kind,
                    title: title || undefined,
                    body,
                  })
                }
              />
            )}
            {tab === "classwork" && (
              <Classwork
                items={classwork}
                canCreate={canPost}
                accent={course.accent}
                onCreate={(title, dueLabel) => {
                  addAssignment({ title, courseId: course.id, dueLabel, done: false });
                  addStreamPost({
                    courseId: course.id,
                    author: user.name,
                    role: user.role,
                    kind: "assignment",
                    title,
                    body: `Nouveau devoir — ${dueLabel}`,
                  });
                }}
              />
            )}
            {tab === "people" && <People people={people} classStudents={classStudents} />}
            {tab === "grades" && canGrade && (
              <GradesTab
                students={classStudents}
                assignments={classwork}
                gradeFor={gradeFor}
                setGrade={setGrade}
                accent={course.accent}
                readOnly={!isTeacher && user?.role !== "admin"}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

function Stream({
  posts,
  accent,
  canPost,
  authorName,
  authorRole,
  onPost,
}: {
  posts: StreamPost[];
  accent: string;
  canPost: boolean;
  authorName: string;
  authorRole: "student" | "teacher" | "admin";
  onPost: (kind: StreamPost["kind"], title: string, body: string) => void;
}) {
  return (
    <motion.div
      variants={listContainer}
      initial="hidden"
      animate="show"
      className="grid gap-4 lg:grid-cols-3"
    >
      <div className="lg:col-span-2 space-y-4">
        {canPost && (
          <StreamComposer accent={accent} onPost={onPost} authorName={authorName} authorRole={authorRole} />
        )}
        {posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-sm">
            Rien de publié pour le moment.
          </div>
        )}
        {posts.map((p) => (
          <motion.article
            key={p.id}
            variants={listItem}
            whileHover={{ y: -2 }}
            className="rounded-2xl bg-white border border-slate-200/70 shadow-sm overflow-hidden"
          >
            <div className="flex items-start gap-3 p-4">
              <div
                className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent} grid place-items-center text-white text-sm font-bold shrink-0`}
              >
                {p.author.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{p.author}</span>
                  <KindBadge kind={p.kind} />
                  <span className="text-[11px] text-slate-400">· {p.when}</span>
                </div>
                {p.title && (
                  <h3 className="mt-1 font-semibold text-slate-900">{p.title}</h3>
                )}
                <p className="mt-1 text-sm text-slate-700 leading-relaxed">{p.body}</p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <aside className="space-y-3">
        <div className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Infos rapides
          </h4>
          <p className="mt-2 text-sm text-slate-600">
            C'est ici qu'apparaîtront les échéances, le code de la classe et les
            liens de réunion une fois la base de données branchée.
          </p>
        </div>
      </aside>
    </motion.div>
  );
}

function Classwork({
  items,
  canCreate,
  accent,
  onCreate,
}: {
  items: { id: string; title: string; dueLabel: string; done: boolean }[];
  canCreate: boolean;
  accent: string;
  onCreate: (title: string, dueLabel: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  return (
    <div className="max-w-3xl">
      {canCreate && (
        <motion.button
          onClick={() => setCreating(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`mb-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${accent} text-white px-4 py-2 text-sm font-semibold shadow-md`}
        >
          <span className="text-lg leading-none">+</span> Créer un devoir
        </motion.button>
      )}
      <AnimatePresence>
        {creating && (
          <ClassworkCreatorModal
            accent={accent}
            onClose={() => setCreating(false)}
            onSubmit={(title, dueLabel) => {
              onCreate(title, dueLabel);
              setCreating(false);
            }}
          />
        )}
      </AnimatePresence>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-sm">
          Aucun devoir pour l'instant.
        </div>
      ) : (
      <motion.ul
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="rounded-2xl bg-white border border-slate-200/70 divide-y divide-slate-100 overflow-hidden shadow-sm"
      >
        {items.map((t) => (
          <motion.li
            key={t.id}
            variants={listItem}
            className="flex items-center gap-3 p-4 hover:bg-slate-50/70 transition-colors"
          >
            <div
              className={`h-5 w-5 rounded-md border-2 grid place-items-center ${
                t.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
              }`}
            >
              {t.done && (
                <svg viewBox="0 0 20 20" className="h-3 w-3 text-white" fill="currentColor">
                  <path d="M7.7 14.3 3.4 10l1.4-1.4 2.9 2.9 7.5-7.5L16.6 5z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${t.done ? "line-through text-slate-400" : "text-slate-800"}`}>
                {t.title}
              </div>
              <div className="text-[11px] text-slate-500">{t.dueLabel}</div>
            </div>
            <span className="text-slate-300">›</span>
          </motion.li>
        ))}
      </motion.ul>
      )}
    </div>
  );
}

function StreamComposer({
  accent,
  onPost,
  authorName,
  authorRole,
}: {
  accent: string;
  onPost: (kind: StreamPost["kind"], title: string, body: string) => void;
  authorName: string;
  authorRole: "student" | "teacher" | "admin";
}) {
  const [kind, setKind] = useState<StreamPost["kind"]>("announcement");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);

  function submit() {
    if (!body.trim()) return;
    onPost(kind, title.trim(), body.trim());
    setTitle("");
    setBody("");
    setOpen(false);
  }

  return (
    <motion.div
      layout
      className="rounded-2xl bg-white border border-slate-200/70 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent} grid place-items-center text-white text-sm font-bold shrink-0`}>
          {authorName.charAt(0)}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left rounded-xl bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-sm text-slate-500 transition-colors"
        >
          Partager quelque chose avec votre classe…
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-100 px-3 pb-3 pt-2 space-y-2"
          >
            <div className="flex gap-1.5">
              {(["announcement", "assignment", "material"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                    kind === k
                      ? `bg-gradient-to-r ${accent} text-white shadow`
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {k === "announcement" ? "Annonce" : k === "assignment" ? "Devoir" : "Ressource"}
                </button>
              ))}
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre (optionnel)"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`${authorRole === "teacher" ? "Enseignant" : "Admin"} — votre message…`}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setBody("");
                  setTitle("");
                }}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Annuler
              </button>
              <motion.button
                onClick={submit}
                whileTap={{ scale: 0.97 }}
                disabled={!body.trim()}
                className={`rounded-xl bg-gradient-to-r ${accent} text-white px-4 py-2 text-sm font-semibold shadow disabled:opacity-50`}
              >
                Publier
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ClassworkCreatorModal({
  accent,
  onClose,
  onSubmit,
}: {
  accent: string;
  onClose: () => void;
  onSubmit: (title: string, dueLabel: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [dueLabel, setDueLabel] = useState("Pour vendredi");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.25, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${accent} grid place-items-center text-2xl shadow-md`}>
            📝
          </div>
          <h2 className="text-lg font-bold tracking-tight">Nouveau devoir</h2>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Titre</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Exercices — chapitre 5"
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Échéance</span>
            <input
              value={dueLabel}
              onChange={(e) => setDueLabel(e.target.value)}
              placeholder="Ex. Pour lundi"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 text-sm font-semibold"
          >
            Annuler
          </button>
          <motion.button
            disabled={!title.trim()}
            onClick={() => title.trim() && onSubmit(title.trim(), dueLabel.trim() || "Sans date")}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 rounded-xl bg-gradient-to-r ${accent} text-white py-2.5 text-sm font-semibold shadow-md disabled:opacity-50`}
          >
            Créer
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function People({
  people,
  classStudents,
}: {
  people: { id: string; name: string; role: string }[];
  classStudents: Student[];
}) {
  const teachers = people.filter((p) => p.role !== "student");

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Enseignants
        </h3>
        <motion.ul
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="rounded-2xl bg-white border border-slate-200/70 divide-y divide-slate-100 overflow-hidden shadow-sm"
        >
          {teachers.map((p) => (
            <motion.li
              key={p.id}
              variants={listItem}
              className="flex items-center gap-3 p-3"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white grid place-items-center text-sm font-semibold">
                {p.name.charAt(0)}
              </div>
              <div className="text-sm text-slate-800">{p.name}</div>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Élèves ({classStudents.length})
        </h3>
        <motion.ul
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="rounded-2xl bg-white border border-slate-200/70 divide-y divide-slate-100 overflow-hidden shadow-sm"
        >
          {classStudents.map((s) => (
            <motion.li key={s.id} variants={listItem}>
              <Link
                href={`/student/${s.id}`}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-white grid place-items-center text-lg">
                  {s.emoji}
                </div>
                <div className="flex-1 text-sm text-slate-800">
                  {s.firstName} {s.lastName}
                </div>
                <span className="text-slate-300">›</span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </div>
  );
}

function GradesTab({
  students,
  assignments,
  gradeFor,
  setGrade,
  accent,
  readOnly,
}: {
  students: Student[];
  assignments: Assignment[];
  gradeFor: (studentId: string, assignmentId: string) => number | undefined;
  setGrade: (studentId: string, assignmentId: string, score: number | null) => void;
  accent: string;
  readOnly: boolean;
}) {
  if (students.length === 0) {
    return <EmptyState title="Aucun élève" subtitle="Ajoutez des élèves pour saisir les notes." />;
  }
  if (assignments.length === 0) {
    return <EmptyState title="Aucun devoir" subtitle="Créez un devoir avant de saisir des notes." />;
  }

  function onChange(studentId: string, assignmentId: string, v: string) {
    if (v === "") {
      setGrade(studentId, assignmentId, null);
      return;
    }
    const n = parseFloat(v.replace(",", "."));
    if (Number.isNaN(n)) return;
    const clamped = Math.max(0, Math.min(20, n));
    setGrade(studentId, assignmentId, clamped);
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200/70 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            <th className="text-left font-semibold text-xs uppercase tracking-wider text-slate-500 px-4 py-3 sticky left-0 bg-slate-50/70 z-10">
              Élève
            </th>
            {assignments.map((a) => (
              <th
                key={a.id}
                className="text-center font-semibold text-xs text-slate-600 px-3 py-3 min-w-[120px]"
                title={a.title}
              >
                <div className="truncate max-w-[140px] mx-auto">{a.title}</div>
                <div className="text-[10px] font-normal text-slate-400 mt-0.5">/ 20</div>
              </th>
            ))}
            <th className="text-center font-semibold text-xs uppercase tracking-wider text-slate-500 px-4 py-3">
              Moyenne
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, idx) => {
            const scores = assignments
              .map((a) => gradeFor(s.id, a.id))
              .filter((v): v is number => typeof v === "number");
            const avg =
              scores.length > 0 ? scores.reduce((x, y) => x + y, 0) / scores.length : null;
            return (
              <tr
                key={s.id}
                className={`border-b border-slate-100 last:border-0 ${idx % 2 === 0 ? "" : "bg-slate-50/30"}`}
              >
                <td className="px-4 py-2 sticky left-0 bg-inherit">
                  <Link href={`/student/${s.id}`} className="flex items-center gap-2 hover:underline">
                    <span className="text-lg">{s.emoji}</span>
                    <span className="font-medium text-slate-800">
                      {s.firstName} {s.lastName}
                    </span>
                  </Link>
                </td>
                {assignments.map((a) => {
                  const val = gradeFor(s.id, a.id);
                  return (
                    <td key={a.id} className="px-2 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={0.5}
                        defaultValue={val ?? ""}
                        disabled={readOnly}
                        onBlur={(e) => onChange(s.id, a.id, e.target.value)}
                        className="w-16 text-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </td>
                  );
                })}
                <td className="px-4 py-2 text-center">
                  {avg !== null ? (
                    <span
                      className={`inline-block rounded-full bg-gradient-to-r ${accent} text-white px-2.5 py-1 text-xs font-bold tabular-nums`}
                    >
                      {avg.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function KindBadge({ kind }: { kind: StreamPost["kind"] }) {
  const map: Record<StreamPost["kind"], { label: string; cls: string }> = {
    announcement: { label: "Annonce",   cls: "bg-rose-100 text-rose-700" },
    assignment:   { label: "Devoir",    cls: "bg-indigo-100 text-indigo-700" },
    material:     { label: "Ressource", cls: "bg-emerald-100 text-emerald-700" },
  };
  const { label, cls } = map[kind];
  return (
    <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      {label}
    </span>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-slate-500 mt-1">{subtitle}</div>
    </div>
  );
}

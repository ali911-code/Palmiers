"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useClasses } from "../lib/classes-store";
import type { Announcement, Assignment, Course, Classe } from "../lib/mock-data";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const greeting = greet(user.name);
  const subtitle =
    user.role === "teacher"
      ? "Voici l'actualité de vos classes."
      : user.role === "admin"
      ? "Vue d'ensemble de l'école en un coup d'œil."
      : "Voici le programme de votre classe.";

  return (
    <main className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="text-sm text-slate-500">{today()}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{greeting}</h1>
        <p className="mt-1 text-slate-600">{subtitle}</p>
      </motion.div>

      {user.role === "student" && <StudentView classeId={user.classeId} />}
      {user.role === "teacher" && <TeacherView teacherId={user.teacherId} />}
      {user.role === "admin" && <AdminView />}
    </main>
  );
}

/* ============================================================
   STUDENT VIEW — their classe's courses, announcements, assignments
   ============================================================ */
function StudentView({ classeId }: { classeId?: string }) {
  const { findClasse, coursesByClasse, announcementsForClasse, assignmentsForClasse } = useClasses();
  const classe = findClasse(classeId);
  if (!classe) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="text-lg font-semibold">Aucune classe sélectionnée</div>
        <div className="text-sm text-slate-500 mt-1">
          Déconnectez-vous et choisissez votre classe pour continuer.
        </div>
      </div>
    );
  }

  const courses = coursesByClasse(classe.id);
  const announcements = announcementsForClasse(classe.id);
  const assignments = assignmentsForClasse(classe.id);

  return (
    <>
      <ClasseBanner classe={classe} subtitle={`${courses.length} cours · ${classe.studentCount} élèves`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle>Mes cours</SectionTitle>
          <CoursesGrid courses={courses} />
        </div>

        <aside className="space-y-6">
          <QuickActions
            actions={[
              { label: "Emploi du temps", emoji: "🗓️", accent: "from-sky-500 to-indigo-500", href: "/schedule" },
            ]}
          />
          <AnnouncementsPanel items={announcements} />
          <UpcomingPanel items={assignments} />
        </aside>
      </div>
    </>
  );
}

/* ============================================================
   TEACHER VIEW — classes they touch, pending work, actions
   ============================================================ */
function TeacherView({ teacherId }: { teacherId?: string }) {
  const {
    announcements,
    assignments,
    coursesByTeacher,
    classesByTeacher,
    findTeacher,
    addAssignment,
    addStreamPost,
  } = useClasses();
  const { user } = useAuth();
  const [action, setAction] = useState<null | "announcement" | "assignment" | "material">(null);
  const teacher = findTeacher(teacherId);
  const myCourses = teacherId ? coursesByTeacher(teacherId) : [];
  const myClasses = teacherId ? classesByTeacher(teacherId) : [];
  const myCourseIds = new Set(myCourses.map((c) => c.id));
  const myAssignments = assignments.filter((a) => myCourseIds.has(a.courseId));
  const pending = myAssignments.filter((a) => !a.done).length;
  const myClasseIds = new Set(myClasses.map((c) => c.id));
  const recent = announcements
    .filter((a) => !a.classeId || myClasseIds.has(a.classeId))
    .slice(0, 4);

  if (!teacher) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="text-lg font-semibold">Identité enseignant non trouvée</div>
        <div className="text-sm text-slate-500 mt-1">
          Déconnectez-vous et sélectionnez votre nom.
        </div>
      </div>
    );
  }

  return (
    <>
      <StatsRow
        stats={[
          { label: "Mes classes", value: myClasses.length, emoji: "🏫" },
          { label: "Mes cours", value: myCourses.length, emoji: "📚" },
          { label: "À corriger", value: pending, emoji: "📝" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        <div className="lg:col-span-2">
          <SectionTitle>Mes classes</SectionTitle>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2"
          >
            {myClasses.map((c) => {
              const courses = myCourses.filter((co) => co.classeId === c.id);
              return (
                <motion.div
                  key={c.id}
                  variants={item}
                  whileHover={{ y: -4 }}
                  className="relative rounded-2xl bg-white border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
                >
                  <Link href={`/classes/${c.id}`} className="block">
                    <div className={`h-20 bg-gradient-to-br ${c.accent} relative`}>
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
                      <div className="absolute top-3 left-4 text-white">
                        <div className="text-lg font-semibold drop-shadow">{c.name}</div>
                        <div className="text-xs opacity-90">{c.studentCount} élèves</div>
                      </div>
                      <div className="absolute -bottom-4 right-4 h-12 w-12 rounded-2xl bg-white/90 grid place-items-center text-2xl shadow-md">
                        {c.emoji}
                      </div>
                    </div>
                  </Link>
                  <div className="p-4 pt-6">
                    <div className="text-xs text-slate-500 mb-2">Mes cours dans cette classe</div>
                    <div className="flex flex-wrap gap-1.5">
                      {courses.map((co) => (
                        <Link
                          key={co.id}
                          href={`/class/${co.id}`}
                          className="text-[11px] rounded-full bg-slate-100 hover:bg-slate-200 px-2 py-0.5 transition-colors"
                        >
                          {co.emoji} {co.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <aside className="space-y-6">
          <QuickActions
            actions={[
              ...(myCourses[0]
                ? [{ label: "Saisir les notes", emoji: "📊", accent: "from-violet-500 to-purple-500", href: `/class/${myCourses[0].id}?tab=grades` }]
                : []),
              { label: "Emploi du temps", emoji: "🗓️", accent: "from-sky-500 to-indigo-500", href: "/schedule" },
              { label: "Poster une annonce", emoji: "📢", accent: "from-indigo-500 to-fuchsia-500", onClick: () => setAction("announcement") },
              { label: "Créer un devoir", emoji: "📝", accent: "from-emerald-500 to-cyan-500", onClick: () => setAction("assignment") },
              { label: "Ajouter une ressource", emoji: "📎", accent: "from-amber-500 to-red-500", onClick: () => setAction("material") },
            ]}
          />
          <AnnouncementsPanel items={recent} compact />
        </aside>
      </div>

      <AnimatePresence>
        {action && (
          <TeacherActionModal
            kind={action}
            courses={myCourses}
            onClose={() => setAction(null)}
            onSubmit={({ courseId, title, body, dueLabel }) => {
              if (action === "assignment") {
                addAssignment({ title, courseId, dueLabel: dueLabel || "Sans date", done: false });
                addStreamPost({
                  courseId,
                  author: user?.name ?? teacher.name,
                  role: "teacher",
                  kind: "assignment",
                  title,
                  body: body || `Nouveau devoir — ${dueLabel || "sans date"}`,
                });
              } else {
                addStreamPost({
                  courseId,
                  author: user?.name ?? teacher.name,
                  role: "teacher",
                  kind: action,
                  title: title || undefined,
                  body,
                });
              }
              setAction(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function TeacherActionModal({
  kind,
  courses,
  onClose,
  onSubmit,
}: {
  kind: "announcement" | "assignment" | "material";
  courses: Course[];
  onClose: () => void;
  onSubmit: (data: { courseId: string; title: string; body: string; dueLabel?: string }) => void;
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueLabel, setDueLabel] = useState("Pour vendredi");

  const meta = {
    announcement: { label: "Nouvelle annonce", emoji: "📢", accent: "from-indigo-500 to-fuchsia-500" },
    assignment: { label: "Nouveau devoir", emoji: "📝", accent: "from-emerald-500 to-cyan-500" },
    material: { label: "Nouvelle ressource", emoji: "📎", accent: "from-amber-500 to-red-500" },
  }[kind];

  const canSubmit = courseId && (kind === "assignment" ? title.trim() : body.trim());

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
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${meta.accent} grid place-items-center text-2xl shadow-md`}>
            {meta.emoji}
          </div>
          <h2 className="text-lg font-bold tracking-tight">{meta.label}</h2>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Cours</span>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">
              Titre{kind === "assignment" ? "" : " (optionnel)"}
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === "assignment" ? "Ex. Exercices — chapitre 5" : "Titre court"}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </label>
          {kind === "assignment" && (
            <label className="block">
              <span className="text-xs font-medium text-slate-600 mb-1.5 block">Échéance</span>
              <input
                value={dueLabel}
                onChange={(e) => setDueLabel(e.target.value)}
                placeholder="Ex. Pour lundi"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">
              Message{kind === "assignment" ? " (optionnel)" : ""}
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Détails…"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
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
            disabled={!canSubmit}
            onClick={() =>
              canSubmit &&
              onSubmit({
                courseId,
                title: title.trim(),
                body: body.trim(),
                dueLabel: kind === "assignment" ? dueLabel.trim() : undefined,
              })
            }
            whileTap={{ scale: 0.98 }}
            className={`flex-1 rounded-xl bg-gradient-to-r ${meta.accent} text-white py-2.5 text-sm font-semibold shadow-md disabled:opacity-50`}
          >
            Publier
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   ADMIN VIEW — school-wide stats, all classes, recent activity
   ============================================================ */
function AdminView() {
  const { classes, courses: allCourses, announcements, coursesByClasse, addAnnouncement } = useClasses();
  const { user } = useAuth();
  const [composing, setComposing] = useState(false);
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const teacherSet = new Set(allCourses.map((c) => c.teacher).filter((t) => t && t !== "À définir"));

  return (
    <>
      <StatsRow
        stats={[
          { label: "Élèves",     value: totalStudents,      emoji: "👨‍🎓" },
          { label: "Classes",    value: classes.length,     emoji: "🏫" },
          { label: "Enseignants",value: teacherSet.size,    emoji: "👩‍🏫" },
          { label: "Cours",      value: allCourses.length,  emoji: "📚" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        <div className="lg:col-span-2">
          <SectionTitle>Toutes les classes</SectionTitle>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2"
          >
            {classes.map((c) => {
              const courses = coursesByClasse(c.id);
              return (
                <motion.div
                  key={c.id}
                  variants={item}
                  whileHover={{ y: -4 }}
                  className="relative rounded-2xl bg-white border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
                >
                  <Link href={`/classes/${c.id}`} className="block text-left">
                    <div className={`h-24 bg-gradient-to-br ${c.accent} relative`}>
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
                      <div className="absolute top-3 left-4 text-white">
                        <div className="text-xl font-bold drop-shadow">{c.name}</div>
                        <div className="text-xs opacity-90">{c.level}</div>
                      </div>
                      <div className="absolute -bottom-4 right-4 h-14 w-14 rounded-2xl bg-white/90 grid place-items-center text-2xl shadow-md">
                        {c.emoji}
                      </div>
                    </div>
                    <div className="p-4 pt-6 grid grid-cols-2 gap-3 text-center">
                      <div>
                        <div className="text-2xl font-bold text-slate-800">{c.studentCount}</div>
                        <div className="text-[11px] text-slate-500">Élèves</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-slate-800">{courses.length}</div>
                        <div className="text-[11px] text-slate-500">Cours</div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <aside className="space-y-6">
          <QuickActions
            actions={[
              { label: "Annonce générale", emoji: "📣", accent: "from-rose-500 to-orange-500", onClick: () => setComposing(true) },
              { label: "Gérer les classes", emoji: "🏫", accent: "from-indigo-500 to-fuchsia-500", href: "/admin/classes" },
              { label: "Gérer les utilisateurs", emoji: "👥", accent: "from-cyan-500 to-blue-500", href: "/admin/users" },
              { label: "Emploi du temps", emoji: "🗓️", accent: "from-violet-500 to-purple-500", href: "/admin/schedule" },
            ]}
          />
          <AnnouncementsPanel items={announcements.slice(0, 4)} compact />
        </aside>
      </div>

      <AnimatePresence>
        {composing && (
          <AnnouncementModal
            classes={classes}
            onClose={() => setComposing(false)}
            onSubmit={(body, classeId) => {
              addAnnouncement({
                author: user?.name ?? "Administration",
                role: "admin",
                body,
                classeId,
              });
              setComposing(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AnnouncementModal({
  classes,
  onClose,
  onSubmit,
}: {
  classes: Classe[];
  onClose: () => void;
  onSubmit: (body: string, classeId?: string) => void;
}) {
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<string>("all");

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
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 grid place-items-center text-2xl shadow-md">
            📣
          </div>
          <h2 className="text-lg font-bold tracking-tight">Nouvelle annonce</h2>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Destinataire</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              <option value="all">Toute l'école</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Message</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Votre annonce…"
              rows={4}
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
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
            disabled={!body.trim()}
            onClick={() => body.trim() && onSubmit(body.trim(), scope === "all" ? undefined : scope)}
            whileTap={{ scale: 0.98 }}
            className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white py-2.5 text-sm font-semibold shadow-md disabled:opacity-50"
          >
            Publier
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   Shared pieces
   ============================================================ */

function ClasseBanner({ classe, subtitle }: { classe: Classe; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${classe.accent} text-white mb-6 p-5 sm:p-6 shadow-lg`}
    >
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
      <div className="relative flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-white/90 grid place-items-center text-3xl shadow">
          {classe.emoji}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider opacity-80">Ma classe</div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow">
            {classe.name}
          </div>
          <div className="text-xs opacity-90">{subtitle}</div>
        </div>
      </div>
    </motion.div>
  );
}

function CoursesGrid({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 text-sm">
        Aucun cours dans cette classe.
      </div>
    );
  }
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2"
    >
      {courses.map((c) => (
        <motion.div
          key={c.id}
          variants={item}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="relative rounded-2xl bg-white border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
        >
          <Link href={`/class/${c.id}`} className="block text-left">
            <div className={`h-24 bg-gradient-to-br ${c.accent} relative`}>
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
              <div className="absolute top-3 left-4 text-white">
                <div className="text-lg font-semibold leading-tight drop-shadow">
                  {c.name}
                </div>
                <div className="text-xs opacity-90">{c.teacher}</div>
              </div>
              <div className="absolute -bottom-4 right-4 h-14 w-14 rounded-2xl bg-white/90 grid place-items-center text-2xl shadow-md">
                {c.emoji}
              </div>
            </div>
            <div className="p-4 pt-6">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${c.accent}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    transition={{ duration: 0.9, ease: EASE }}
                  />
                </div>
                <span className="text-xs text-slate-500 tabular-nums w-8 text-right">
                  {c.progress}%
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

function AnnouncementsPanel({
  items,
  compact = false,
}: {
  items: Announcement[];
  compact?: boolean;
}) {
  return (
    <div>
      <SectionTitle>{compact ? "Activité récente" : "Annonces"}</SectionTitle>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 text-sm">
          Aucune annonce.
        </div>
      ) : (
        <motion.ul
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {items.map((a) => (
            <motion.li
              key={a.id}
              variants={item}
              className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{a.author}</span>
                <span className="text-[11px] text-slate-400">{a.when}</span>
              </div>
              <span
                className={`mt-1 inline-block text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                  a.role === "admin"
                    ? "bg-rose-100 text-rose-700"
                    : a.role === "teacher"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {roleFr(a.role)}
              </span>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">{a.body}</p>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}

function UpcomingPanel({ items }: { items: Assignment[] }) {
  return (
    <div>
      <SectionTitle>À venir</SectionTitle>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 text-sm">
          Rien à venir.
        </div>
      ) : (
        <motion.ul
          variants={container}
          initial="hidden"
          animate="show"
          className="rounded-2xl bg-white border border-slate-200/70 divide-y divide-slate-100 overflow-hidden shadow-sm"
        >
          {items.map((t) => (
            <motion.li
              key={t.id}
              variants={item}
              className="flex items-center gap-3 p-3"
            >
              <div
                className={`h-5 w-5 rounded-md border-2 grid place-items-center ${
                  t.done
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-300"
                }`}
              >
                {t.done && (
                  <svg viewBox="0 0 20 20" className="h-3 w-3 text-white" fill="currentColor">
                    <path d="M7.7 14.3 3.4 10l1.4-1.4 2.9 2.9 7.5-7.5L16.6 5z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${t.done ? "line-through text-slate-400" : "text-slate-800"}`}>
                  {t.title}
                </div>
                <div className="text-[11px] text-slate-500">{t.dueLabel}</div>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}

function StatsRow({
  stats,
}: {
  stats: { label: string; value: number | string; emoji: string }[];
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`grid gap-3 ${stats.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={item}
          className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{s.label}</span>
            <span className="text-xl">{s.emoji}</span>
          </div>
          <div className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">{s.value}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function QuickActions({
  actions,
}: {
  actions: { label: string; emoji: string; accent: string; href?: string; onClick?: () => void }[];
}) {
  return (
    <div>
      <SectionTitle>Actions rapides</SectionTitle>
      <div className="space-y-2">
        {actions.map((a) => {
          const body = (
            <>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${a.accent} grid place-items-center text-lg shadow-md`}>
                {a.emoji}
              </div>
              <span className="text-sm font-medium">{a.label}</span>
              <span className="ml-auto text-slate-300">›</span>
            </>
          );
          const cls =
            "w-full flex items-center gap-3 rounded-2xl bg-white border border-slate-200/70 p-3 text-left shadow-sm hover:shadow-md transition-shadow";
          return a.href ? (
            <motion.div key={a.label} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
              <Link href={a.href} className={cls}>
                {body}
              </Link>
            </motion.div>
          ) : (
            <motion.button
              key={a.label}
              onClick={a.onClick}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cls}
            >
              {body}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
      {children}
    </h2>
  );
}

function greet(name: string) {
  const h = new Date().getHours();
  const prefix = h < 18 ? "Bonjour" : "Bonsoir";
  return `${prefix}, ${name.split(" ")[0]}`;
}

function today() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function roleFr(role: "student" | "teacher" | "admin") {
  return role === "student" ? "Élève" : role === "teacher" ? "Enseignant" : "Admin";
}

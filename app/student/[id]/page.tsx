"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import TopBar from "../../components/TopBar";
import { useAuth } from "../../lib/auth";
import { useClasses } from "../../lib/classes-store";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, ready } = useAuth();
  const { findStudent, findClasse, coursesByClasse, assignments, gradesByStudent, classes, updateStudent } = useClasses();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
    else if (ready && user && user.role === "student") router.replace("/");
  }, [ready, user, router]);

  const student = findStudent(id);
  if (ready && !student) notFound();

  if (!ready || !user || !student || user.role === "student") {
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

  const [openCourse, setOpenCourse] = useState<string | null>(null);
  const [changingClasse, setChangingClasse] = useState(false);
  const classe = findClasse(student.classeId);
  const courses = classe ? coursesByClasse(classe.id) : [];
  const allGrades = gradesByStudent(student.id);
  const overallAvg =
    allGrades.length > 0
      ? allGrades.reduce((a, b) => a + b.score, 0) / allGrades.length
      : null;

  const perCourse = courses
    .map((c) => {
      const courseAssignments = assignments.filter((a) => a.courseId === c.id);
      const assignmentIds = new Set(courseAssignments.map((a) => a.id));
      const scores = allGrades.filter((g) => assignmentIds.has(g.assignmentId));
      const avg =
        scores.length > 0 ? scores.reduce((a, b) => a + b.score, 0) / scores.length : null;
      return { course: c, scores, avg, assignments: courseAssignments };
    })
    .filter((c) => c.avg !== null);

  const accent = classe?.accent ?? "from-indigo-500 via-violet-500 to-fuchsia-500";
  const age = ageFromBirth(student.birthDate);

  return (
    <div className="flex-1 flex flex-col">
      <TopBar />

      <div className={`relative bg-gradient-to-br ${accent} text-white`}>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-5 pb-10">
          <Link
            href={classe ? `/admin/classes/${classe.id}` : "/"}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.4 10l4.3 4.3a1 1 0 1 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0z" />
            </svg>
            {classe ? `Retour à ${classe.name}` : "Retour"}
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-4 flex items-center gap-5"
          >
            <div className="h-20 w-20 rounded-3xl bg-white/90 grid place-items-center text-5xl shadow-lg">
              {student.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-sm text-white/85">
                {classe?.name ?? "—"} · {age} ans
              </p>
            </div>
            {overallAvg !== null && (
              <div className="text-right">
                <div className="text-4xl font-bold tabular-nums drop-shadow">
                  {overallAvg.toFixed(1)}
                </div>
                <div className="text-xs opacity-80">Moyenne générale / 20</div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Moyennes par matière
            </h2>
            {perCourse.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-sm">
                Aucune note pour l'instant.
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-3 sm:grid-cols-2"
              >
                {perCourse.map(({ course, avg, assignments: courseAssignments }) => {
                  const isOpen = openCourse === course.id;
                  const courseGrades = courseAssignments
                    .map((a) => ({ a, score: allGrades.find((g) => g.assignmentId === a.id)?.score }))
                    .filter((x) => x.score !== undefined);
                  return (
                    <motion.div
                      key={course.id}
                      variants={item}
                      layout
                      className="rounded-2xl bg-white border border-slate-200/70 shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenCourse(isOpen ? null : course.id)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/70 transition-colors"
                      >
                        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${course.accent} grid place-items-center text-xl shadow shrink-0`}>
                          {course.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{course.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{course.teacher}</div>
                        </div>
                        <div className={`rounded-full bg-gradient-to-r ${course.accent} text-white px-2.5 py-1 text-xs font-bold tabular-nums mr-1`}>
                          {avg!.toFixed(1)}
                        </div>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-slate-400 text-sm"
                        >
                          ▾
                        </motion.span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: EASE }}
                            className="overflow-hidden border-t border-slate-100"
                          >
                            {courseGrades.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-slate-400 italic">Aucune note saisie.</p>
                            ) : (
                              <ul className="divide-y divide-slate-100">
                                {courseGrades.map(({ a, score }) => (
                                  <li key={a.id} className="flex items-center justify-between px-4 py-2.5">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-slate-800 truncate">{a.title}</div>
                                      <div className="text-[10px] text-slate-400">{a.dueLabel}</div>
                                    </div>
                                    <span className={`ml-3 rounded-full bg-gradient-to-r ${course.accent} text-white px-2.5 py-1 text-xs font-bold tabular-nums`}>
                                      {score!.toFixed(1)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Détails des notes
            </h2>
            {allGrades.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-sm">
                Aucune note enregistrée.
              </div>
            ) : (
              <motion.ul
                variants={container}
                initial="hidden"
                animate="show"
                className="rounded-2xl bg-white border border-slate-200/70 divide-y divide-slate-100 overflow-hidden shadow-sm"
              >
                {perCourse.flatMap(({ course, assignments: cAssignments }) =>
                  cAssignments.map((a) => {
                    const g = allGrades.find((x) => x.assignmentId === a.id);
                    if (!g) return null;
                    return (
                      <motion.li
                        key={g.assignmentId}
                        variants={item}
                        className="flex items-center gap-3 p-3"
                      >
                        <div className="text-lg">{course.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{a.title}</div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {course.name} · {a.dueLabel}
                          </div>
                        </div>
                        <div className="text-sm font-bold tabular-nums">
                          {g.score.toFixed(1)}
                          <span className="text-xs font-normal text-slate-400"> / 20</span>
                        </div>
                      </motion.li>
                    );
                  }),
                )}
              </motion.ul>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Informations
            </h3>
            <dl className="space-y-2.5 text-sm">
              <InfoRow label="Email">{student.email}</InfoRow>
              <InfoRow label="Date de naissance">
                {new Date(student.birthDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </InfoRow>
              <InfoRow label="Classe">
                <span>{classe?.name ?? "—"}</span>
                {user.role === "admin" && (
                  <button
                    onClick={() => setChangingClasse(true)}
                    className="ml-2 text-[10px] text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Changer
                  </button>
                )}
              </InfoRow>
            </dl>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Parent / Tuteur
            </h3>
            <dl className="space-y-2.5 text-sm">
              <InfoRow label="Nom">{student.parentName}</InfoRow>
              <InfoRow label="Téléphone">
                <a
                  href={`tel:${student.parentPhone.replace(/\s/g, "")}`}
                  className="text-indigo-600 hover:underline"
                >
                  {student.parentPhone}
                </a>
              </InfoRow>
            </dl>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {changingClasse && (
          <ChangeClasseModal
            currentClasseId={student.classeId}
            classes={classes}
            onClose={() => setChangingClasse(false)}
            onSave={(classeId) => {
              updateStudent(student.id, { classeId });
              setChangingClasse(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-[11px] uppercase tracking-wider text-slate-400 w-24 shrink-0">{label}</dt>
      <dd className="text-slate-800 min-w-0 break-words">{children}</dd>
    </div>
  );
}

function ChangeClasseModal({
  currentClasseId,
  classes,
  onClose,
  onSave,
}: {
  currentClasseId?: string;
  classes: { id: string; name: string; emoji: string }[];
  onClose: () => void;
  onSave: (classeId: string) => void;
}) {
  const [classeId, setClasseId] = useState(currentClasseId ?? classes[0]?.id ?? "");
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
        className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-2xl shadow-md">
            🏫
          </div>
          <h2 className="text-lg font-bold tracking-tight">Changer de classe</h2>
        </div>
        <label className="block mb-5">
          <span className="text-xs font-medium text-slate-600 mb-1.5 block">Classe</span>
          <select
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-sm font-semibold">
            Annuler
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => classeId && onSave(classeId)}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white py-2.5 text-sm font-semibold shadow-md"
          >
            Enregistrer
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ageFromBirth(iso: string): number {
  const b = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { motion, type Variants } from "framer-motion";
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

export default function ClasseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, ready } = useAuth();
  const {
    findClasse,
    findTeacher,
    studentsByClasse,
    coursesByClasse,
    gradesByStudent,
  } = useClasses();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
    else if (ready && user && user.role === "student") router.replace("/");
  }, [ready, user, router]);

  const classe = findClasse(id);
  if (ready && !classe) notFound();

  if (!ready || !user || user.role === "student" || !classe) {
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

  const students = studentsByClasse(classe.id);
  const allCourses = coursesByClasse(classe.id);

  const teacher = user.role === "teacher" ? findTeacher(user.teacherId) : undefined;
  const myCourses =
    teacher && user.role === "teacher"
      ? allCourses.filter((c) => c.teacher === teacher.name)
      : allCourses;

  return (
    <div className="flex-1 flex flex-col">
      <TopBar />

      <div className={`relative bg-gradient-to-br ${classe.accent} text-white`}>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-5 pb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.4 10l4.3 4.3a1 1 0 1 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0z" />
            </svg>
            Tableau de bord
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-4 flex items-start gap-4"
          >
            <div className="h-16 w-16 rounded-2xl bg-white/90 grid place-items-center text-3xl shadow-lg">
              {classe.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow">
                {classe.name}
              </h1>
              <p className="text-sm text-white/85">
                {classe.level} · {students.length} élèves · {allCourses.length} cours
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            {user.role === "teacher" ? "Mes cours" : "Cours"} ({myCourses.length})
          </h2>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-3 sm:grid-cols-2"
          >
            {myCourses.map((c) => (
              <motion.div key={c.id} variants={item} whileHover={{ y: -3 }}>
                <Link
                  href={`/class/${c.id}`}
                  className="block rounded-2xl bg-white border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
                >
                  <div className={`h-16 bg-gradient-to-br ${c.accent} relative`}>
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
                    <div className="absolute top-2 left-3 text-white">
                      <div className="text-sm font-semibold drop-shadow">{c.name}</div>
                      <div className="text-[10px] opacity-90">{c.teacher}</div>
                    </div>
                    <div className="absolute -bottom-3 right-3 h-10 w-10 rounded-xl bg-white/90 grid place-items-center text-xl shadow">
                      {c.emoji}
                    </div>
                  </div>
                  <div className="p-3 pt-5 text-[11px] text-slate-400 text-right">Ouvrir →</div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <aside>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Élèves ({students.length})
          </h2>
          <motion.ul
            variants={container}
            initial="hidden"
            animate="show"
            className="rounded-2xl bg-white border border-slate-200/70 divide-y divide-slate-100 overflow-hidden shadow-sm"
          >
            {students.map((s) => {
              const scores = gradesByStudent(s.id).map((g) => g.score);
              const avg =
                scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
              return (
                <motion.li key={s.id} variants={item}>
                  <Link
                    href={`/student/${s.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-white grid place-items-center text-lg">
                      {s.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {s.firstName} {s.lastName}
                      </div>
                    </div>
                    {avg !== null && (
                      <span className="text-xs font-bold tabular-nums text-slate-700">
                        {avg.toFixed(1)}
                      </span>
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        </aside>
      </div>
    </div>
  );
}

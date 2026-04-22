"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import TopBar from "../../../components/TopBar";
import { useAuth } from "../../../lib/auth";
import { useClasses } from "../../../lib/classes-store";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

export default function AdminClasseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, ready } = useAuth();
  const { findClasse, studentsByClasse, coursesByClasse, gradesByStudent } = useClasses();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
    else if (ready && user && user.role !== "admin") router.replace("/");
  }, [ready, user, router]);

  const classe = findClasse(id);
  if (ready && !classe) notFound();

  if (!ready || !user || user.role !== "admin" || !classe) {
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
  const courses = coursesByClasse(classe.id);

  return (
    <div className="flex-1 flex flex-col">
      <TopBar />

      <div className={`relative bg-gradient-to-br ${classe.accent} text-white`}>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,white,transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-5 pb-10">
          <Link
            href="/admin/classes"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.4 10l4.3 4.3a1 1 0 1 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0z" />
            </svg>
            Toutes les classes
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
                {classe.level} · {students.length} élèves · {courses.length} cours
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Élèves ({students.length})
        </h2>

        {students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 text-sm">
            Aucun élève dans cette classe.
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {students.map((s) => {
              const scores = gradesByStudent(s.id).map((g) => g.score);
              const avg =
                scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
              return (
                <motion.div key={s.id} variants={item} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={`/student/${s.id}`}
                    className="block rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${classe.accent} grid place-items-center text-2xl shadow`}>
                        {s.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {s.firstName} {s.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{s.email}</div>
                      </div>
                      {avg !== null && (
                        <div className="text-right">
                          <div className="text-lg font-bold tabular-nums text-slate-800">
                            {avg.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-slate-400">/ 20</div>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

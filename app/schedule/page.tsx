"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
import { useClasses } from "../lib/classes-store";
import TopBar from "../components/TopBar";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function SchedulePage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const { classes, scheduleByClasse, classesByTeacher } = useClasses();
  const [selectedClasseId, setSelectedClasseId] = useState<string>("");

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  // Determine which classes this user can see
  const userClasses = !user
    ? []
    : user.role === "student" && user.classeId
    ? classes.filter((c) => c.id === user.classeId)
    : user.role === "teacher" && user.teacherId
    ? classesByTeacher(user.teacherId)
    : classes;

  useEffect(() => {
    if (userClasses.length && !selectedClasseId) setSelectedClasseId(userClasses[0].id);
  }, [userClasses, selectedClasseId]);

  const slots = selectedClasseId ? scheduleByClasse(selectedClasseId) : [];
  const selectedClasse = classes.find((c) => c.id === selectedClasseId);

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <TopBar />
      <main className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 mb-1 block">← Retour</Link>
            <h1 className="text-2xl font-bold tracking-tight">Emploi du temps</h1>
            {selectedClasse && (
              <p className="text-sm text-slate-500 mt-0.5">{selectedClasse.emoji} {selectedClasse.name}</p>
            )}
          </div>
          {user?.role === "admin" && (
            <Link href="/admin/schedule" className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white px-3 py-2 text-xs font-semibold shadow-md">
              Modifier
            </Link>
          )}
        </div>

        {userClasses.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {userClasses.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClasseId(c.id)}
                className={`rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${
                  selectedClasseId === c.id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        )}

        {!selectedClasseId ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 text-sm">
            Aucune classe disponible.
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 text-sm">
            Emploi du temps pas encore défini.
          </div>
        ) : (
          <div className="space-y-4">
            {DAYS.map((day, idx) => {
              const daySlots = slots
                .filter((s) => s.dayOfWeek === idx)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              if (daySlots.length === 0) return null;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm"
                >
                  <h3 className="text-base font-bold text-slate-800 mb-3">{day}</h3>
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                      >
                        <div className="text-xs font-mono text-slate-500 tabular-nums w-24 flex-shrink-0">
                          {slot.startTime} – {slot.endTime}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{slot.subject}</div>
                          {(slot.teacher || slot.room) && (
                            <div className="text-xs text-slate-500 truncate">
                              {slot.teacher}{slot.teacher && slot.room ? " · " : ""}{slot.room && `🚪 ${slot.room}`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

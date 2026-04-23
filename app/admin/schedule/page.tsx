"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { useClasses, type ScheduleSlot } from "../../lib/classes-store";
import TopBar from "../../components/TopBar";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function AdminSchedulePage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const { classes, scheduleByClasse, addScheduleSlot, updateScheduleSlot, removeScheduleSlot } = useClasses();
  const [selectedClasseId, setSelectedClasseId] = useState<string>("");
  const [editing, setEditing] = useState<ScheduleSlot | null>(null);
  const [creatingDay, setCreatingDay] = useState<number | null>(null);

  useEffect(() => {
    if (ready && (!user || user.role !== "admin")) router.replace("/");
  }, [ready, user, router]);

  useEffect(() => {
    if (classes.length && !selectedClasseId) setSelectedClasseId(classes[0].id);
  }, [classes, selectedClasseId]);

  const slots = selectedClasseId ? scheduleByClasse(selectedClasseId) : [];
  const selectedClasse = classes.find((c) => c.id === selectedClasseId);

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <TopBar />
      <main className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 mb-1 block">← Retour</Link>
          <h1 className="text-2xl font-bold tracking-tight">Emploi du temps</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gère les horaires par classe</p>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-lg font-semibold">Aucune classe</div>
            <div className="text-sm text-slate-500 mt-1 mb-4">
              Crée d&apos;abord des classes pour ajouter un emploi du temps.
            </div>
            <Link href="/admin/classes" className="inline-block rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-4 py-2 text-sm font-semibold">
              Gérer les classes →
            </Link>
          </div>
        ) : (
          <>
            {/* Class picker */}
            <div className="mb-6">
              <label className="text-xs font-medium text-slate-600 mb-2 block">Classe</label>
              <div className="flex flex-wrap gap-2">
                {classes.map((c) => (
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
            </div>

            {/* Schedule grid */}
            {selectedClasse && (
              <div className="space-y-4">
                {DAYS.map((day, idx) => {
                  const daySlots = slots
                    .filter((s) => s.dayOfWeek === idx)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));
                  return (
                    <div key={idx} className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-slate-800">{day}</h3>
                        <button
                          onClick={() => setCreatingDay(idx)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          + Ajouter un créneau
                        </button>
                      </div>
                      {daySlots.length === 0 ? (
                        <div className="text-xs text-slate-400 italic">Aucun créneau</div>
                      ) : (
                        <div className="space-y-2">
                          {daySlots.map((slot) => (
                            <motion.div
                              key={slot.id}
                              layout
                              className="flex items-center gap-3 rounded-xl bg-slate-50 hover:bg-slate-100 p-3 cursor-pointer transition-colors"
                              onClick={() => setEditing(slot)}
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Supprimer ce créneau ?")) removeScheduleSlot(slot.id);
                                }}
                                className="text-xs text-rose-500 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors flex-shrink-0"
                              >
                                ✕
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {creatingDay !== null && selectedClasseId && (
          <SlotModal
            dayIndex={creatingDay}
            classeId={selectedClasseId}
            onClose={() => setCreatingDay(null)}
            onSave={(data) => {
              addScheduleSlot(data);
              setCreatingDay(null);
            }}
          />
        )}
        {editing && (
          <SlotModal
            slot={editing}
            dayIndex={editing.dayOfWeek}
            classeId={editing.classeId}
            onClose={() => setEditing(null)}
            onSave={(data) => {
              updateScheduleSlot(editing.id, data);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SlotModal({
  slot,
  dayIndex,
  classeId,
  onClose,
  onSave,
}: {
  slot?: ScheduleSlot;
  dayIndex: number;
  classeId: string;
  onClose: () => void;
  onSave: (data: Omit<ScheduleSlot, "id">) => void;
}) {
  const [dayOfWeek, setDayOfWeek] = useState(dayIndex);
  const [startTime, setStartTime] = useState(slot?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(slot?.endTime ?? "09:00");
  const [subject, setSubject] = useState(slot?.subject ?? "");
  const [teacher, setTeacher] = useState(slot?.teacher ?? "");
  const [room, setRoom] = useState(slot?.room ?? "");

  const canSave = subject.trim() && startTime && endTime;

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
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 grid place-items-center text-2xl shadow-md">
            🗓️
          </div>
          <h2 className="text-lg font-bold tracking-tight">{slot ? "Modifier le créneau" : "Nouveau créneau"}</h2>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Jour</span>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-600 mb-1.5 block">Début</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 mb-1.5 block">Fin</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Matière</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex. Mathématiques"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Enseignant (optionnel)</span>
            <input
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Ex. M. Bernard"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Salle (optionnel)</span>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Ex. Salle 3"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
            disabled={!canSave}
            onClick={() =>
              canSave && onSave({
                classeId,
                dayOfWeek,
                startTime,
                endTime,
                subject: subject.trim(),
                teacher: teacher.trim(),
                room: room.trim(),
              })
            }
            whileTap={{ scale: 0.98 }}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white py-2.5 text-sm font-semibold shadow-md disabled:opacity-50"
          >
            Enregistrer
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

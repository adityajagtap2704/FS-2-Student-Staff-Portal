"use client";

import { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, BookOpen, ChevronLeft, ChevronRight,
  Layers, Grid3X3, CalendarDays, AlertCircle, Download,
  MapPin, User, Sparkles
} from "lucide-react";

interface Slot { id: number; slotNumber: number; startTime: string; endTime: string; isBreak: boolean; breakLabel: string | null; }
interface Subject { id: number; name: string; code: string; color: string; classLevel: string; }
interface Classroom { id: number; name: string; building: string | null; }
interface Entry {
  id: number; classEnrolled: string; section: string; dayOfWeek: number;
  slotId: number; subjectId: number | null; staffId: number | null; classroomId: number | null;
  isPublished: boolean; slot: Slot; subject: Subject | null; classroom: Classroom | null;
}
interface SpecialSchedule { id: number; date: string; title: string; description: string | null; type: string; classEnrolled: string | null; }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TYPE_COLORS: Record<string, string> = {
  EVENT: "bg-blue-100 text-blue-700 border-blue-200",
  EXAM: "bg-red-100 text-red-700 border-red-200",
  HOLIDAY: "bg-green-100 text-green-700 border-green-200",
  TIMETABLE_CHANGE: "bg-amber-100 text-amber-700 border-amber-200",
};
const TYPE_DOTS: Record<string, string> = {
  EVENT: "bg-blue-500", EXAM: "bg-red-500", HOLIDAY: "bg-emerald-500", TIMETABLE_CHANGE: "bg-amber-500",
};

export default function StudentTimetableClient({ session }: { session: Session }) {
  const [view, setView] = useState<"weekly" | "monthly" | "daily">("weekly");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [specials, setSpecials] = useState<SpecialSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [staffMap, setStaffMap] = useState<Record<number, string>>({});

  const today = new Date();
  const todayDay = today.getDay() === 0 ? 7 : today.getDay(); // 1=Mon..6=Sat, 7=Sun

  // Get current time in HH:MM
  const nowTime = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;

  const isCurrentSlot = (slot: Slot) => {
    const d = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    const isToday = selectedDate.toDateString() === today.toDateString();
    return isToday && !slot.isBreak && slot.startTime <= nowTime && nowTime < slot.endTime;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([
        fetch("/api/timetable"),
        fetch(`/api/timetable/special?month=${calMonth.getMonth() + 1}&year=${calMonth.getFullYear()}`),
      ]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      setEntries(tData.entries || []);
      setSlots(tData.slots || []);
      setSpecials(sData.schedules || []);
      // Build staff name map
      const map: Record<number, string> = {};
      (tData.staff || []).forEach((s: any) => { map[s.id] = s.name; });
      setStaffMap(map);
    } catch { }
    setLoading(false);
  }, [calMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getEntry = (day: number, slotId: number) =>
    entries.find(e => e.dayOfWeek === day && e.slotId === slotId);

  const getDayEntries = (day: number) =>
    slots.filter(s => !s.isBreak).map(s => ({ slot: s, entry: getEntry(day, s.id) }));

  const getSpecialsForDate = (d: Date) =>
    specials.filter(s => new Date(s.date).toDateString() === d.toDateString());

  const calDays = () => {
    const year = calMonth.getFullYear(), month = calMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = (first.getDay() + 6) % 7; // Monday start
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const [exporting, setExporting] = useState(false);

  const downloadTimetable = () => {
    setExporting(true);
    const params = new URLSearchParams();
    if (view === "monthly") {
      params.set("mode", "monthly");
      params.set("month", String(calMonth.getMonth() + 1));
      params.set("year", String(calMonth.getFullYear()));
    } else {
      params.set("mode", "weekly");
    }
    window.open(`/api/timetable/export-pdf?${params.toString()}`, "_blank");
    setTimeout(() => setExporting(false), 1500);
  };

  // Today's schedule
  const todaySchedule = getDayEntries(todayDay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Calendar className="text-white" size={16} />
            </span>
            My Timetable
          </h1>
          <p className="text-sm text-gray-500 mt-1">View your weekly class schedule and upcoming events</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {([["weekly", Grid3X3, "Weekly"], ["daily", CalendarDays, "Today"], ["monthly", Layers, "Monthly"]] as const).map(([v, Icon, label]) => (
              <button key={v} onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v ? "bg-white shadow text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
          <button onClick={downloadTimetable} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60">
            <Download size={13} />{exporting ? "Exporting..." : view === "monthly" ? "Export Monthly PDF" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Today's Quick Summary */}
      {view !== "daily" && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Today&apos;s Schedule</span>
            <span className="text-xs text-emerald-500">({DAYS[todayDay - 1] || "Sunday"})</span>
          </div>
          {todayDay > 6 ? (
            <p className="text-sm text-gray-500">No classes today &mdash; enjoy your Sunday! 🎉</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {todaySchedule.filter(x => x.entry?.subject).slice(0, 5).map(({ slot, entry }) => (
                <div key={slot.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isCurrentSlot(slot) ? "border-emerald-400 bg-emerald-500 text-white shadow-sm" : "bg-white border-gray-200 text-gray-700"}`}>
                  {isCurrentSlot(slot) && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                  <span style={{ color: isCurrentSlot(slot) ? "white" : entry!.subject!.color }}>●</span>
                  {entry!.subject!.name}
                  <span className="opacity-70">{slot.startTime}</span>
                </div>
              ))}
              {todaySchedule.filter(x => x.entry?.subject).length === 0 && (
                <p className="text-sm text-gray-400">No published timetable for today yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
            <p className="text-sm text-gray-400">Loading timetable...</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* ─── WEEKLY VIEW ─── */}
          {view === "weekly" && (
            <motion.div key="weekly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                  <div className="p-3 text-xs font-semibold text-gray-400 text-center border-r border-gray-100">Period</div>
                  {DAYS.map((day, i) => {
                    const dayNum = i + 1;
                    const isToday = dayNum === todayDay;
                    return (
                      <div key={day} className={`p-3 text-center border-r border-gray-100 last:border-0 ${isToday ? "bg-emerald-50" : ""}`}>
                        <p className={`text-xs font-bold ${isToday ? "text-emerald-600" : "text-gray-500"}`}>{DAY_SHORT[i]}</p>
                        {isToday && <div className="mt-1 h-1 w-6 rounded-full bg-emerald-400 mx-auto" />}
                      </div>
                    );
                  })}
                </div>
                {/* Slots */}
                {slots.map(slot => (
                  <div key={slot.id} className={`grid grid-cols-7 border-b border-gray-50 last:border-0 ${slot.isBreak ? "bg-gray-50" : ""}`}>
                    {/* Time column */}
                    <div className="p-2 border-r border-gray-100 flex flex-col items-center justify-center text-center">
                      {slot.isBreak ? (
                        <span className="text-[10px] text-gray-400 font-medium">{slot.breakLabel}</span>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-gray-500">P{slot.slotNumber}</span>
                          <span className="text-[9px] text-gray-400">{slot.startTime}</span>
                          <span className="text-[9px] text-gray-300">–{slot.endTime}</span>
                        </>
                      )}
                    </div>
                    {/* Day columns */}
                    {DAYS.map((_, i) => {
                      const dayNum = i + 1;
                      const entry = getEntry(dayNum, slot.id);
                      const isCurrent = isCurrentSlot(slot) && dayNum === todayDay;
                      if (slot.isBreak) {
                        return <div key={i} className="border-r border-gray-100 last:border-0 p-1 text-center">
                          <span className="text-[10px] text-gray-300">{slot.breakLabel}</span>
                        </div>;
                      }
                      return (
                        <div key={i} className={`border-r border-gray-100 last:border-0 p-1 min-h-[52px] flex items-center justify-center transition-colors ${isCurrent ? "bg-emerald-50 ring-1 ring-inset ring-emerald-300" : dayNum === todayDay ? "bg-emerald-50/30" : "hover:bg-gray-50"}`}>
                          {entry?.subject ? (
                            <div className="w-full rounded-md p-1.5 text-left" style={{ backgroundColor: entry.subject.color + "15", borderLeft: `2.5px solid ${entry.subject.color}` }}>
                              <p className="text-[10px] font-bold leading-tight truncate" style={{ color: entry.subject.color }}>{entry.subject.name}</p>
                              {entry.staffId && staffMap[entry.staffId] && <p className="text-[9px] text-gray-500 leading-tight truncate mt-0.5">{staffMap[entry.staffId]}</p>}
                              {entry.classroom && <p className="text-[8px] text-gray-400 leading-tight truncate flex items-center gap-0.5"><MapPin size={7} />{entry.classroom.name}</p>}
                              {isCurrent && <span className="text-[9px] bg-emerald-500 text-white rounded px-1 mt-0.5 inline-block">● Live</span>}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-200">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── DAILY VIEW ─── */}
          {view === "daily" && (
            <motion.div key="daily" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Day Selector */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {DAYS.map((day, i) => {
                  const dayNum = i + 1;
                  const isToday = dayNum === todayDay;
                  const isSelected = dayNum === (selectedDate.getDay() === 0 ? 7 : selectedDate.getDay());
                  return (
                    <button key={day} onClick={() => {
                      const d = new Date();
                      const diff = dayNum - (d.getDay() === 0 ? 7 : d.getDay());
                      d.setDate(d.getDate() + diff);
                      setSelectedDate(d);
                    }}
                      className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${isSelected ? "bg-emerald-500 text-white border-emerald-500 shadow" : isToday ? "border-emerald-300 text-emerald-600 bg-emerald-50" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      {DAY_SHORT[i]}
                    </button>
                  );
                })}
              </div>
              {/* Daily Schedule */}
              <div className="space-y-2">
                {slots.map(slot => {
                  const dayNum = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
                  const entry = getEntry(dayNum, slot.id);
                  const isCurrent = isCurrentSlot(slot);
                  if (slot.isBreak) {
                    return (
                      <div key={slot.id} className="flex items-center gap-3 py-1">
                        <span className="text-xs text-gray-400 w-24 text-right shrink-0">{slot.startTime} – {slot.endTime}</span>
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs text-gray-400 shrink-0">{slot.breakLabel}</span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                    );
                  }
                  return (
                    <motion.div key={slot.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-4 p-4 rounded-2xl border transition-all ${isCurrent ? "border-emerald-300 bg-emerald-50 shadow-md" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                      <div className="text-center shrink-0 w-16">
                        <p className="text-xs font-bold text-emerald-600">P{slot.slotNumber}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{slot.startTime}</p>
                        <p className="text-[10px] text-gray-300">– {slot.endTime}</p>
                        {isCurrent && <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      <div className="flex-1">
                        {entry?.subject ? (
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-1 rounded-full shrink-0" style={{ backgroundColor: entry.subject.color }} />
                            <div>
                              <p className="font-semibold text-gray-800">{entry.subject.name}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {entry.classroom && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border">
                                    <MapPin size={10} />{entry.classroom.name}
                                  </span>
                                )}
                                {entry.staffId && staffMap[entry.staffId] && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border">
                                    <User size={10} />{staffMap[entry.staffId]}
                                  </span>
                                )}
                                {isCurrent && (
                                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Ongoing
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <div className="h-10 w-1 rounded-full bg-gray-200" />
                            <p className="text-sm">Free Period</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── MONTHLY VIEW ─── */}
          {view === "monthly" && (
            <motion.div key="monthly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Calendar header */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <h3 className="font-semibold text-gray-800">
                    {calMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </h3>
                  <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-7">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                    <div key={d} className="p-2 text-center text-[11px] font-semibold text-gray-400 border-b border-gray-100">{d}</div>
                  ))}
                  {calDays().map((day, idx) => {
                    const daySpecials = day ? getSpecialsForDate(day) : [];
                    const isToday = day?.toDateString() === today.toDateString();
                    const isSelected = day?.toDateString() === selectedDay?.toDateString();
                    return (
                      <div key={idx}
                        onClick={() => day && setSelectedDay(day)}
                        className={`min-h-[70px] p-1.5 border-b border-r border-gray-50 cursor-pointer transition-colors ${!day ? "bg-gray-50/50" : isSelected ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                        {day && (
                          <>
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${isToday ? "bg-emerald-500 text-white" : "text-gray-600"}`}>
                              {day.getDate()}
                            </div>
                            <div className="space-y-0.5">
                              {daySpecials.slice(0, 2).map(s => (
                                <div key={s.id} className="flex items-center gap-1">
                                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${TYPE_DOTS[s.type] || "bg-gray-400"}`} />
                                  <span className="text-[9px] text-gray-600 truncate">{s.title}</span>
                                </div>
                              ))}
                              {daySpecials.length > 2 && <span className="text-[9px] text-gray-400">+{daySpecials.length - 2} more</span>}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {Object.entries(TYPE_DOTS).map(([type, cls]) => (
                  <span key={type} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${cls}`} />{type.replace("_", " ")}
                  </span>
                ))}
              </div>

              {/* Selected day detail */}
              {selectedDay && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    {selectedDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                  {getSpecialsForDate(selectedDay).length > 0 ? (
                    <div className="space-y-2">
                      {getSpecialsForDate(selectedDay).map(s => (
                        <div key={s.id} className={`flex gap-3 p-3 rounded-xl border text-sm ${TYPE_COLORS[s.type] || "bg-gray-50 border-gray-200 text-gray-700"}`}>
                          <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${TYPE_DOTS[s.type]}`} />
                          <div>
                            <p className="font-medium">{s.title}</p>
                            {s.description && <p className="text-xs opacity-80 mt-0.5">{s.description}</p>}
                            {s.classEnrolled && <p className="text-xs opacity-60 mt-0.5">For {s.classEnrolled}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <Calendar size={24} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No special events on this day</p>
                    </div>
                  )}
                  {/* Class schedule for that day */}
                  {selectedDay.getDay() !== 0 && (
                    <>
                      <div className="border-t border-gray-100 mt-3 pt-3">
                        <p className="text-xs font-semibold text-gray-400 mb-2">CLASS SCHEDULE</p>
                        <div className="flex flex-wrap gap-2">
                          {getDayEntries(selectedDay.getDay() === 0 ? 7 : selectedDay.getDay())
                            .filter(x => x.entry?.subject)
                            .map(({ slot, entry }) => (
                              <div key={slot.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry!.subject!.color }} />
                                <span className="font-medium text-gray-700">{entry!.subject!.name}</span>
                                <span className="text-gray-400">{slot.startTime}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Not published notice */}
      {!loading && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-amber-400" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-1">Timetable Not Yet Published</h3>
          <p className="text-sm text-gray-400 max-w-xs">Your class timetable hasn&apos;t been published yet. Please check back later or contact your teacher.</p>
        </div>
      )}
    </div>
  );
}

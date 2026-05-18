"use client";
import { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, BookOpen, Grid3X3, CalendarDays, Download, ChevronLeft, ChevronRight, Layers, User } from "lucide-react";

interface Slot { id:number; slotNumber:number; startTime:string; endTime:string; isBreak:boolean; breakLabel:string|null; }
interface Subject { id:number; name:string; color:string; }
interface Classroom { id:number; name:string; }
interface StaffInfo { id:number; name:string; }
interface Entry { id:number; classEnrolled:string; section:string; dayOfWeek:number; slotId:number; staffId:number|null; slot:Slot; subject:Subject|null; classroom:Classroom|null; }
interface Special { id:number; date:string; title:string; description:string|null; type:string; }

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat"];
const TYPE_DOT: Record<string,string> = { EVENT:"bg-blue-400", EXAM:"bg-red-400", HOLIDAY:"bg-emerald-400", TIMETABLE_CHANGE:"bg-amber-400" };
const TYPE_BG: Record<string,string>  = { EVENT:"bg-blue-50 text-blue-700 border-blue-200", EXAM:"bg-red-50 text-red-700 border-red-200", HOLIDAY:"bg-emerald-50 text-emerald-700 border-emerald-200", TIMETABLE_CHANGE:"bg-amber-50 text-amber-700 border-amber-200" };

export default function StaffTimetableClient({ session }: { session:Session }) {
  const [view, setView] = useState<"weekly"|"daily"|"monthly">("weekly");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [staffMap, setStaffMap] = useState<Record<number,string>>({});
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);
  const [selDayIdx, setSelDayIdx] = useState(0);
  const [calMonth, setCalMonth] = useState(new Date());
  const [selDate, setSelDate] = useState<Date|null>(null);

  const today = new Date();
  const todayDay = today.getDay()===0?7:today.getDay();
  const nowTime = `${String(today.getHours()).padStart(2,"0")}:${String(today.getMinutes()).padStart(2,"0")}`;
  const isCurrent = (slot:Slot, d:number) => d===todayDay && !slot.isBreak && slot.startTime<=nowTime && nowTime<slot.endTime;

  const staffId = (session.user as any)?.id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sfRes, spRes] = await Promise.all([
        fetch(`/api/timetable?staffId=${staffId}`),
        fetch(`/api/timetable/staff`),
        fetch(`/api/timetable/special?month=${calMonth.getMonth()+1}&year=${calMonth.getFullYear()}`),
      ]);
      const [t, sf, sp] = await Promise.all([tRes.json(), sfRes.json(), spRes.json()]);
      setEntries(t.entries||[]); setSlots(t.slots||[]);
      const m: Record<number,string> = {};
      (sf.staff||[]).forEach((s:StaffInfo)=>{ m[s.id]=s.name; });
      setStaffMap(m);
      setSpecials(sp.schedules||[]);
    } catch {}
    setLoading(false);
  }, [staffId, calMonth]);

  useEffect(()=>{ load(); },[load]);

  const getE = (d:number,s:number) => entries.find(e=>e.dayOfWeek===d&&e.slotId===s);
  const specialsForDate = (d:Date) => specials.filter(s=>new Date(s.date).toDateString()===d.toDateString());

  const calDays = () => {
    const y=calMonth.getFullYear(), m=calMonth.getMonth();
    const first=new Date(y,m,1), last=new Date(y,m+1,0);
    const pad=(first.getDay()+6)%7;
    const days:(Date|null)[] = Array(pad).fill(null);
    for (let d=1;d<=last.getDate();d++) days.push(new Date(y,m,d));
    return days;
  };

  const download = () => {
    let txt="KALNET Staff Timetable\n\n";
    DAYS.forEach((day,i)=>{ txt+=`\n${day}\n${"─".repeat(36)}\n`; slots.filter(s=>!s.isBreak).forEach(s=>{ const e=getE(i+1,s.id); if(e?.subject) txt+=`  ${s.startTime}–${s.endTime}  ${e.subject.name} | ${e.classEnrolled}\n`; }); });
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([txt],{type:"text/plain"})); a.download="staff-timetable.txt"; a.click();
  };

  const views = [["weekly",Grid3X3,"Weekly"],["daily",CalendarDays,"Daily"],["monthly",Layers,"Monthly"]] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center"><Calendar className="text-white" size={14}/></span>
            My Teaching Schedule
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Your assignments across all classes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {views.map(([v,Icon,label])=>(
              <button key={v} onClick={()=>setView(v)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view===v?"bg-white shadow text-emerald-600":"text-gray-500 hover:text-gray-700"}`}>
                <Icon size={12}/>{label}
              </button>
            ))}
          </div>
          <button onClick={download} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition-colors">
            <Download size={12}/>Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {label:"Periods / Week", value:entries.length, icon:Clock, bg:"bg-emerald-50", txt:"text-emerald-500"},
          {label:"Classes", value:new Set(entries.map(e=>e.classEnrolled)).size, icon:BookOpen, bg:"bg-blue-50", txt:"text-blue-500"},
          {label:"Working Days", value:6, icon:Calendar, bg:"bg-purple-50", txt:"text-purple-500"},
        ].map(({label,value,icon:Icon,bg,txt})=>(
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
            <div className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center mb-2`}><Icon size={13} className={txt}/></div>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-[10px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-9 w-9 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin"/>
        </div>
      ) : (
        <AnimatePresence mode="wait">

          {/* ── WEEKLY ── */}
          {view==="weekly" && (
            <motion.div key="weekly" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <div className="grid grid-cols-7 border-b border-gray-100 min-w-[620px]">
                  <div className="px-2 py-2 text-[10px] font-bold text-gray-400 text-center border-r border-gray-100">TIME</div>
                  {DAYS.map((day,i)=>(
                    <div key={day} className={`px-1 py-2 text-center border-r border-gray-100 last:border-0 ${i+1===todayDay?"bg-emerald-50":""}`}>
                      <p className={`text-[11px] font-bold ${i+1===todayDay?"text-emerald-600":"text-gray-600"}`}>{DAY_SHORT[i]}</p>
                      <p className="text-[9px] text-gray-400 hidden sm:block">{day.slice(0,3)}</p>
                    </div>
                  ))}
                </div>
                {slots.map(slot=>(
                  <div key={slot.id} className={`grid grid-cols-7 border-b border-gray-50 last:border-0 min-w-[620px] ${slot.isBreak?"bg-amber-50/30":""}`}>
                    <div className="px-1.5 py-1 border-r border-gray-100 flex flex-col items-center justify-center min-h-[56px] text-center">
                      {slot.isBreak
                        ? <span className="text-[9px] text-amber-600 font-semibold">{slot.breakLabel}</span>
                        : <><span className="text-[10px] font-bold text-emerald-600">P{slot.slotNumber}</span>
                            <span className="text-[9px] text-gray-400 leading-none">{slot.startTime}</span>
                            <span className="text-[8px] text-gray-300">–{slot.endTime}</span></>
                      }
                    </div>
                    {DAYS.map((_,i)=>{
                      const d=i+1, e=getE(d,slot.id), cur=isCurrent(slot,d);
                      if (slot.isBreak) return <div key={i} className="border-r border-gray-100 last:border-0 bg-amber-50/20"/>;
                      return (
                        <div key={i} className={`border-r border-gray-100 last:border-0 p-0.5 min-h-[56px] ${cur?"bg-emerald-50 ring-1 ring-inset ring-emerald-300":d===todayDay?"bg-emerald-50/20":"hover:bg-gray-50"}`}>
                          {e?.subject ? (
                            <div className="h-full rounded-md px-1.5 py-1" style={{background:e.subject.color+"13",borderLeft:`2.5px solid ${e.subject.color}`}}>
                              <p className="text-[10px] font-bold leading-tight truncate" style={{color:e.subject.color}}>{e.subject.name}</p>
                              <p className="text-[9px] text-emerald-600 font-semibold truncate">{e.classEnrolled}</p>
                              {e.staffId && staffMap[e.staffId] && (
                                <p className="text-[8px] text-gray-500 truncate flex items-center gap-0.5">
                                  <User size={7}/>{staffMap[e.staffId]}
                                </p>
                              )}
                              {e.classroom && <p className="text-[8px] text-gray-400 truncate">{e.classroom.name}</p>}
                              {cur && <span className="text-[8px] bg-emerald-500 text-white rounded px-1 inline-block">● Live</span>}
                            </div>
                          ) : <div className="h-full flex items-center justify-center min-h-[44px]"><span className="text-[10px] text-gray-200">—</span></div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── DAILY ── */}
          {view==="daily" && (
            <motion.div key="daily" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {DAYS.map((day,i)=>(
                  <button key={day} onClick={()=>setSelDayIdx(i)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${selDayIdx===i?"bg-emerald-500 text-white border-emerald-500":i+1===todayDay?"border-emerald-300 text-emerald-600 bg-emerald-50":"border-gray-200 text-gray-600 hover:border-emerald-200"}`}>
                    {DAY_SHORT[i]}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {slots.map(slot=>{
                  const d=selDayIdx+1, e=getE(d,slot.id), cur=isCurrent(slot,d);
                  if (slot.isBreak) return (
                    <div key={slot.id} className="flex items-center gap-3 py-1 text-xs text-gray-400">
                      <span className="w-16 text-right shrink-0">{slot.startTime}</span>
                      <div className="h-px flex-1 bg-gray-100"/><span className="shrink-0">{slot.breakLabel}</span><div className="h-px flex-1 bg-gray-100"/>
                    </div>
                  );
                  return (
                    <motion.div key={slot.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}}
                      className={`flex gap-3 p-3 rounded-2xl border transition-all ${cur?"border-emerald-300 bg-emerald-50 shadow-sm":"border-gray-100 bg-white hover:border-gray-200"}`}>
                      <div className="text-center w-12 shrink-0">
                        <p className="text-[10px] font-bold text-emerald-600">P{slot.slotNumber}</p>
                        <p className="text-[9px] text-gray-400">{slot.startTime}</p>
                        <p className="text-[9px] text-gray-300">–{slot.endTime}</p>
                        {cur && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse block mx-auto mt-1"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        {e?.subject ? (
                          <div className="flex items-start gap-2">
                            <div className="h-full w-0.5 rounded-full shrink-0 mt-0.5" style={{backgroundColor:e.subject.color, minHeight:36}}/>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-800 text-sm truncate">{e.subject.name}</p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">{e.classEnrolled} · {e.section}</span>
                                {e.staffId && staffMap[e.staffId] && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full">
                                    <User size={9}/>{staffMap[e.staffId]}
                                  </span>
                                )}
                                {e.classroom && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full">
                                    <MapPin size={9}/>{e.classroom.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <div className="w-0.5 rounded-full bg-gray-200" style={{minHeight:36}}/>
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

          {/* ── MONTHLY ── */}
          {view==="monthly" && (
            <motion.div key="monthly" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Month nav */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/60 to-white">
                  <button onClick={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()-1))}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"><ChevronLeft size={14}/></button>
                  <h3 className="font-bold text-gray-800 text-sm">{calMonth.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</h3>
                  <button onClick={()=>setCalMonth(m=>new Date(m.getFullYear(),m.getMonth()+1))}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"><ChevronRight size={14}/></button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>(
                    <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-400">{d}</div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {calDays().map((day,idx)=>{
                    const daySpecials = day ? specialsForDate(day) : [];
                    const isToday = day?.toDateString()===today.toDateString();
                    const isSel = day?.toDateString()===selDate?.toDateString();
                    const dayOfWk = day ? (day.getDay()===0?7:day.getDay()) : 0;
                    const hasPeriods = day && dayOfWk<=6 && slots.filter(s=>!s.isBreak).some(s=>getE(dayOfWk,s.id)?.subject);
                    return (
                      <div key={idx} onClick={()=>day&&setSelDate(day)}
                        className={`min-h-[64px] p-1 border-b border-r border-gray-50 cursor-pointer transition-colors ${!day?"bg-gray-50/50":isSel?"bg-emerald-50":isToday?"bg-emerald-50/40":"hover:bg-gray-50"}`}>
                        {day && <>
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-0.5 ${isToday?"bg-emerald-500 text-white":"text-gray-600"}`}>{day.getDate()}</div>
                          {hasPeriods && <div className="flex items-center gap-0.5 mb-0.5"><span className="h-1 w-1 rounded-full bg-emerald-400"/><span className="text-[8px] text-emerald-600 font-medium">Classes</span></div>}
                          {daySpecials.slice(0,2).map(s=>(
                            <div key={s.id} className="flex items-center gap-0.5">
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${TYPE_DOT[s.type]||"bg-gray-400"}`}/>
                              <span className="text-[8px] text-gray-600 truncate">{s.title}</span>
                            </div>
                          ))}
                          {daySpecials.length>2 && <span className="text-[8px] text-gray-400">+{daySpecials.length-2}</span>}
                        </>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400"/>Classes</span>
                {Object.entries(TYPE_DOT).map(([t,cls])=>(
                  <span key={t} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${cls}`}/>{t.replace("_"," ")}</span>
                ))}
              </div>

              {/* Selected date detail */}
              {selDate && (
                <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                  <h3 className="font-bold text-gray-800 text-sm">
                    {selDate.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}
                  </h3>
                  {/* Events */}
                  {specialsForDate(selDate).map(s=>(
                    <div key={s.id} className={`flex gap-2 p-2.5 rounded-xl border text-xs ${TYPE_BG[s.type]||"bg-gray-50 border-gray-200 text-gray-700"}`}>
                      <span className={`h-2 w-2 rounded-full mt-0.5 shrink-0 ${TYPE_DOT[s.type]}`}/>
                      <div><p className="font-semibold">{s.title}</p>{s.description&&<p className="opacity-70 text-[10px]">{s.description}</p>}</div>
                    </div>
                  ))}
                  {/* My periods that day */}
                  {selDate.getDay()!==0 && (() => {
                    const dw = selDate.getDay()===0?7:selDate.getDay();
                    const myPeriods = slots.filter(s=>!s.isBreak).map(s=>({slot:s,e:getE(dw,s.id)})).filter(x=>x.e?.subject);
                    return myPeriods.length>0 ? (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Your Classes</p>
                        <div className="space-y-1.5">
                          {myPeriods.map(({slot,e})=>(
                            <div key={slot.id} className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 border border-gray-100">
                              <span className="h-7 w-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 shrink-0">P{slot.slotNumber}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-gray-800 truncate">{e!.subject!.name}</p>
                                <p className="text-[9px] text-gray-500">{slot.startTime}–{slot.endTime} · {e!.classEnrolled}</p>
                              </div>
                              <div className="h-2 w-2 rounded-full shrink-0" style={{backgroundColor:e!.subject!.color}}/>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-2">No classes scheduled for this day</p>
                    );
                  })()}
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}

      {!loading && entries.length===0 && (
        <div className="text-center py-14 text-gray-400">
          <Calendar size={28} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium text-gray-500">No timetable assigned yet</p>
          <p className="text-xs mt-1">Contact the HOD to get your schedule assigned.</p>
        </div>
      )}
    </div>
  );
}

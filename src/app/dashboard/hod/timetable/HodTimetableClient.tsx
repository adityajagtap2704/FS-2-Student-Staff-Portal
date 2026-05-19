"use client";
import { useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, Trash2, Eye, EyeOff, Save, X, AlertCircle, CheckCircle, Grid3X3 } from "lucide-react";
import AddableSelect, { SelectOption } from "@/components/ui/AddableSelect";

const CLASSES = ["Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat"];

interface Slot { id:number; slotNumber:number; startTime:string; endTime:string; isBreak:boolean; breakLabel:string|null; }
interface Subject { id:number; name:string; code:string; color:string; }
interface Classroom { id:number; name:string; building:string|null; }
interface Staff { id:number; name:string; assignedClass:string|null; }
interface Entry { id:number; dayOfWeek:number; slotId:number; subjectId:number|null; staffId:number|null; classroomId:number|null; isPublished:boolean; slot:Slot; subject:Subject|null; classroom:Classroom|null; }
interface Special { id:number; date:string; title:string; description:string|null; type:string; classEnrolled:string|null; }

const TYPE_COLORS: Record<string,string> = { EVENT:"bg-blue-100 text-blue-700", EXAM:"bg-red-100 text-red-700", HOLIDAY:"bg-emerald-100 text-emerald-700", TIMETABLE_CHANGE:"bg-amber-100 text-amber-700" };

export default function HodTimetableClient({ session }: { session:Session }) {
  const [cls, setCls] = useState("Class 6");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Classroom[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);
  const [tab, setTab] = useState<"tt"|"sp">("tt");
  const [editCell, setEditCell] = useState<{day:number;slotId:number}|null>(null);
  const [form, setForm] = useState({subjectId:"",staffId:"",classroomId:""});
  const [spForm, setSpForm] = useState({date:"",title:"",description:"",type:"EVENT",classEnrolled:""});
  const [showSpForm, setShowSpForm] = useState(false);
  const [published, setPublished] = useState(false);

  const msg = (m:string, ok=true) => { setToast({msg:m,ok}); setTimeout(()=>setToast(null),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t,s,r,sf,sp] = await Promise.all([
        fetch(`/api/timetable?class=${encodeURIComponent(cls)}&section=A`).then(r=>r.json()),
        fetch(`/api/timetable/subjects?class=${encodeURIComponent(cls)}`).then(r=>r.json()),
        fetch(`/api/timetable/classrooms`).then(r=>r.json()),
        fetch(`/api/timetable/staff`).then(r=>r.json()),
        fetch(`/api/timetable/special?month=${new Date().getMonth()+1}&year=${new Date().getFullYear()}&class=${encodeURIComponent(cls)}`).then(r=>r.json()),
      ]);
      setEntries(t.entries||[]); setSlots(t.slots||[]);
      setSubjects(s.subjects||[]); setRooms(r.classrooms||[]); setStaff(sf.staff||[]); setSpecials(sp.schedules||[]);
      setPublished((t.entries||[]).some((e:Entry)=>e.isPublished));
    } catch {}
    setLoading(false);
  }, [cls]);

  useEffect(()=>{ load(); },[load]);

  const getE = (d:number,s:number) => entries.find(e=>e.dayOfWeek===d&&e.slotId===s);
  const getName = (id:number|null) => staff.find(s=>s.id===id)?.name||"";

  const openEdit = (d:number,s:number) => {
    const e=getE(d,s);
    setEditCell({day:d,slotId:s});
    setForm({subjectId:e?.subjectId?.toString()||"",staffId:e?.staffId?.toString()||"",classroomId:e?.classroomId?.toString()||""});
  };

  const save = async () => {
    if (!editCell) return; setSaving(true);
    const res = await fetch("/api/timetable",{ method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ classEnrolled:cls, section:"A", dayOfWeek:editCell.day, slotId:editCell.slotId,
        subjectId:form.subjectId?+form.subjectId:null, staffId:form.staffId?+form.staffId:null, classroomId:form.classroomId?+form.classroomId:null }) });
    const d=await res.json();
    if (!res.ok) msg(d.error||"Failed",false); else { msg("Saved!"); setEditCell(null); load(); }
    setSaving(false);
  };

  const del = async (id:number) => {
    if (!confirm("Clear period?")) return;
    const r=await fetch(`/api/timetable/${id}`,{method:"DELETE"});
    if (r.ok) { msg("Cleared"); load(); } else msg("Failed",false);
  };

  const togglePub = async () => {
    const r=await fetch("/api/timetable/publish",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({classEnrolled:cls,section:"A",isPublished:!published})});
    if (r.ok) { msg(`${!published?"Published":"Unpublished"}!`); setPublished(!published); load(); } else msg("Failed",false);
  };

  const addSpecial = async () => {
    if (!spForm.date||!spForm.title) { msg("Date & title required",false); return; }
    const r=await fetch("/api/timetable/special",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...spForm,classEnrolled:spForm.classEnrolled||null})});
    if (r.ok) { msg("Event added!"); setShowSpForm(false); setSpForm({date:"",title:"",description:"",type:"EVENT",classEnrolled:""}); load(); } else msg("Failed",false);
  };

  const delSpecial = async (id:number) => {
    const r=await fetch("/api/timetable/special",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    if (r.ok) { msg("Deleted"); load(); }
  };

  // AddableSelect options
  const subjectOpts: SelectOption[] = subjects.map(s=>({ value:String(s.id), label:s.name, sub:s.code }));
  const staffOpts: SelectOption[] = staff.map(s=>({ value:String(s.id), label:s.name, sub:s.assignedClass||"Subject Teacher" }));
  const roomOpts: SelectOption[] = rooms.map(r=>({ value:String(r.id), label:r.name, sub:r.building||"" }));
  const subColorDot: Record<string,string> = Object.fromEntries(subjects.map(s=>[String(s.id),s.color]));

  const addSubject = async (data: Record<string,string>) => {
    if (!data.name||!data.code) throw new Error("Name and code required");
    const r=await fetch("/api/timetable/subjects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:data.name,code:data.code,color:data.color||"#10b981",classLevel:cls})});
    const d=await r.json(); if (!r.ok) throw new Error(d.error||"Failed");
    await load(); msg("Subject added!");
  };

  const addStaff = async (data: Record<string,string>) => {
    if (!data.name||!data.email) throw new Error("Name and email required");
    const r=await fetch("/api/timetable/staff",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:data.name,email:data.email,assignedClass:data.assignedClass||null})});
    const d=await r.json(); if (!r.ok) throw new Error(d.error||"Failed");
    await load(); msg("Teacher added!");
  };

  const addRoom = async (data: Record<string,string>) => {
    if (!data.name) throw new Error("Room name required");
    const r=await fetch("/api/timetable/classrooms",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:data.name,building:data.building||null,capacity:data.capacity||40})});
    const d=await r.json(); if (!r.ok) throw new Error(d.error||"Failed");
    await load(); msg("Room added!");
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast&&<motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} exit={{opacity:0}}
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium ${toast.ok?"bg-emerald-500":"bg-red-500"} text-white`}>
          {toast.ok?<CheckCircle size={14}/>:<AlertCircle size={14}/>}{toast.msg}
        </motion.div>}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center"><Grid3X3 className="text-white" size={14}/></span>
            Timetable Management
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Click any cell → assign subject, teacher & room</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select value={cls} onChange={e=>{setCls(e.target.value);setEditCell(null);}}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 font-medium text-gray-700">
            {CLASSES.map(c=><option key={c}>{c}</option>)}
          </select>
          <span className="px-2.5 py-1.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-semibold">Section A</span>
          <button onClick={togglePub}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${published?"bg-amber-100 text-amber-700 hover:bg-amber-200":"bg-emerald-500 text-white hover:bg-emerald-600"}`}>
            {published?<><EyeOff size={12}/>Unpublish</>:<><Eye size={12}/>Publish</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([["tt","📅 Weekly Timetable"],["sp","🗓 Special Schedules"]] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${tab===t?"bg-white shadow text-emerald-600":"text-gray-500 hover:text-gray-700"}`}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-9 w-9 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin"/>
        </div>
      ) : tab==="tt" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          {/* Status */}
          <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${published?"bg-emerald-100 text-emerald-700":"bg-gray-200 text-gray-500"}`}>
              {published?"● Published":"○ Draft"}
            </span>
            <span className="text-[10px] text-gray-400">{cls} · Section A · Click any period cell to edit</span>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 min-w-[620px]">
            <div className="px-2 py-2 text-[10px] font-bold text-gray-400 text-center border-r border-gray-100">TIME</div>
            {DAYS.map((day,i)=>(
              <div key={day} className="px-1 py-2 text-center border-r border-gray-100 last:border-0 bg-gradient-to-b from-emerald-50/60 to-white">
                <p className="text-[11px] font-bold text-emerald-700">{DAY_SHORT[i]}</p>
                <p className="text-[9px] text-gray-400">{day.slice(0,3)}</p>
              </div>
            ))}
          </div>

          {/* Rows */}
          {slots.map(slot=>(
            <div key={slot.id} className={`grid grid-cols-7 border-b border-gray-50 last:border-0 min-w-[620px] ${slot.isBreak?"bg-gradient-to-r from-amber-50/40 to-orange-50/20":""}`}>
              <div className="px-1.5 py-1 border-r border-gray-100 flex flex-col items-center justify-center min-h-[52px]">
                {slot.isBreak
                  ? <span className="text-[9px] text-amber-600 font-semibold">{slot.breakLabel}</span>
                  : <>
                      <span className="text-[10px] font-bold text-emerald-600">P{slot.slotNumber}</span>
                      <span className="text-[9px] text-gray-400">{slot.startTime}</span>
                      <span className="text-[8px] text-gray-300">–{slot.endTime}</span>
                    </>
                }
              </div>
              {DAYS.map((_,i)=>{
                const day=i+1, entry=getE(day,slot.id), isEd=editCell?.day===day&&editCell?.slotId===slot.id;
                if (slot.isBreak) return <div key={i} className="border-r border-gray-100 last:border-0 bg-amber-50/20"/>;
                return (
                  <div key={i} onClick={()=>!isEd&&openEdit(day,slot.id)}
                    className={`border-r border-gray-100 last:border-0 p-0.5 min-h-[52px] cursor-pointer transition-all ${isEd?"bg-emerald-50 ring-2 ring-inset ring-emerald-400":"hover:bg-emerald-50/50"}`}>
                    {entry?.subject ? (
                      <div className="h-full rounded-md px-1.5 py-1 relative group"
                        style={{background:`${entry.subject.color}12`,borderLeft:`2.5px solid ${entry.subject.color}`}}>
                        <p className="text-[10px] font-bold leading-tight truncate" style={{color:entry.subject.color}}>{entry.subject.name}</p>
                        <p className="text-[9px] text-gray-500 leading-tight truncate mt-0.5">{getName(entry.staffId)}</p>
                        {entry.classroom&&<p className="text-[8px] text-gray-400 truncate">{entry.classroom.name}</p>}
                        <button onClick={e=>{e.stopPropagation();del(entry.id);}}
                          className="absolute top-0.5 right-0.5 hidden group-hover:flex h-3.5 w-3.5 rounded bg-red-100 text-red-400 hover:bg-red-500 hover:text-white items-center justify-center transition-colors">
                          <X size={7}/>
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center min-h-[44px] group">
                        <Plus size={11} className="text-gray-200 group-hover:text-emerald-400 transition-colors"/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Edit panel */}
          <AnimatePresence>
            {editCell&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                className="border-t-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {editCell.day}
                    </span>
                    <p className="text-xs font-bold text-emerald-700">
                      {DAYS[editCell.day-1]} · Period {slots.find(s=>s.id===editCell.slotId)?.slotNumber} ({slots.find(s=>s.id===editCell.slotId)?.startTime} – {slots.find(s=>s.id===editCell.slotId)?.endTime})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Subject</p>
                      <AddableSelect
                        value={form.subjectId} onChange={v=>setForm(f=>({...f,subjectId:v}))}
                        options={subjectOpts} placeholder="Select Subject" colorDot={subColorDot}
                        onAdd={addSubject} addLabel="+ Add Subject"
                        addFields={[
                          {key:"name",placeholder:"Subject name (e.g. Physics)"},
                          {key:"code",placeholder:"Code (e.g. PHY11)"},
                          {key:"color",placeholder:"Color (e.g. #6366f1)",type:"color"},
                        ]}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Teacher</p>
                      <AddableSelect
                        value={form.staffId} onChange={v=>setForm(f=>({...f,staffId:v}))}
                        options={staffOpts} placeholder="Select Teacher"
                        onAdd={addStaff} addLabel="+ Add Teacher"
                        addFields={[
                          {key:"name",placeholder:"Full name"},
                          {key:"email",placeholder:"Email address",type:"email"},
                          {key:"assignedClass",placeholder:"Assigned class (optional)"},
                        ]}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Room</p>
                      <AddableSelect
                        value={form.classroomId} onChange={v=>setForm(f=>({...f,classroomId:v}))}
                        options={roomOpts} placeholder="Select Room"
                        onAdd={addRoom} addLabel="+ Add Room"
                        addFields={[
                          {key:"name",placeholder:"Room name (e.g. Room 201)"},
                          {key:"building",placeholder:"Block/Building (optional)"},
                          {key:"capacity",placeholder:"Capacity (default 40)",type:"number"},
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={save} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 disabled:opacity-60 shadow-sm transition-colors">
                      <Save size={12}/>{saving?"Saving...":"Save Period"}
                    </button>
                    <button onClick={()=>setEditCell(null)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-white transition-colors">
                      <X size={12}/>Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Special Schedules */
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Events, exams & holidays shown on student calendars</p>
            <button onClick={()=>setShowSpForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors">
              <Plus size={12}/>Add Event
            </button>
          </div>

          <AnimatePresence>
            {showSpForm&&(
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-emerald-700">New Special Schedule</p>
                <div className="flex flex-wrap gap-2">
                  <input type="date" value={spForm.date} onChange={e=>setSpForm(f=>({...f,date:e.target.value}))}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"/>
                  <input placeholder="Title *" value={spForm.title} onChange={e=>setSpForm(f=>({...f,title:e.target.value}))}
                    className="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"/>
                  <select value={spForm.type} onChange={e=>setSpForm(f=>({...f,type:e.target.value}))}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
                    {["EVENT","EXAM","HOLIDAY","TIMETABLE_CHANGE"].map(t=><option key={t}>{t}</option>)}
                  </select>
                  <select value={spForm.classEnrolled} onChange={e=>setSpForm(f=>({...f,classEnrolled:e.target.value}))}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
                    <option value="">All Classes</option>
                    {CLASSES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <input placeholder="Description (optional)" value={spForm.description} onChange={e=>setSpForm(f=>({...f,description:e.target.value}))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"/>
                <div className="flex gap-2">
                  <button onClick={addSpecial} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors">
                    <Save size={12}/>Save Event
                  </button>
                  <button onClick={()=>setShowSpForm(false)} className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs hover:bg-white transition-colors">Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {specials.length===0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar size={24} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">No special schedules yet. Click &quot;Add Event&quot; to create one.</p>
              </div>
            ) : specials.map(s=>(
              <motion.div key={s.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex flex-col items-center justify-center shrink-0 border border-emerald-100">
                  <p className="text-sm font-bold text-emerald-700 leading-none">{new Date(s.date).getDate()}</p>
                  <p className="text-[9px] text-emerald-500">{new Date(s.date).toLocaleDateString("en-IN",{month:"short"})}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{s.title}</p>
                  {s.description&&<p className="text-xs text-gray-500 truncate">{s.description}</p>}
                  <div className="flex gap-1.5 mt-0.5 flex-wrap">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[s.type]||"bg-gray-100 text-gray-600"}`}>{s.type}</span>
                    {s.classEnrolled&&<span className="text-[9px] text-gray-400">{s.classEnrolled}</span>}
                  </div>
                </div>
                <button onClick={()=>delSpecial(s.id)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                  <Trash2 size={12}/>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

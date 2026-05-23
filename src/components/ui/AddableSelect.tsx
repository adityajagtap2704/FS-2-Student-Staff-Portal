"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, X } from "lucide-react";

export interface SelectOption { value: string; label: string; sub?: string; }
interface AddField { key: string; placeholder: string; type?: string; }
interface Props {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder: string;
  onAdd?: (data: Record<string, string>) => Promise<void>;
  addFields?: AddField[];
  addLabel?: string;
  colorDot?: Record<string, string>;
}

export default function AddableSelect({ value, onChange, options, placeholder, onAdd, addFields, addLabel = "+ Add New", colorDot }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const dropH = 320; // estimated max dropdown height
    const openUp = spaceBelow < dropH && r.top > dropH;
    setPos({
      top: openUp ? r.top + window.scrollY - dropH - 4 : r.bottom + window.scrollY + 4,
      left: r.left + window.scrollX,
      width: Math.max(r.width, 240),
    });
  };

  const openDropdown = () => { calcPos(); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const update = () => calcPos();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => { setOpen(false); setQuery(""); setShowAdd(false); setAddData({}); setAddError(""); };

  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sub || "").toLowerCase().includes(query.toLowerCase())
  );

  const handleAdd = async () => {
    if (!onAdd) return;
    setAdding(true); setAddError("");
    try { await onAdd(addData); close(); }
    catch (e: any) { setAddError(e.message || "Failed to save"); }
    setAdding(false);
  };

  const dropdown = (
    <AnimatePresence>
      {open && (
        <>
          {/* Full-screen backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={close} />

          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            style={{ position: "absolute", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 bg-gray-50 border-b border-gray-100">
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            {/* List */}
            <div className="max-h-48 overflow-y-auto">
              {/* Clear option */}
              <div onClick={() => { onChange(""); close(); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors">
                <X size={10} />{placeholder}
              </div>

              {filtered.length === 0 && (
                <div className="px-3 py-4 text-xs text-gray-400 text-center">No results for &quot;{query}&quot;</div>
              )}

              {filtered.map(o => (
                <div key={o.value}
                  onClick={() => { onChange(o.value); close(); }}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-emerald-50 transition-colors ${o.value === value ? "bg-emerald-50" : ""}`}>
                  {colorDot?.[o.value] && (
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: colorDot[o.value] }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`truncate font-medium ${o.value === value ? "text-emerald-700" : "text-gray-700"}`}>{o.label}</p>
                    {o.sub && <p className="text-[10px] text-gray-400 truncate">{o.sub}</p>}
                  </div>
                  {o.value === value && <Check size={11} className="text-emerald-500 shrink-0" />}
                </div>
              ))}
            </div>

            {/* Add section */}
            {onAdd && addFields && (
              <div className="border-t border-gray-100">
                {!showAdd ? (
                  <button onClick={() => setShowAdd(true)}
                    className="flex items-center gap-1.5 w-full px-3 py-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors">
                    <Plus size={12} className="shrink-0" />{addLabel}
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 space-y-2">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">{addLabel}</p>
                    {addFields.map(f => (
                      <input key={f.key} type={f.type || "text"} placeholder={f.placeholder}
                        value={addData[f.key] || ""}
                        onChange={e => setAddData(d => ({ ...d, [f.key]: e.target.value }))}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    ))}
                    {addError && <p className="text-[10px] text-red-500 font-medium">{addError}</p>}
                    <div className="flex gap-1.5">
                      <button onClick={handleAdd} disabled={adding}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 disabled:opacity-60 transition-colors">
                        <Check size={10} />{adding ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => { setShowAdd(false); setAddData({}); setAddError(""); }}
                        className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative">
      {/* Trigger button */}
      <button ref={triggerRef} type="button" onClick={openDropdown}
        className={`flex items-center justify-between gap-2 px-3 py-2 text-sm border rounded-xl bg-white hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 w-full min-w-[170px] transition-colors ${open ? "border-emerald-400 ring-2 ring-emerald-300" : "border-gray-200"}`}>
        <span className="flex items-center gap-1.5 truncate min-w-0">
          {selected && colorDot?.[selected.value] && (
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colorDot[selected.value] }} />
          )}
          <span className={`truncate text-sm ${selected ? "text-gray-800 font-medium" : "text-gray-400"}`}>
            {selected?.label || placeholder}
          </span>
        </span>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}
          className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Portal dropdown */}
      {mounted && createPortal(dropdown, document.body)}
    </div>
  );
}

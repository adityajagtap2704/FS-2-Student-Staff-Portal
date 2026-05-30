"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, Filter, Plus, FileText, Download,
  Eye, Edit2, Trash2, X, UploadCloud, Check, HelpCircle,
  FileDown, Monitor, RefreshCw, ChevronRight, User, AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { easeOut, staggerContainer, staggerItem } from "@/components/motion/MotionConfig";

interface Note {
  id: number;
  title: string;
  subject: string;
  section: string;
  semester: string;
  teacherName: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  downloadCount: number;
  staffId: number | null;
}

interface NotesClientProps {
  initialNotes: Note[];
  role: string;
  userId: string;
  userName: string;
  subjects: { name: string; code: string }[];
  semesters: string[];
}

export default function NotesClient({
  initialNotes,
  role,
  userId,
  userName,
  subjects,
  semesters
}: NotesClientProps) {
  const toast = useToast();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [mineOnly, setMineOnly] = useState(false);

  // Uploader & Editor states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [isOtherSubject, setIsOtherSubject] = useState(false);
  const [formOtherSubject, setFormOtherSubject] = useState("");
  const [formSemester, setFormSemester] = useState("");
  const [isOtherSemester, setIsOtherSemester] = useState(false);
  const [formOtherSemester, setFormOtherSemester] = useState("");
  const [formSection, setFormSection] = useState("All");
  const [formDescription, setFormDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview Modal States
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    previewUrl: string;
    googleViewerUrl: string | null;
    fileName: string;
    fileType: string;
  } | null>(null);

  const canManage = role === "CLASS_TEACHER";

  // Dynamic fetcher
  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedSubject !== "All") params.append("subject", selectedSubject);
      if (selectedSemester !== "All") params.append("semester", selectedSemester);
      if (mineOnly && canManage) params.append("mine", "true");

      const res = await fetch(`/api/notes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      } else {
        toast.error("Failed to load notes", "An error occurred while fetching files.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading notes", "Connection refused.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedSubject, selectedSemester, mineOnly, canManage, toast]);

  // Debounced/Triggered fetch on filter updates
  useEffect(() => {
    const handler = setTimeout(() => {
      loadNotes();
    }, 300);
    return () => clearTimeout(handler);
  }, [search, selectedSubject, selectedSemester, mineOnly, loadNotes]);

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedExtensions = ["pdf", "ppt", "pptx", "doc", "docx", "png", "jpg", "jpeg", "webp"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      toast.error(
        "Invalid file format",
        "Only PDF, PPT, PPTX, DOC, DOCX, and images (JPG/PNG/WEBP) are accepted."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", "Maximum file size supported is 10MB.");
      return;
    }

    setSelectedFile(file);
    toast.success("File added", `${file.name} is ready for upload.`);
  };

  // Open modal for new upload
  const openUploadModal = () => {
    setEditingNote(null);
    setFormTitle("");
    setFormSubject(subjects[0]?.name || "");
    setIsOtherSubject(false);
    setFormOtherSubject("");
    setFormSemester(semesters[0] || "All");
    setIsOtherSemester(false);
    setFormOtherSemester("");
    setFormSection("All");
    setFormDescription("");
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  // Open modal for editing existing notes
  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    
    // Set subject states
    const foundSubject = subjects.find(s => s.name === note.subject);
    if (foundSubject) {
      setFormSubject(note.subject);
      setIsOtherSubject(false);
    } else {
      setFormSubject("Other");
      setIsOtherSubject(true);
      setFormOtherSubject(note.subject);
    }

    // Set semester states
    const foundSemester = semesters.find(s => s === note.semester);
    if (foundSemester || note.semester === "All") {
      setFormSemester(note.semester);
      setIsOtherSemester(false);
    } else {
      setFormSemester("Other");
      setIsOtherSemester(true);
      setFormOtherSemester(note.semester);
    }

    setFormSection(note.section);
    setFormDescription(note.description || "");
    setSelectedFile(null); // File replacement is optional in edit
    setShowUploadModal(true);
  };

  // Create or Update Note API Caller
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalSubject = isOtherSubject ? formOtherSubject.trim() : formSubject;
    const finalSemester = isOtherSemester ? formOtherSemester.trim() : formSemester;

    if (!formTitle.trim()) {
      toast.error("Validation Error", "Title is required.");
      return;
    }
    if (!finalSubject) {
      toast.error("Validation Error", "Subject is required.");
      return;
    }
    if (!editingNote && !selectedFile) {
      toast.error("Validation Error", "Please select a study material file to upload.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("title", formTitle);
      formData.append("subject", finalSubject);
      formData.append("semester", finalSemester);
      formData.append("section", formSection);
      formData.append("description", formDescription);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const url = editingNote ? `/api/notes/${editingNote.id}` : "/api/notes";
      const method = editingNote ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(
          editingNote ? "Material updated" : "Material published!",
          editingNote
            ? "Your study note edits have been saved."
            : "Notes uploaded successfully! Target students have been notified."
        );
        setShowUploadModal(false);
        loadNotes();
      } else {
        toast.error("Operation failed", result.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Check your local connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Note API Caller
  const handleDelete = async (noteId: number, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the notes: "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Material deleted", "The notes file has been deleted from both S3 and the database.");
        setNotes(prev => prev.filter(n => n.id !== noteId));
      } else {
        const data = await res.json();
        toast.error("Failed to delete", data.error || "An error occurred.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete Error", "Connection refused.");
    }
  };

  // Preview Document Handler
  const handlePreview = async (note: Note) => {
    setPreviewNote(note);
    setPreviewLoading(true);
    setPreviewData(null);
    
    try {
      const res = await fetch(`/api/notes/${note.id}/preview`);
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
      } else {
        toast.error("Preview failed", "Could not generate secure view credentials.");
        setPreviewNote(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network Error", "Could not load preview.");
      setPreviewNote(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Download Document Handler
  const handleDownload = async (noteId: number, fileName: string) => {
    try {
      const res = await fetch(`/api/notes/${noteId}/download`);
      if (res.ok) {
        const data = await res.json();
        
        // Dynamically increment down count in current list
        setNotes(prev => prev.map(n => n.id === noteId ? { ...n, downloadCount: data.downloadCount } : n));
        
        // Securely trigger local browser download
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Download started", `Downloading "${fileName}"`);
      } else {
        toast.error("Download failed", "Failed to retrieve secure download link.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", "Check your local connection.");
    }
  };

  // Helper to get beautiful, harmonious file type icons & colors
  const getFileStyle = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") {
      return {
        icon: FileText,
        color: "text-rose-500",
        bg: "bg-rose-50 border-rose-100/50",
        badge: "rose" as const,
        label: "PDF Document"
      };
    } else if (["doc", "docx"].includes(ext)) {
      return {
        icon: FileText,
        color: "text-blue-500",
        bg: "bg-blue-50 border-blue-100/50",
        badge: "info" as const,
        label: "Word Document"
      };
    } else if (["ppt", "pptx"].includes(ext)) {
      return {
        icon: FileText,
        color: "text-amber-500",
        bg: "bg-amber-50 border-amber-100/50",
        badge: "warning" as const,
        label: "Powerpoint"
      };
    } else if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
      return {
        icon: FileText,
        color: "text-emerald-500",
        bg: "bg-emerald-50 border-emerald-100/50",
        badge: "success" as const,
        label: "Image Asset"
      };
    }
    return {
      icon: BookOpen,
      color: "text-purple-500",
      bg: "bg-purple-50 border-purple-100/50",
      badge: "purple" as const,
      label: "Study Material"
    };
  };

  const getFormSubjectOptions = () => {
    const options = subjects.map(s => s.name);
    if (!options.includes("Other")) {
      options.push("Other");
    }
    return options;
  };

  const getFormSemesterOptions = () => {
    const options = ["All", ...semesters];
    if (!options.includes("Other")) {
      options.push("Other");
    }
    return options;
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER & SEARCH FILTER BAR ─────────────────────────────────────── */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md border border-gray-100/50 rounded-3xl p-5 shadow-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeOut}
      >
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by note title, description, or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-2xl">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#444] focus:outline-none cursor-pointer pr-1"
            >
              <option value="All">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.name} value={sub.name}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          {role !== "STUDENT" && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-2xl">
              <BookOpen size={14} className="text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#444] focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Semesters</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle Creator Notes (Teachers Only) */}
          {canManage && (
            <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-50 border border-gray-100 px-4 py-2 rounded-2xl hover:bg-gray-100/50 transition-colors">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => setMineOnly(e.target.checked)}
                className="h-3.5 w-3.5 text-primary border-gray-300 rounded focus:ring-primary/20 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-500">My Uploads</span>
            </label>
          )}

          {/* Upload Button */}
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={openUploadModal}
              className="h-10 rounded-2xl"
            >
              Upload Notes
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── NOTES MAIN CARD GRID ───────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
              <div className="border-t border-gray-50 pt-4 flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-white/70 backdrop-blur-md rounded-3xl border border-gray-100 shadow-card"
        >
          <div className="h-16 w-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-primary-600 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-gray-500">No notes found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {search || selectedSubject !== "All" || selectedSemester !== "All" || mineOnly
              ? "We couldn't find any study materials matching your current filters. Try relaxing your filters."
              : "No study materials or notes have been published in this section yet."}
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {notes.map((note) => {
            const style = getFileStyle(note.fileName);
            const FileIcon = style.icon;
            const isOwner = note.staffId === parseInt(userId);
            
            return (
              <motion.div
                key={note.id}
                variants={staggerItem}
                className="group bg-white/80 hover:bg-white backdrop-blur-sm border border-gray-100/80 hover:border-primary-100 hover:shadow-glow rounded-3xl p-5 relative overflow-hidden transition-all duration-300 shadow-card flex flex-col justify-between"
                whileHover={{ y: -3 }}
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex justify-between items-start gap-2 mb-3.5">
                    <div className={`h-11 w-11 rounded-2xl ${style.bg} border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform`}>
                      <FileIcon size={20} className={style.color} />
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      <Badge variant={style.badge} size="sm">{note.subject}</Badge>
                      {note.semester && note.semester !== "All" && (
                        <Badge variant="neutral" size="sm">{note.semester}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-sm font-bold text-[#444] leading-snug tracking-tight truncate group-hover:text-primary transition-colors mb-1.5" title={note.title}>
                    {note.title}
                  </h3>
                  
                  {note.description ? (
                    <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-3">
                      {note.description}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-300 italic leading-relaxed mb-4">
                      No additional description provided.
                    </p>
                  )}
                </div>

                {/* Footer Metadata */}
                <div>
                  <div className="flex items-center gap-1.5 mb-4 text-[10px] text-gray-400/80 font-medium">
                    <User size={12} className="text-gray-300" />
                    <span>Uploaded by: <b className="text-gray-500">{note.teacherName}</b></span>
                  </div>

                  <div className="border-t border-gray-100/60 pt-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold">
                      <FileDown size={13} className="text-primary-500 shrink-0" />
                      <span>{note.downloadCount} downloads</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Manage (Edit/Delete) Buttons for Teacher/Creator */}
                      {(role === "CLASS_TEACHER" && isOwner) && (
                        <>
                          <button
                            onClick={() => openEditModal(note)}
                            className="p-2 bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-100 text-gray-400 hover:text-primary rounded-xl transition-all"
                            title="Edit note details"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id, note.title)}
                            className="p-2 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-100 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                            title="Delete note"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}

                      {/* Action buttons */}
                      <button
                        onClick={() => handlePreview(note)}
                        className="p-2 bg-primary-50 hover:bg-primary border border-primary-100 hover:border-primary text-primary hover:text-white rounded-xl transition-all"
                        title="Instant Preview"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => handleDownload(note.id, note.fileName)}
                        className="p-2 bg-emerald-50 hover:bg-emerald-500 border border-emerald-100 hover:border-emerald-500 text-emerald-600 hover:text-white rounded-xl transition-all"
                        title="Download file"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── UPLOAD / EDIT NOTE MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowUploadModal(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={easeOut}
              className="bg-white rounded-3xl border border-gray-100 shadow-glow p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto relative z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <div>
                  <h2 className="text-lg font-bold text-[#444]">
                    {editingNote ? "Edit Study Material" : "Publish New Notes"}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {editingNote ? "Update the document and descriptive details" : "Upload documents for student distribution"}
                  </p>
                </div>
                <button
                  onClick={() => !isSubmitting && setShowUploadModal(false)}
                  disabled={isSubmitting}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                {/* Form Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#444] block">Note Title *</label>
                  <Input
                    placeholder="E.g., Unit 1 - Introduction to DBMS"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Form Subject */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#444] block">Subject *</label>
                    <select
                      value={formSubject}
                      onChange={(e) => {
                        setFormSubject(e.target.value);
                        setIsOtherSubject(e.target.value === "Other");
                      }}
                      className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {getFormSubjectOptions().map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#444] block">Semester / Class *</label>
                    <select
                      value={formSemester}
                      onChange={(e) => {
                        setFormSemester(e.target.value);
                        setIsOtherSemester(e.target.value === "Other");
                      }}
                      className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {getFormSemesterOptions().map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Subjects/Semesters If "Other" is Selected */}
                {(isOtherSubject || isOtherSemester) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-primary-50/20 p-3.5 border border-primary-50 rounded-2xl">
                    {isOtherSubject && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-primary-700 block">Custom Subject Name *</label>
                        <Input
                          placeholder="Type subject name..."
                          value={formOtherSubject}
                          onChange={(e) => setFormOtherSubject(e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    {isOtherSemester && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-primary-700 block">Custom Class / Semester *</label>
                        <Input
                          placeholder="Type class name (e.g. BCA, MCA)..."
                          value={formOtherSemester}
                          onChange={(e) => setFormOtherSemester(e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Section & Description */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-xs font-bold text-[#444] block">Section</label>
                    <select
                      value={formSection}
                      onChange={(e) => setFormSection(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-sm focus:outline-none pr-1"
                      disabled={isSubmitting}
                    >
                      <option value="All">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-[#444] block">Brief Description (Optional)</label>
                    <textarea
                      placeholder="Add brief details about the notes contents, unit range, reference books..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[42px] max-h-[120px] transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* File Dropzone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#444] block">
                    Upload Study File * {editingNote && <span className="font-medium text-gray-400">(Leave empty to keep existing file)</span>}
                  </label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-3xl p-5 text-center cursor-pointer transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]
                      ${dragActive ? "border-primary bg-primary-50/10 shadow-glow" : "border-gray-200 hover:border-primary-100 bg-gray-50/30"}
                      ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <input
                      type="file"
                      id="notes-uploader-input"
                      onChange={handleFileChange}
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    
                    <label htmlFor="notes-uploader-input" className="absolute inset-0 cursor-pointer" />

                    {!selectedFile ? (
                      <div className="space-y-2 pointer-events-none relative z-10 flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
                          <UploadCloud size={20} className="text-primary-600 animate-bounce" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500">Drag & drop files here, or <span className="text-primary hover:underline">browse</span></p>
                          <p className="text-[10px] text-gray-400 mt-1">Supports PDF, PPT, DOC, DOCX, and images (Max 10MB)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pointer-events-none relative z-10 flex flex-col items-center w-full px-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                          <Check size={20} />
                        </div>
                        <div className="w-full">
                          <p className="text-xs font-bold text-gray-600 truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-50">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    disabled={isSubmitting}
                    className="rounded-2xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="rounded-2xl min-w-[120px]"
                  >
                    {editingNote ? "Save Changes" : "Publish Notes"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VIEW / PREVIEW NOTE MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {previewNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewNote(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />

            {/* Preview Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={easeOut}
              className="bg-white rounded-3xl border border-gray-100 shadow-glow p-6 w-full max-w-4xl max-h-[92vh] overflow-hidden relative z-10 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${getFileStyle(previewNote.fileName).bg} border flex items-center justify-center shrink-0`}>
                    <FileText size={18} className={getFileStyle(previewNote.fileName).color} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#444] leading-snug line-clamp-1">{previewNote.title}</h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Subject: {previewNote.subject} • Class: {previewNote.semester}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewNote.id, previewNote.fileName)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-500 border border-emerald-100 hover:border-emerald-500 text-emerald-600 hover:text-white rounded-xl transition-all"
                    title="Download Note File"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewNote(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="flex-1 overflow-y-auto py-5 min-h-[400px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100/50 mt-4 relative">
                {previewLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw size={24} className="text-primary animate-spin" />
                    <p className="text-xs text-gray-400 font-semibold animate-pulse">Requesting secure S3 access URL...</p>
                  </div>
                ) : previewData ? (
                  <>
                    {/* Render Image previews natively */}
                    {["png", "jpg", "jpeg", "webp"].includes(previewData.fileType) && (
                      <div className="max-w-full max-h-full p-2 flex items-center justify-center">
                        <img
                          src={previewData.previewUrl}
                          alt={previewNote.title}
                          className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-soft"
                        />
                      </div>
                    )}

                    {/* Render PDF previews natively in iframe */}
                    {previewData.fileType === "pdf" && (
                      <iframe
                        src={previewData.previewUrl}
                        title={previewNote.title}
                        className="w-full h-[62vh] rounded-xl border-0 bg-white"
                      />
                    )}

                    {/* Render Word/PPT previews via secure Google doc viewer frame */}
                    {previewData.googleViewerUrl && (
                      <iframe
                        src={previewData.googleViewerUrl}
                        title={previewNote.title}
                        className="w-full h-[62vh] rounded-xl border-0 bg-white shadow-inner"
                      />
                    )}

                    {/* Fallback preview instructions */}
                    {!["pdf", "png", "jpg", "jpeg", "webp"].includes(previewData.fileType) && !previewData.googleViewerUrl && (
                      <div className="text-center p-6 max-w-sm space-y-4">
                        <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-500">
                          <AlertCircle size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500">No browser preview available</p>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                            Preview is not directly supported by browser for file type: <b>.{previewData.fileType}</b>. You can download the file to view it on your device.
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Download size={14} />}
                          onClick={() => handleDownload(previewNote.id, previewNote.fileName)}
                          className="rounded-2xl"
                        >
                          Download Now
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-6 text-gray-400 space-y-2">
                    <HelpCircle size={24} className="mx-auto" />
                    <p className="text-xs">Failed to load preview details.</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {previewNote && previewNote.description && (
                <div className="mt-4 p-3 bg-gray-50/50 border border-gray-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Note Details</span>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{previewNote.description}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

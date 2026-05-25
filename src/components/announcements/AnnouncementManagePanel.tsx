"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Plus, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { easeOut } from "@/components/motion/MotionConfig";
import {
  allowedTargetsForRole,
  TARGET_LABELS,
  targetBadgeLabel,
  type AnnouncementTargetValue,
} from "@/lib/announcements";
import { sortByDesc } from "@/lib/sortOrder";

const CATEGORIES = ["Events", "Exams", "Holidays", "General"] as const;

export interface AnnouncementItem {
  id: number;
  title: string;
  category: string;
  target: string | null;
  description: string;
  author: string;
  date: string | Date;
  imageUrl: string | null;
}

interface Props {
  role: string;
  userName: string;
  initialAnnouncements: AnnouncementItem[];
}

const defaultForm = (author: string) => ({
  title: "",
  category: "General" as string,
  target: "STUDENT" as AnnouncementTargetValue,
  description: "",
  author,
  date: new Date().toISOString().split("T")[0],
  imageUrl: "",
});

export default function AnnouncementManagePanel({
  role,
  userName,
  initialAnnouncements,
}: Props) {
  const toast = useToast();
  const targetOptions = allowedTargetsForRole(role);

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() =>
    sortByDesc(initialAnnouncements, (a) => a.date)
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => defaultForm(userName));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm(userName));
    setErrors({});
  };

  const openEdit = (ann: AnnouncementItem) => {
    setEditingId(ann.id);
    setForm({
      title: ann.title,
      category: ann.category,
      target: (ann.target ?? "STUDENT") as AnnouncementTargetValue,
      description: ann.description,
      author: ann.author,
      date: new Date(ann.date).toISOString().split("T")[0],
      imageUrl: ann.imageUrl ?? "",
    });
    setShowForm(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.author.trim()) e.author = "Author is required";
    if (!form.date) e.date = "Date is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const url = editingId ? `/api/announcements/${editingId}` : "/api/announcements";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (res.ok) {
      const saved = await res.json();
      const merge = (prev: AnnouncementItem[]) =>
        sortByDesc(
          editingId ? prev.map((a) => (a.id === editingId ? saved : a)) : [saved, ...prev],
          (a) => a.date
        );
      setAnnouncements(merge);
      toast.success(
        editingId ? "Announcement updated" : "Announcement published",
        targetBadgeLabel(saved.target)
      );
      resetForm();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error("Failed", data.error ?? "Please try again.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this announcement? It will be removed for the selected audience.")) return;
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Deleted", "Announcement removed.");
      if (editingId === id) resetForm();
    } else {
      toast.error("Failed to delete", "Please try again.");
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#444]">Manage Announcements</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Choose who receives each notice: students or teaching staff only.
          </p>
        </div>
        <Button
          icon={showForm ? <X size={14} /> : <Plus size={14} />}
          variant={showForm ? "outline" : "primary"}
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
        >
          {showForm ? "Cancel" : "New Announcement"}
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={easeOut}>
          <Card
            title={editingId ? "Edit Announcement" : "Create Announcement"}
            subtitle="Only the selected audience will see this notice"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Title *"
                  placeholder="Announcement title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  error={errors.title}
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#444]">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#444] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Author *"
                  placeholder="e.g. Admin Office"
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  error={errors.author}
                />
                <Input
                  label="Date *"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  error={errors.date}
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#444]">Audience *</label>
                  <select
                    value={form.target}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, target: e.target.value as AnnouncementTargetValue }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#444] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {targetOptions.map((t) => (
                      <option key={t} value={t}>
                        {TARGET_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400">
                    {form.target === "STUDENT" && "Visible to students only."}
                    {form.target === "STAFF" && "Visible to class teachers only."}
                    {form.target === "BOTH" && "Visible to students and class teachers."}
                  </p>
                </div>
              </div>

              <Textarea
                label="Description *"
                placeholder="Write the announcement content..."
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                error={errors.description}
              />

              <Input
                label="Image URL (optional)"
                placeholder="https://..."
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading} icon={<Megaphone size={14} />}>
                  {editingId ? "Save Changes" : "Publish"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      <Card title="Your Announcements" subtitle={`${announcements.length} total`} noPadding>
        {announcements.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No announcements yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary">
                      {ann.category}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        ann.target === "STUDENT"
                          ? "bg-emerald-50 text-emerald-700"
                          : ann.target === "STAFF"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {targetBadgeLabel(ann.target)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#444] truncate">{ann.title}</p>
                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{ann.description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="xs" variant="outline" onClick={() => openEdit(ann)}>
                    Edit
                  </Button>
                  <Button size="xs" variant="danger" onClick={() => handleDelete(ann.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

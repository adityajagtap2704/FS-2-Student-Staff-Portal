"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, Briefcase, Edit3, User, X, Save } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { staggerContainer, staggerItem, easeOut } from "@/components/motion/MotionConfig";
import { useToast } from "@/components/ui/Toast";

interface Props {
  staff: any;
}

export default function StaffProfileClient({ staff: initialStaff }: Props) {
  const toast = useToast();
  const [staff, setStaff] = useState(initialStaff);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: staff.phone || "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initials = staff.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "HOD":
        return "Head of Department";
      case "CLASS_TEACHER":
        return "Class Teacher";
      case "NON_TEACHING_STAFF":
        return "Non-Teaching Staff";
      default:
        return role;
    }
  };

  const details = [
    { icon: Briefcase, label: "Role", value: getRoleLabel(staff.role), editable: false },
    { icon: Mail, label: "Email", value: staff.email, editable: false },
    { icon: Phone, label: "Contact", value: staff.phone || "Not provided", editable: true, field: "phone" },
  ];

  if (staff.assignedClass) {
    details.splice(1, 0, { icon: User, label: "Assigned Class", value: staff.assignedClass, editable: false });
  }

  const stats = [
    { label: "Status", value: staff.isActive ? "Active" : "Inactive", color: staff.isActive ? "text-emerald-600" : "text-red-600", bg: staff.isActive ? "bg-emerald-50" : "bg-red-50" },
    { label: "Account Type", value: getRoleLabel(staff.role), color: "text-primary", bg: "bg-primary-50" },
  ];

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) {
      e.phone = "Must be 10 digits";
    }
    return e;
  };

  const handleSave = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);

    const res = await fetch("/api/staff/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setStaff((prev: any) => ({ ...prev, phone: updated.phone }));
      setEditing(false);
      toast.success("Profile updated", "Your changes have been saved.");
    } else {
      toast.error("Update failed", "Please try again.");
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeOut}
      >
        <div>
          <h1 className="text-2xl font-bold text-[#444] tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-gray-400">Your professional information.</p>
        </div>
        <Button
          variant={editing ? "danger" : "outline"}
          size="sm"
          icon={editing ? <X size={14} /> : <Edit3 size={14} />}
          onClick={() => {
            setEditing(!editing);
            setErrors({});
            setForm({ phone: staff.phone || "" });
          }}
        >
          {editing ? "Cancel" : "Edit Profile"}
        </Button>
      </motion.div>

      {/* Profile hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...easeOut, delay: 0.05 }}
        className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-card p-6"
      >
        <div className="absolute inset-0 bg-gradient-subtle opacity-40" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold shadow-glow-lg select-none">
              {initials}
            </div>
            {staff.isActive && (
              <motion.div
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="h-2 w-2 rounded-full bg-white" />
              </motion.div>
            )}
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-[#444]">{staff.name}</h2>
              <Badge variant={staff.isActive ? "success" : "neutral"} dot>
                {staff.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
              <Mail size={13} />
              <span>{staff.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {[getRoleLabel(staff.role), staff.assignedClass && `Class: ${staff.assignedClass}`]
                .filter(Boolean)
                .map((tag) => (
                  <motion.span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium"
                    whileHover={{ scale: 1.03, backgroundColor: "#e8f8f3", color: "#1D9E75" }}
                    transition={{ duration: 0.15 }}
                  >
                    {tag}
                  </motion.span>
                ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Details */}
      <Card
        title="Professional Details"
        subtitle="Your staff information"
        delay={0.1}
        action={
          editing ? (
            <Button size="sm" icon={<Save size={14} />} loading={saving} onClick={handleSave}>
              Save Changes
            </Button>
          ) : undefined
        }
      >
        <motion.dl
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {details.map(({ icon: Icon, label, value, editable, field }) => (
            <motion.div
              key={label}
              variants={staggerItem}
              transition={{ ...easeOut }}
              whileHover={{ backgroundColor: "rgba(249,250,251,1)", x: 2 }}
              className="flex items-start gap-3 p-3 rounded-xl transition-colors group cursor-default"
            >
              <motion.div
                className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"
                whileHover={{ backgroundColor: "#e8f8f3", scale: 1.05 }}
                transition={{ duration: 0.15 }}
              >
                <Icon size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <dt className="text-xs text-gray-400 font-medium">{label}</dt>
                {editing && editable && field ? (
                  <div className="mt-1">
                    <input
                      value={form[field as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-sm text-[#444] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                        errors[field] ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                    {errors[field] && <p className="text-[10px] text-red-500 mt-0.5">{errors[field]}</p>}
                  </div>
                ) : (
                  <dd className="mt-0.5 text-sm font-medium text-[#444]">{value}</dd>
                )}
              </div>
            </motion.div>
          ))}
        </motion.dl>
      </Card>

      {/* Status summary */}
      <Card title="Account Status" subtitle="Current account information" delay={0.2}>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {stats.map(({ label, value, color, bg }, i) => (
            <motion.div
              key={label}
              variants={staggerItem}
              transition={{ ...easeOut, delay: i * 0.05 }}
              whileHover={{ y: -2, scale: 1.02 }}
              className={`${bg} rounded-xl p-4 text-center cursor-default`}
            >
              <motion.p
                className={`text-lg font-bold ${color}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 + i * 0.05 }}
              >
                {value}
              </motion.p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </Card>
    </div>
  );
}

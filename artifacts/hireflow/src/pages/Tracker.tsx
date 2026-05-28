import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Briefcase, Loader2, Edit2,
  Trash2, Calendar as CalendarIcon, Clock, Send
} from "lucide-react";
import {
  useListApplications, useCreateApplication, useUpdateApplication,
  useDeleteApplication, getListApplicationsQueryKey,
  getGetDashboardStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUSES = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected"] as const;
type Status = typeof STATUSES[number];

const STATUS_STYLES: Record<Status, { bg: string; text: string; border: string }> = {
  Wishlist:     { bg: "bg-indigo-500/10",  text: "text-indigo-300",  border: "border-indigo-500/30" },
  Applied:      { bg: "bg-cyan-500/10",    text: "text-cyan-300",    border: "border-cyan-500/30" },
  Interviewing: { bg: "bg-amber-500/10",   text: "text-amber-300",   border: "border-amber-500/30" },
  Offer:        { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/30" },
  Rejected:     { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/30" },
};

interface AppForm {
  company: string; role: string; location: string; workType: string; status: string;
  salaryMin: string; salaryMax: string; matchScore: string; jobUrl: string; notes: string;
  appliedDate: string; interviewDate: string; offerDeadline: string;
}

const emptyForm: AppForm = {
  company: "", role: "", location: "", workType: "Remote",
  status: "Wishlist", salaryMin: "", salaryMax: "", matchScore: "", jobUrl: "", notes: "",
  appliedDate: "", interviewDate: "", offerDeadline: "",
};

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

/** 
 * Contextual Logic: 
 * - Applied: Always shows the exact date.
 * - Interview/Offer: Shows relative "IN X DAYS" for future, Today/Tomorrow for now.
 */
function getHumanDateLabel(daysLeft: number | null, originalDate: string, status: Status) {
  if (daysLeft === null) return "SET DATE";
  
  // History columns just show the date
  if (status === "Applied") return formatDate(originalDate);

  // Future-focused columns show relative time
  if (daysLeft === 0) return "TODAY";
  if (daysLeft === 1) return "TOMORROW";
  if (daysLeft > 1) return `IN ${daysLeft} DAYS`;
  
  // Revert to date if it's past
  return formatDate(originalDate);
}

export default function Tracker() {
  const qc = useQueryClient();
  const { data: rawApps = [], isLoading } = useListApplications();
  const createApp = useCreateApplication();
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AppForm>(emptyForm);
  const [editingApp, setEditingApp] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AppForm>(emptyForm);
  const [evictedIds, setEvictedIds] = useState<number[]>([]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
  };

  const apps = useMemo(() => {
    return (rawApps || []).filter((app) => app && app.id && !evictedIds.includes(app.id));
  }, [rawApps, evictedIds]);

  const appsByStatus = (status: Status) => {
    const filtered = apps.filter((a) => a.status === status);
    if (status === "Wishlist" || status === "Rejected") return filtered;

    return filtered.sort((a: any, b: any) => {
      const dateA = status === "Applied" ? a.appliedDate : status === "Interviewing" ? a.interviewDate : a.offerDeadline;
      const dateB = status === "Applied" ? b.appliedDate : status === "Interviewing" ? b.interviewDate : b.offerDeadline;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  };

  const openEdit = (id: number) => {
    const app = apps.find((a) => a.id === id) as any;
    if (!app) return;
    setEditForm({
      company: app.company ?? "",
      role: app.role ?? "",
      location: app.location ?? "",
      workType: app.workType ?? "Remote",
      status: app.status ?? "Wishlist",
      salaryMin: app.salaryMin?.toString() ?? "",
      salaryMax: app.salaryMax?.toString() ?? "",
      matchScore: app.matchScore?.toString() ?? "",
      jobUrl: app.jobUrl ?? "",
      notes: app.notes ?? "",
      appliedDate: app.appliedDate ?? "",
      interviewDate: app.interviewDate ?? "",
      offerDeadline: app.offerDeadline ?? "",
    });
    setEditingApp(id);
  };

  const handleCreate = async () => {
    if (!form.company || !form.role) {
      toast.error("Company and Role are required");
      return;
    }
    createApp.mutate({
      data: {
        ...form,
        salaryMin: form.salaryMin === "" ? null : parseInt(form.salaryMin),
        salaryMax: form.salaryMax === "" ? null : parseInt(form.salaryMax),
        matchScore: form.matchScore === "" ? null : parseInt(form.matchScore),
      } as any
    }, {
      onSuccess: () => {
        toast.success("Application added");
        setShowAdd(false);
        setForm(emptyForm);
        invalidate();
      },
      onError: () => toast.error("Failed to add application"),
    });
  };

  const handleUpdate = () => {
    if (!editingApp) return;
    updateApp.mutate({
      id: editingApp,
      data: {
        ...editForm,
        salaryMin: editForm.salaryMin === "" ? null : parseInt(editForm.salaryMin),
        salaryMax: editForm.salaryMax === "" ? null : parseInt(editForm.salaryMax),
        matchScore: editForm.matchScore === "" ? null : parseInt(editForm.matchScore),
      } as any
    }, {
      onSuccess: () => {
        toast.success("Updated successfully");
        setEditingApp(null);
        invalidate();
      },
      onError: () => toast.error("Failed to update"),
    });
  };

  const handleDelete = (id: number) => {
    setEvictedIds((prev) => [...prev, id]);
    deleteApp.mutate({ id }, {
      onSuccess: () => { toast.success("Deleted"); invalidate(); },
      onError: () => {
        setEvictedIds((prev) => prev.filter((x) => x !== id));
        toast.error("Failed to delete");
      },
    });
  };

  if (isLoading) return (
    <div className="p-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex gap-4">
        {STATUSES.map(s => <Skeleton key={s} className="flex-1 h-96 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="px-6 pb-6 h-full flex flex-col">
      <div className="flex items-center justify-end py-3">
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-primary text-primary-foreground h-8 text-xs font-semibold">
          <Plus size={14} /> Add Job
        </Button>
      </div>

      <div className="flex gap-3 flex-1 overflow-x-auto pb-2">
        {STATUSES.map((status) => {
          const colApps = appsByStatus(status);
          const style = STATUS_STYLES[status];
          return (
            <div key={status} className="flex-shrink-0 w-60 flex flex-col">
              <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-xl border-t border-x", style.border, style.bg)}>
                <span className={cn("text-xs font-semibold", style.text)}>{status}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-white/10">{colApps.length}</span>
              </div>

              <div className={cn("flex-1 rounded-b-xl border border-t-0 p-2 space-y-2 overflow-y-auto min-h-[200px] bg-card/40", style.border)}>
                <AnimatePresence>
                  {colApps.map((app: any) => {
                    const relevantDate = 
                      app.status === "Applied" ? app.appliedDate :
                      app.status === "Interviewing" ? app.interviewDate :
                      app.status === "Offer" ? app.offerDeadline : null;

                    const daysLeft = getDaysUntil(relevantDate);

                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => openEdit(app.id)}
                        className="glass-card rounded-lg p-3 cursor-pointer hover:border-white/20 transition-all group relative"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate text-foreground">{app.company}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{app.role}</p>
                          </div>
                          {app.matchScore != null && app.matchScore > 0 && (
                            <span className="text-[10px] font-bold text-primary shrink-0">{app.matchScore}%</span>
                          )}
                        </div>

                        {["Applied", "Interviewing", "Offer"].includes(app.status) && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[9px] text-zinc-600 uppercase tracking-wider font-mono">
                              {app.status === "Applied" ? "Applied on" : app.status === "Interviewing" ? "Interview" : "Deadline"}
                            </span>
                            
                            <div className={cn(
                              "text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border transition-none",
                              !relevantDate ? "text-primary/80 bg-primary/10 border-primary/20" :
                              daysLeft !== null && daysLeft < 0 ? "text-red-400 bg-red-500/10 border-red-500/20" :
                              daysLeft === 0 || daysLeft === 1 ? "text-orange-400 bg-orange-500/10 border-orange-500/20" :
                              "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                            )}>
                              {getHumanDateLabel(daysLeft, relevantDate, app.status)}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-red-400 p-0.5 rounded"
                        >
                          <Trash2 size={11} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {colApps.length === 0 && (
                  <div className="text-center pt-8 text-zinc-700 text-[10px] font-mono">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-white/10 sm:max-w-md">
          <DialogHeader><DialogTitle>Add Job Application</DialogTitle></DialogHeader>
          <AppFormFields form={form} onChange={(f) => setForm({ ...form, ...f })} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createApp.isPending}>
              {createApp.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Add Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingApp !== null} onOpenChange={(o) => !o && setEditingApp(null)}>
        <DialogContent className="bg-card border-white/10 sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Application</DialogTitle></DialogHeader>
          <AppFormFields form={editForm} onChange={(f) => setEditForm({ ...editForm, ...f })} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingApp(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateApp.isPending}>
              {updateApp.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AppFormFields({ form, onChange }: { form: AppForm; onChange: (f: Partial<AppForm>) => void }) {
  const status = form.status as Status;
  
  return (
    <div className="grid gap-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Company *</Label>
          <Input className="bg-black/20 border-white/10 h-9" value={form.company} onChange={e => onChange({ company: e.target.value })} placeholder="e.g. Google" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Role *</Label>
          <Input className="bg-black/20 border-white/10 h-9" value={form.role} onChange={e => onChange({ role: e.target.value })} placeholder="e.g. SWE II" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Location</Label>
          <Input className="bg-black/20 border-white/10 h-9" value={form.location} onChange={e => onChange({ location: e.target.value })} placeholder="San Francisco" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Work Type</Label>
          <Select value={form.workType} onValueChange={(v) => onChange({ workType: v })}>
            <SelectTrigger className="bg-black/20 border-white/10 h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              {["Remote", "Hybrid", "Onsite"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Status</Label>
        <Select value={form.status} onValueChange={(v) => onChange({ status: v })}>
          <SelectTrigger className="bg-black/20 border-white/10 h-9"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-white/10">
            {STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {status === "Applied" && (
        <div className="space-y-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
          <Label className="text-[11px] text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Send size={11} /> Application Sent Date
          </Label>
          <Input
            type="date"
            className="bg-black/20 border-white/10 h-9 [color-scheme:dark]"
            value={form.appliedDate}
            onChange={e => onChange({ appliedDate: e.target.value })}
          />
        </div>
      )}

      {status === "Interviewing" && (
        <div className="space-y-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <Label className="text-[11px] text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarIcon size={11} /> Interview Date & Time
          </Label>
          <Input
            type="datetime-local"
            className="bg-black/20 border-white/10 h-9 [color-scheme:dark]"
            value={form.interviewDate}
            onChange={e => onChange({ interviewDate: e.target.value })}
          />
        </div>
      )}

      {status === "Offer" && (
        <div className="space-y-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <Label className="text-[11px] text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={11} /> Acceptance Deadline
          </Label>
          <Input
            type="datetime-local"
            className="bg-black/20 border-white/10 h-9 [color-scheme:dark]"
            value={form.offerDeadline}
            onChange={e => onChange({ offerDeadline: e.target.value })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Min Salary</Label>
          <Input className="bg-black/20 border-white/10 h-9" type="number" value={form.salaryMin} onChange={e => onChange({ salaryMin: e.target.value })} placeholder="80000" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Match Score</Label>
          <Input className="bg-black/20 border-white/10 h-9" type="number" value={form.matchScore} onChange={e => onChange({ matchScore: e.target.value })} placeholder="0-100" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Job URL</Label>
        <Input className="bg-black/20 border-white/10 h-9" value={form.jobUrl} onChange={e => onChange({ jobUrl: e.target.value })} placeholder="https://..." />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">Notes</Label>
        <textarea
          className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-sm h-16 resize-none outline-none focus:border-primary/50 text-zinc-200"
          value={form.notes}
          onChange={e => onChange({ notes: e.target.value })}
          placeholder="Any notes about this application..."
        />
      </div>
    </div>
  );
}
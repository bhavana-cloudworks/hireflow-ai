import { useListApplications } from "@workspace/api-client-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import {
  Briefcase, Calendar, CheckCircle2, Plus, ArrowRight,
  Cpu, Bell, Clock, Timer, TrendingUp, BookOpen, Star,
  Brain, FileText, Target, Shield, Coffee, Search, Mic,
  Zap, ChevronLeft, ChevronRight, Sparkles, Activity,
  AlertTriangle, BarChart2, MessageSquare, Lightbulb
} from "lucide-react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDeadlineReminders } from "@/hooks/useDeadlineReminders";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysUntil(d: string | null | undefined): number | null {
  if (!d) return null;
  const t = new Date(d);
  if (isNaN(t.getTime())) return null;
  return Math.ceil((t.getTime() - Date.now()) / 86400000);
}
function getHoursUntil(d: string | null | undefined): number | null {
  if (!d) return null;
  const t = new Date(d);
  if (isNaN(t.getTime())) return null;
  return Math.ceil((t.getTime() - Date.now()) / 3600000);
}
function formatDate(d: string | null | undefined): string {
  if (!d) return "TBD";
  const t = new Date(d);
  if (isNaN(t.getTime())) return "TBD";
  return t.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}
function formatTime(d: string | null | undefined): string {
  if (!d) return "";
  const t = new Date(d);
  if (isNaN(t.getTime())) return "";
  return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getPrepTopics(role: string, company: string): string[] {
  const r = role.toLowerCase(), c = company.toLowerCase();
  if (r.includes("frontend") || r.includes("react")) return ["React rendering & reconciliation", "CSS layout & performance", "Accessibility & WCAG"];
  if (r.includes("backend") || r.includes("node")) return ["REST vs GraphQL design", "DB indexing & query optimization", "Auth & security patterns"];
  if (r.includes("fullstack")) return ["System design end-to-end", "API contract design", "State management patterns"];
  if (r.includes("devops") || r.includes("cloud")) return ["CI/CD pipeline design", "Container orchestration (K8s)", "Cost optimization strategies"];
  if (r.includes("data") || r.includes("ml")) return ["Model evaluation metrics", "Feature engineering patterns", "Data pipeline architecture"];
  if (r.includes("architect") || r.includes("staff")) return ["Distributed systems trade-offs", "High-scale system design", "Technical leadership"];
  if (c.includes("google")) return ["Algorithm optimization", "Large-scale system design", "Technical narratives"];
  if (c.includes("amazon")) return ["Leadership principles (STAR)", "Distributed systems at scale", "Customer obsession examples"];
  if (c.includes("meta")) return ["Data structures & graph theory", "Product sense & metrics", "Cross-functional collaboration"];
  if (c.includes("microsoft")) return ["Cloud architecture (Azure)", "Growth & impact narratives", "Collaborative engineering"];
  return ["Core data structures & algorithms", "System design fundamentals", "Behavioral STAR stories"];
}

function getInterviewChecklist(daysLeft: number): Array<{ icon: any; label: string }> {
  if (daysLeft <= 1) return [
    { icon: Mic,      label: "5-min voice warm-up — say your intro out loud" },
    { icon: Star,     label: "Review your top 3 STAR stories (situation → result)" },
    { icon: Clock,    label: "Confirm meeting link, dial-in, and time zone" },
    { icon: Coffee,   label: "Sleep well — performance drops 20% when tired" },
    { icon: Shield,   label: "Resume, notes, and water ready at your desk" },
  ];
  if (daysLeft <= 5) return [
    { icon: Brain,    label: "Run 2–3 mock answers for role-specific topics" },
    { icon: Search,   label: "Research the company's latest product launches & news" },
    { icon: Target,   label: "Map your experience to the job description bullets" },
    { icon: FileText, label: "Optimize your resume for this role's keywords" },
    { icon: Star,     label: "Prepare 2 sharp questions to ask the interviewer" },
  ];
  return [
    { icon: Search,   label: "Deep-dive the company's tech stack & architecture blog" },
    { icon: Brain,    label: "Study the top 5 high-yield topics for this role" },
    { icon: BookOpen, label: "Read the last 3 months of company announcements" },
    { icon: Target,   label: "Draft your value proposition narrative for this role" },
    { icon: Star,     label: "Build a reference sheet of key metrics & accomplishments" },
  ];
}

const OFFER_CHECKLIST = [
  { icon: TrendingUp,   label: "Salary meets or exceeds market rate for this role" },
  { icon: Star,         label: "Equity / vesting schedule is acceptable" },
  { icon: Shield,       label: "Remote / hybrid policy fits your lifestyle" },
  { icon: Target,       label: "Career growth path and promotion criteria are clear" },
  { icon: CheckCircle2, label: "Benefits, PTO, and health coverage are satisfactory" },
];

interface UpcomingEvent {
  id: number; eventKey: string; company: string; role: string;
  type: "interview" | "deadline"; date: string; daysLeft: number; hoursLeft: number | null;
}

// ─── AI Copilot Insight Engine ────────────────────────────────────────────────

interface CopilotInsight {
  id: string;
  signal: "critical" | "high" | "medium" | "positive";
  category: string;
  headline: string;
  reasoning: string;
  action: string;
  actionRoute?: string;
  metric?: { label: string; value: string };
  innovative?: string;
}

function buildInsights(
  applications: any[],
  upcomingEvents: UpcomingEvent[],
  responseRate: number
): CopilotInsight[] {
  const insights: CopilotInsight[] = [];

  // ── CRITICAL: Offer expiring ──
  upcomingEvents.filter(e => e.type === "deadline" && e.daysLeft <= 2).forEach(ev => {
    insights.push({
      id: `offer-critical-${ev.id}`,
      signal: "critical",
      category: "Offer Decision",
      headline: ev.daysLeft === 0
        ? `The ${ev.company} offer expires today — this window closes in hours`
        : `${ev.company} offer expires tomorrow — your decision window is almost gone`,
      reasoning: `Letting an offer expire without a response signals indecision and can permanently damage the relationship. Even a 24h extension request preserves optionality.`,
      action: ev.daysLeft === 0
        ? "Request extension or respond now — no middle ground"
        : "Work through the offer evaluation checklist today",
      metric: { label: "Decision window", value: ev.daysLeft === 0 ? "< 24h" : "~24h" },
      innovative: `Counter-offer leverage: companies expect 10–15% negotiation headroom. Asking costs nothing; accepting costs thousands.`,
    });
  });

  // ── HIGH: Interview today/tomorrow ──
  upcomingEvents.filter(e => e.type === "interview" && e.daysLeft <= 1).forEach(ev => {
    insights.push({
      id: `interview-imminent-${ev.id}`,
      signal: "critical",
      category: "Interview Readiness",
      headline: ev.daysLeft === 0
        ? `${ev.company} interview is today — switch to confidence mode now`
        : `${ev.company} interview is tomorrow — preparation window closes tonight`,
      reasoning: `Research shows candidates who do a verbal warm-up 30 minutes before an interview score 18% higher on first-impression ratings. No new material — confidence activation only.`,
      action: `Confirm your meeting link, do a 5-min voice warm-up, and review your top 3 STAR stories`,
      metric: { label: "Time to interview", value: ev.daysLeft === 0 ? "Today" : "Tomorrow" },
      innovative: `Psychological edge: write down 3 things you're uniquely good at before joining. It measurably reduces cortisol and sharpens clarity.`,
    });
  });

  // ── HIGH YIELD: Interview in prep window ──
  upcomingEvents.filter(e => e.type === "interview" && e.daysLeft > 1 && e.daysLeft <= 7).forEach(ev => {
    const topics = getPrepTopics(ev.role, ev.company);
    insights.push({
      id: `interview-prep-${ev.id}`,
      signal: "high",
      category: "High-ROI Prep Window",
      headline: `${ev.daysLeft} days to your ${ev.company} interview — peak preparation window is now`,
      reasoning: `Preparation effectiveness follows a curve: ${ev.daysLeft <= 3 ? "you're in the peak zone — focused, targeted practice beats broad studying" : "this is your deep research phase — build the narrative before drilling tactics"}.`,
      action: `Focus on: ${topics[0]}, ${topics[1]}`,
      actionRoute: "/interview-prep",
      metric: { label: "Prep ROI window", value: `${ev.daysLeft}d left` },
      innovative: `Interview hack: research the interviewer on LinkedIn before the call. Mentioning a shared interest or their published work creates instant rapport that outlasts technical performance.`,
    });
  });

  // ── PIPELINE VELOCITY insight ──
  const appliedCount = applications.filter(a => a.status === "Applied").length;
  const weekOld = applications.filter(a => {
    const d = new Date(a.createdAt ?? "");
    return (Date.now() - d.getTime()) < 7 * 86400000;
  }).length;
  if (appliedCount >= 5 && responseRate < 25) {
    insights.push({
      id: "velocity-low",
      signal: "high",
      category: "Pipeline Intelligence",
      headline: `${Math.round(responseRate)}% response rate signals a résumé or targeting problem`,
      reasoning: `Industry benchmark: 30%+ response rate means your résumé is working. Below 25% with ${appliedCount}+ applications means either the résumé isn't ATS-optimized or you're targeting mismatched roles.`,
      action: "Audit your résumé's ATS keyword density against the roles you're applying to",
      actionRoute: "/resume-optimizer",
      metric: { label: "Response rate", value: `${Math.round(responseRate)}%` },
      innovative: `Power move: apply to 20% "reach" roles and 80% "likely" roles. Most people do the opposite and wonder why callbacks drop.`,
    });
  }

  // ── OFFER LEVERAGE insight ──
  const offers = applications.filter(a => a.status === "Offer");
  const interviewing = applications.filter(a => a.status === "Interviewing");
  if (offers.length >= 1 && interviewing.length >= 1) {
    insights.push({
      id: "leverage-multiple",
      signal: "high",
      category: "Strategic Leverage",
      headline: `You have ${offers.length} offer and ${interviewing.length} active interview — maximum leverage moment`,
      reasoning: `Having a competing offer is the single strongest negotiation tool in job searching. Companies will accelerate timelines and improve packages when they know you have alternatives.`,
      action: "Inform your active interviews of the offer timeline — this creates urgency without burning bridges",
      metric: { label: "Leverage score", value: "Maximum" },
      innovative: `Script: "I've received an offer I'm excited about, and I need to respond by [date]. I wanted to check if there's any flexibility in your timeline since [Company] is my first choice."`,
    });
  }

  // ── MISSING DATES ──
  const appliedNoDates = applications.filter(a => a.status === "Applied" && !a.interviewDate);
  if (appliedNoDates.length >= 3) {
    insights.push({
      id: "missing-dates",
      signal: "medium",
      category: "Tracking Gap",
      headline: `${appliedNoDates.length} applied jobs have no interview date — your pipeline has blind spots`,
      reasoning: `Untracked interviews are a silent pipeline killer. Each untracked job is a deadline you don't know you're missing.`,
      action: "Add interview dates to all Applied jobs so Copilot can protect your deadlines",
      actionRoute: "/tracker",
      metric: { label: "Blind spots", value: `${appliedNoDates.length} jobs` },
    });
  }

  // ── WINNING STATE ──
  if (responseRate >= 40 && insights.length === 0) {
    insights.push({
      id: "winning",
      signal: "positive",
      category: "Pipeline Health",
      headline: `${Math.round(responseRate)}% response rate — your pipeline is performing above benchmark`,
      reasoning: `You're above the 30% industry benchmark. The pattern that's working: maintain application volume while keeping interview quality high.`,
      action: "Keep current approach — consider selectively targeting higher-seniority roles given your momentum",
      metric: { label: "vs. benchmark", value: `+${Math.round(responseRate - 30)}%` },
      innovative: `Compound momentum: candidates with 40%+ response rates who apply 20–30% more during this window land 2x faster than those who throttle down.`,
    });
  }

  // Fallback
  if (insights.length === 0) {
    insights.push({
      id: "empty",
      signal: "medium",
      category: "Getting Started",
      headline: "Add your first applications to activate strategic intelligence",
      reasoning: "Copilot needs at least 3 tracked applications with dates to start surfacing patterns and insights.",
      action: "Add applications with interview dates and deadlines in the Job Tracker",
      actionRoute: "/tracker",
    });
  }

  return insights;
}

const SIGNAL_CONFIG = {
  critical: {
    dot: "bg-red-500",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    badge: "text-red-400 bg-red-500/10 border-red-500/20",
    icon: "text-red-400",
    pulse: true,
  },
  high: {
    dot: "bg-purple-500",
    border: "border-purple-500/15",
    bg: "bg-purple-500/5",
    badge: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    icon: "text-purple-400",
    pulse: false,
  },
  medium: {
    dot: "bg-cyan-500",
    border: "border-cyan-500/15",
    bg: "bg-cyan-500/5",
    badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    icon: "text-cyan-400",
    pulse: false,
  },
  positive: {
    dot: "bg-emerald-500",
    border: "border-emerald-500/15",
    bg: "bg-emerald-500/5",
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    icon: "text-emerald-400",
    pulse: false,
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: applications = [], isLoading } = useListApplications();

  const [activeEventKey, setActiveEventKey] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [insightIndex, setInsightIndex] = useState(0);

  useDeadlineReminders(applications as any);

  const totalApplications = applications.length;
  const totalInterviews = applications.filter((a: any) => a.status === "Interviewing").length;
  const totalOffers = applications.filter((a: any) => a.status === "Offer").length;
  const totalProcessed = applications.filter((a: any) => a.status !== "Wishlist").length;
  const responseRate = totalProcessed > 0
    ? ((totalInterviews + totalOffers) / totalProcessed) * 100 : 0;

  const funnel = ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected"].map(status => ({
    status,
    count: applications.filter((a: any) => a.status === status).length,
  }));

  const upcomingEvents = useMemo((): UpcomingEvent[] => {
    const events: UpcomingEvent[] = [];
    applications.forEach((app: any) => {
      if (app.interviewDate) {
        const days = getDaysUntil(app.interviewDate);
        if (days !== null && days >= 0 && days <= 30)
          events.push({ id: app.id, eventKey: `interview-${app.id}`, company: app.company, role: app.role, type: "interview", date: app.interviewDate, daysLeft: days, hoursLeft: getHoursUntil(app.interviewDate) });
      }
      if (app.offerDeadline) {
        const days = getDaysUntil(app.offerDeadline);
        if (days !== null && days >= 0 && days <= 30)
          events.push({ id: app.id, eventKey: `deadline-${app.id}`, company: app.company, role: app.role, type: "deadline", date: app.offerDeadline, daysLeft: days, hoursLeft: getHoursUntil(app.offerDeadline) });
      }
    });
    return events.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [applications]);

  const activeEvent = useMemo(() => {
    if (!activeEventKey && upcomingEvents.length > 0) return upcomingEvents[0];
    return upcomingEvents.find(e => e.eventKey === activeEventKey) ?? upcomingEvents[0] ?? null;
  }, [activeEventKey, upcomingEvents]);

  const insights = useMemo(() =>
    buildInsights(applications as any[], upcomingEvents, responseRate),
    [applications, upcomingEvents, responseRate]
  );

  const currentInsight = insights[insightIndex] ?? insights[0];
  const sig = currentInsight ? SIGNAL_CONFIG[currentInsight.signal] : null;

  const actionCenter = useMemo(() => {
    if (!activeEvent) return null;
    const isOffer = activeEvent.type === "deadline";
    const days = activeEvent.daysLeft;
    const isImminent = days <= 2;
    if (isOffer) {
      return {
        type: "offer" as const,
        glowClass: isImminent ? "shadow-[0_0_24px_rgba(239,68,68,0.18)] border-red-500/40" : "shadow-[0_0_20px_rgba(251,146,60,0.12)] border-orange-500/30",
        headerColor: isImminent ? "text-red-400" : "text-orange-400",
        badgeClass: isImminent ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-orange-500/10 text-orange-400 border-orange-500/30",
        progressColor: isImminent ? "bg-red-500" : "bg-orange-500",
        tagLine: isImminent ? "⚠ IMMEDIATE ACTION REQUIRED" : "Offer Review in Progress",
        instruction: isImminent
          ? `The ${activeEvent.company} offer expires ${days === 0 ? "TODAY" : "TOMORROW"}. Do not let this deadline pass — even requesting a 1-day extension is better than silence.`
          : `You have ${days} days to evaluate the ${activeEvent.role} offer at ${activeEvent.company}. Work through the checklist systematically.`,
        checklist: OFFER_CHECKLIST,
      };
    }
    const checklist = getInterviewChecklist(days);
    return {
      type: "interview" as const,
      glowClass: days <= 1 ? "shadow-[0_0_24px_rgba(239,68,68,0.15)] border-red-500/30" : "shadow-[0_0_20px_rgba(6,182,212,0.12)] border-cyan-500/30",
      headerColor: days <= 1 ? "text-red-400" : "text-cyan-400",
      badgeClass: days <= 1 ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      progressColor: days <= 1 ? "bg-red-500" : "bg-cyan-500",
      tagLine: days === 0 ? "Warm-Up Mode — Interview Today" : days === 1 ? "Final Prep — Interview Tomorrow" : days <= 5 ? "Focused Preparation Mode" : "Deep Research Mode",
      instruction: days <= 1
        ? `Your ${activeEvent.role} interview at ${activeEvent.company} is ${days === 0 ? "TODAY" : "TOMORROW"} at ${formatTime(activeEvent.date) || formatDate(activeEvent.date)}. Confidence mode only — no new studying.`
        : days <= 5
          ? `${days} days until your ${activeEvent.role} interview at ${activeEvent.company}. High-ROI prep window.`
          : `${days} days until your ${activeEvent.role} interview at ${activeEvent.company}. Deep research phase.`,
      checklist,
    };
  }, [activeEvent]);

  const toggleCheck = (key: string) =>
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));

  const getReadiness = (prefix: string, total: number) => {
    const done = Array.from({ length: total }, (_, i) => checkedItems[`${prefix}-${i}`]).filter(Boolean).length;
    return Math.round((done / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto p-6">
        <div className="grid gap-4 grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
        <Skeleton className="h-[360px] w-full" />
        <div className="grid gap-4 grid-cols-3"><Skeleton className="col-span-2 h-[320px]" /><Skeleton className="h-[320px]" /></div>
      </div>
    );
  }

  return (
  <div className="space-y-6 max-w-[1400px] mx-auto px-6 pt-6 pb-10 text-zinc-100">
      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pt-4">
        {[
          { label: "Total Applications", value: totalApplications, sub: "tracked", icon: Briefcase, color: "text-cyan-400" },
          { label: "Active Interviews", value: totalInterviews, sub: `${Math.round(responseRate)}% response`, icon: Calendar, color: "text-amber-400" },
          { label: "Offers Secured", value: totalOffers, sub: "under review", icon: CheckCircle2, color: "text-emerald-400", valColor: "text-emerald-400" },
          { label: "Upcoming Events", value: upcomingEvents.length, sub: "next 30 days", icon: Bell, color: upcomingEvents.length > 0 ? "text-purple-400" : "text-zinc-600", valColor: upcomingEvents.length > 0 ? "text-purple-400" : "text-zinc-500" },
        ].map(({ label, value, sub, icon: Icon, color, valColor }) => (
          <Card key={label} className="bg-zinc-900/40 border-zinc-800/60 backdrop-blur-sm p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${valColor ?? "text-zinc-100"}`}>{value}</span>
              <span className="text-[10px] text-zinc-500">{sub}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Pipeline + AI COPILOT */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Pipeline Card takes 2/3 space */}
        <Card className="lg:col-span-2 bg-zinc-900/20 border-zinc-800/60 backdrop-blur-sm p-4 flex flex-col h-[360px]">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-200">Application Pipeline</CardTitle>
            <CardDescription className="text-[11px] text-zinc-500 mt-0.5">Applications by stage</CardDescription>
          </div>
          <div className="flex-1 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" opacity={0.4} />
                <XAxis dataKey="status" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis hide domain={[0, "dataMax + 1"]} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "6px", fontSize: "11px" }}
                  formatter={(v: any) => [`${v} applications`]}
                />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[4, 4, 0, 0]} barSize={40} background={{ fill: "#141417", radius: [4, 4, 0, 0] }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Copilot Card takes 1/3 space - anchored to the right */}
        <Card className="lg:col-span-1 bg-zinc-950 border-zinc-800/80 p-0 flex flex-col h-[360px] overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              </div>
              <span className="text-xs font-bold text-zinc-100 tracking-wide">Copilot</span>
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">AI Agent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-zinc-600">{insightIndex + 1}/{insights.length}</span>
              <button onClick={() => setInsightIndex(i => Math.max(0, i - 1))} disabled={insightIndex === 0}
                className="p-0.5 rounded hover:bg-zinc-800 disabled:opacity-20 transition-colors">
                <ChevronLeft size={11} className="text-zinc-400" />
              </button>
              <button onClick={() => setInsightIndex(i => Math.min(insights.length - 1, i + 1))} disabled={insightIndex === insights.length - 1}
                className="p-0.5 rounded hover:bg-zinc-800 disabled:opacity-20 transition-colors">
                <ChevronRight size={11} className="text-zinc-400" />
              </button>
            </div>
          </div>

          {currentInsight && sig && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Signal indicator strip */}
              <div className={cn("px-4 py-2.5 border-b border-zinc-800/40 shrink-0", sig.bg)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", sig.dot, currentInsight.signal === "critical" && "animate-pulse")} />
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest font-mono", sig.icon)}>
                      {currentInsight.signal === "critical" ? "Critical Signal" :
                       currentInsight.signal === "high" ? "High Priority" :
                       currentInsight.signal === "medium" ? "Insight" : "Positive Signal"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentInsight.metric && (
                      <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border", sig.badge)}>
                        {currentInsight.metric.value}
                      </span>
                    )}
                    <Badge className={cn("text-[9px] font-mono uppercase px-1.5 py-0 border", sig.badge)}>
                      {currentInsight.category}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Main insight body - short version */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                <p className="text-[13px] font-semibold text-zinc-100 leading-snug">
                  {currentInsight.headline}
                </p>

                <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/40 p-2.5">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{currentInsight.reasoning}</p>
                </div>

                <div className="flex items-start gap-2 pt-0.5">
                  <Zap size={11} className={cn("shrink-0 mt-0.5", sig.icon)} />
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-600 mb-0.5">Recommended Action</p>
                    <p className="text-[11px] font-semibold text-zinc-200 leading-relaxed">{currentInsight.action}</p>
                  </div>
                </div>

                {currentInsight.actionRoute && (
                  <button
                    onClick={() => setLocation(currentInsight.actionRoute!)}
                    className={cn("w-full text-[11px] font-bold py-2 rounded-lg border transition-colors", sig.badge, "hover:opacity-80")}
                  >
                    Take Action →
                  </button>
                )}
              </div>

              {/* Insight navigation dots */}
              <div className="flex items-center justify-center gap-1.5 py-2.5 border-t border-zinc-800/40 shrink-0">
                {insights.map((ins, i) => {
                  const s = SIGNAL_CONFIG[ins.signal];
                  return (
                    <button
                      key={ins.id}
                      onClick={() => setInsightIndex(i)}
                      className={cn("rounded-full transition-all", i === insightIndex ? `w-4 h-1.5 ${s.dot}` : `w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-600`)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming Events + Focus Mode Action Center */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-zinc-900/50 backdrop-blur-xl border-white/5 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-200">Upcoming Events</CardTitle>
              <CardDescription className="text-[11px] text-zinc-500 mt-0.5">Click any row to activate its Action Plan</CardDescription>
            </div>
            <Badge className="text-[10px] font-mono bg-zinc-800/60 text-zinc-400 border-zinc-700">{upcomingEvents.length} events</Badge>
          </div>
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {upcomingEvents.map((event) => {
              const isActive = (activeEventKey ?? upcomingEvents[0]?.eventKey) === event.eventKey;
              const isUrgent = event.daysLeft <= 2;
              const isInterview = event.type === "interview";
              return (
                <div key={event.eventKey} onClick={() => setActiveEventKey(event.eventKey)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                    isActive
                      ? isInterview ? "border-cyan-500/40 bg-cyan-500/8 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                                    : "border-orange-500/40 bg-orange-500/8 shadow-[0_0_12px_rgba(251,146,60,0.1)]"
                      : isUrgent ? "border-red-500/20 bg-red-950/8 hover:border-red-500/30"
                                 : "border-zinc-800/60 bg-zinc-900/20 hover:border-zinc-700/60"
                  )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("p-1.5 rounded shrink-0", isInterview ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400")}>
                      {isInterview ? <Calendar size={12} /> : <Timer size={12} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100 truncate">{event.company}</span>
                        <span className="text-[10px] text-zinc-500 truncate">{event.role}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-[10px] font-medium", isInterview ? "text-amber-400/80" : "text-emerald-400/80")}>
                          {isInterview ? "Interview" : "Offer Deadline"}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">{formatDate(event.date)}</span>
                        {formatTime(event.date) && <span className="text-[10px] font-mono text-zinc-600">{formatTime(event.date)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-4">
                    <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded border",
                      event.daysLeft === 0 ? "text-red-400 border-red-500/30 bg-red-500/10"
                      : isUrgent ? "text-orange-400 border-orange-500/30 bg-orange-500/10"
                      : "text-zinc-400 border-zinc-700/60 bg-zinc-800/40")}>
                      {event.daysLeft === 0 ? "TODAY" : `${event.daysLeft}d`}
                    </span>
                    <div className={cn("p-1 rounded transition-colors", isActive ? "bg-white/10" : "bg-zinc-800/60")}>
                      <ArrowRight size={11} className={isActive ? "text-zinc-100" : "text-zinc-500"} />
                    </div>
                  </div>
                </div>
              );
            })}
            {upcomingEvents.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <Clock className="w-7 h-7 text-zinc-700 mx-auto" />
                <p className="text-zinc-500 text-xs">No upcoming events in the next 30 days.</p>
                <button onClick={() => setLocation("/tracker")} className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2">Open Tracker</button>
              </div>
            )}
          </div>
        </Card>

        {/* Focus Mode Action Center */}
        <Card className={cn("xl:col-span-1 bg-zinc-900/50 backdrop-blur-xl p-4 flex flex-col transition-all duration-300", actionCenter ? actionCenter.glowClass : "border-zinc-800/60")}>
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3 shrink-0">
            <Cpu className={cn("w-4 h-4", actionCenter?.headerColor ?? "text-cyan-400")} />
            <CardTitle className="text-sm font-semibold text-zinc-200">Action Center</CardTitle>
            {actionCenter && (
              <Badge className={cn("ml-auto text-[9px] font-mono uppercase border px-1.5 py-0", actionCenter.badgeClass)}>
                {activeEvent?.company}
              </Badge>
            )}
          </div>
          {actionCenter && activeEvent ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <p className={cn("text-[10px] font-bold uppercase tracking-widest font-mono mb-1.5", actionCenter.headerColor)}>
                {actionCenter.tagLine}
              </p>
              <p className="text-[11px] text-zinc-300 leading-relaxed mb-3">{actionCenter.instruction}</p>
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                {actionCenter.checklist.map((item, ci) => {
                  const key = `${activeEvent.eventKey}-${ci}`;
                  const checked = checkedItems[key] ?? false;
                  const Icon = item.icon;
                  return (
                    <div key={ci} onClick={() => toggleCheck(key)}
                      className={cn("flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all",
                        checked ? "border-white/5 bg-white/3 opacity-50" : "border-white/5 bg-zinc-800/30 hover:bg-zinc-800/60")}>
                      <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                        checked ? `border-transparent ${actionCenter.progressColor}` : "border-zinc-600")}>
                        {checked && <CheckCircle2 size={9} className="text-zinc-950" />}
                      </div>
                      <div className="flex items-start gap-1.5 min-w-0">
                        <Icon size={11} className={cn("shrink-0 mt-0.5", checked ? "text-zinc-600" : actionCenter.headerColor)} />
                        <span className={cn("text-[11px] leading-relaxed", checked ? "text-zinc-600 line-through" : "text-zinc-200")}>
                          {item.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const pct = getReadiness(activeEvent.eventKey, actionCenter.checklist.length);
                return (
                  <div className="mt-3 pt-3 border-t border-white/5 shrink-0">
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="text-zinc-500 font-mono uppercase tracking-wider">
                        {actionCenter.type === "offer" ? "Decision Readiness" : "Prep Readiness"}
                      </span>
                      <span className={cn("font-bold font-mono", actionCenter.headerColor)}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", actionCenter.progressColor)} style={{ width: `${pct}%` }} />
                    </div>
                    {pct >= 80 && <p className="text-[10px] text-emerald-400 mt-1.5 font-medium">✓ You appear ready for this {actionCenter.type === "offer" ? "decision" : "interview"}.</p>}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-6">
              <ArrowRight className="w-7 h-7 text-zinc-700" />
              <p className="text-zinc-500 text-xs font-medium">No events to act on</p>
              <p className="text-zinc-600 text-[10px] max-w-[160px] leading-relaxed">Add jobs with interview dates and deadlines to unlock your action plan.</p>
              <button onClick={() => setLocation("/tracker")} className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 mt-1">Open Tracker</button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
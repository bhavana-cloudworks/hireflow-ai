import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Zap, Search, Loader2, Target, TrendingUp,
  ShieldCheck, AlertCircle, Download, History, ArrowUpRight,
  Copy, CheckCheck, RefreshCw, ChevronUp, ChevronDown, CircleDot, Sparkles,
} from "lucide-react";
import { useAnalyzeResume } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STOP = new Set(["the","and","for","are","but","not","you","all","can","had","was","one","our","out","get","has","his","how","new","now","see","two","way","who","did","its","let","put","say","she","too","use","with","that","this","from","have","been","will","your","they","what","when","where","which","would","could","should","there","their","about","more","also","into","then","than","some","other","time","make","just","over","such","well","even","most","here","only","come","work","life","back","good","know","same","take","year","want","look","need","like","very","after","before"]);

const SKILLS = [
  { name:"react",      al:["react.js","reactjs"],       ctx:"Built scalable component-based UIs using React with hooks and context API." },
  { name:"typescript", al:["ts"],                        ctx:"Enforced strict typing, reducing production bugs by 40% and improving DX." },
  { name:"javascript", al:["js","es6"],                  ctx:"Developed performant client-side apps leveraging modern JavaScript (ES2020+)." },
  { name:"python",     al:["py"],                        ctx:"Wrote data pipelines and automation scripts reducing manual workflow by 60%." },
  { name:"java",       al:[],                            ctx:"Engineered enterprise backend services using Java Spring Boot with REST APIs." },
  { name:"node.js",    al:["nodejs","node"],             ctx:"Built high-throughput REST APIs in Node.js handling 50k+ concurrent requests." },
  { name:"next.js",    al:["nextjs"],                    ctx:"Delivered SSR/SSG pages with Next.js, improving LCP by 35% and SEO rankings." },
  { name:"graphql",    al:[],                            ctx:"Designed GraphQL schemas reducing over-fetching by 40%." },
  { name:"postgresql", al:["postgres","pg"],             ctx:"Designed normalized schemas, optimized queries reducing p95 latency by 60%." },
  { name:"mysql",      al:[],                            ctx:"Managed high-availability MySQL clusters with read replicas at scale." },
  { name:"mongodb",    al:["mongo"],                     ctx:"Modeled document schemas in MongoDB, leveraging aggregation pipelines." },
  { name:"redis",      al:[],                            ctx:"Implemented Redis caching layer reducing DB load by 70% and latency by 40ms." },
  { name:"aws",        al:["amazon web services"],       ctx:"Architected cloud infrastructure on AWS (EC2, S3, Lambda, RDS) for 99.9% SLA." },
  { name:"gcp",        al:["google cloud"],              ctx:"Deployed containerized workloads on GCP using Cloud Run and BigQuery." },
  { name:"azure",      al:["microsoft azure"],           ctx:"Managed Azure infrastructure including AKS, Cosmos DB, and Azure Functions." },
  { name:"docker",     al:[],                            ctx:"Containerized microservices ensuring identical environments across all stages." },
  { name:"kubernetes", al:["k8s"],                       ctx:"Orchestrated containers with Kubernetes enabling auto-scaling and zero-downtime." },
  { name:"terraform",  al:[],                            ctx:"Authored IaC modules in Terraform for repeatable, auditable deployments." },
  { name:"ci/cd",      al:["github actions","jenkins"],  ctx:"Built CI/CD pipelines cutting deployment time from 2 hours to 8 minutes." },
  { name:"kafka",      al:["apache kafka"],              ctx:"Designed event-driven architecture with Kafka processing 500k events/second." },
  { name:"spark",      al:["pyspark"],                   ctx:"Processed multi-TB datasets using Apache Spark, reducing ETL runtime by 65%." },
  { name:"machine learning", al:["ml","deep learning","ai","llm","nlp"], ctx:"Trained and deployed ML models achieving 94% accuracy on production tasks." },
  { name:"fastapi",    al:[],                            ctx:"Built high-performance async APIs with FastAPI at sub-10ms p99 response times." },
  { name:"sql",        al:[],                            ctx:"Wrote complex SQL including CTEs, window functions, and query optimizations." },
  { name:"linux",      al:["unix","bash","shell"],       ctx:"Administered Linux servers and wrote Bash automation scripts for deployments." },
  { name:"git",        al:["github","gitlab"],           ctx:"Maintained clean git workflows with trunk-based development standards." },
  { name:"testing",    al:["jest","pytest","cypress"],   ctx:"Achieved 85%+ test coverage using Jest/RTL and Cypress for E2E testing." },
  { name:"agile",      al:["scrum","kanban","jira"],     ctx:"Delivered features in two-week sprints maintaining >95% sprint velocity." },
];

const POWER = new Set(["architected","engineered","optimized","implemented","designed","built","developed","led","created","launched","scaled","automated","reduced","increased","delivered","mentored","streamlined","drove","deployed","migrated","refactored","established","transformed","accelerated","generated","achieved","exceeded","orchestrated","spearheaded","pioneered","managed","revamped","modernized"]);

const WEAK = [
  { re:/\bworked on\b/gi,              fix:"engineered" },
  { re:/\bresponsible for\b/gi,        fix:"led" },
  { re:/\bhelped(?: with| to)?\b/gi,   fix:"collaborated on" },
  { re:/\bassisted(?: in| with)?\b/gi, fix:"contributed to" },
  { re:/\bwas involved in\b/gi,        fix:"participated in" },
  { re:/\bdid\b/gi,                    fix:"executed" },
  { re:/\bhandled\b/gi,                fix:"managed" },
  { re:/\btried to\b/gi,               fix:"successfully" },
  { re:/\bworked with\b/gi,            fix:"partnered with" },
  { re:/\bmany\b/gi,                   fix:"(quantify — e.g. '15+' or '3x')" },
  { re:/\bsome\b/gi,                   fix:"(use a specific number)" },
  { re:/\bvery\b/gi,                   fix:"(remove — use specific metrics)" },
];

const SECTIONS = ["experience","education","skills","projects","certifications","summary","objective","achievements"];

interface Analysis {
  score: number;
  breakdown: { label: string; score: number; max: number; note: string }[];
  kwPct: number;
  impactPct: number;
  weakLines: { original: string; improved: string }[];
  missingSkills: typeof SKILLS;
  missingKw: string[];
}

function compute(r: string, j: string): Analysis {
  const rl = r.toLowerCase(), jl = j.toLowerCase();
  const jdWords = [...new Set(jl.split(/\W+/).filter(w => w.length > 3 && !STOP.has(w)))];
  const matchedKw = jdWords.filter(w => rl.includes(w));
  const missingKw = jdWords.filter(w => !rl.includes(w)).slice(0, 20);
  const kwScore   = Math.round((matchedKw.length / Math.max(jdWords.length, 1)) * 25);

  const reqSkills     = SKILLS.filter(s => [s.name, ...s.al].some(n => jl.includes(n)));
  const missingSkills = reqSkills.filter(s => ![s.name, ...s.al].some(n => rl.includes(n)));
  const skillScore    = Math.round(((reqSkills.length - missingSkills.length) / Math.max(reqSkills.length, 1)) * 20);

  const words     = rl.split(/\W+/);
  const uniqVerbs = new Set(words.filter(w => POWER.has(w))).size;
  const impactPct = Math.min(100, Math.round((uniqVerbs / 8) * 100));
  const impactSect= Math.min(20,  Math.round((uniqVerbs / 8) * 20));

  const nums      = r.match(/\b\d+[\+\-\%x]?|\d+\s*(?:percent|x|times|k|m|million|\$)/gi) ?? [];
  const quantScore= Math.min(20, Math.round((nums.length / 5) * 20));

  const sects     = SECTIONS.filter(s => rl.includes(s));
  const sectScore = Math.min(15, Math.round((sects.length / 5) * 15));

  const seen = new Set<string>();
  const weakLines: { original: string; improved: string }[] = [];
  r.split("\n").forEach(line => {
    WEAK.forEach(p => {
      p.re.lastIndex = 0;
      if (p.re.test(line) && line.trim().length > 3 && !seen.has(line.trim())) {
        seen.add(line.trim());
        p.re.lastIndex = 0;
        weakLines.push({ original: line.trim(), improved: line.replace(p.re, p.fix).trim() });
      }
    });
  });

  return {
    score: Math.max(0, Math.min(100, kwScore + skillScore + impactSect + quantScore + sectScore)),
    breakdown: [
      { label:"Keyword Alignment",       score:kwScore,    max:25, note:`${matchedKw.length}/${jdWords.length} keywords matched` },
      { label:"Skills Coverage",          score:skillScore, max:20, note:`${reqSkills.length - missingSkills.length}/${reqSkills.length} required skills` },
      { label:"Impact Language",          score:impactSect, max:20, note:`${uniqVerbs} unique power verbs` },
      { label:"Quantified Achievements",  score:quantScore, max:20, note:`${nums.length} numbers/metrics found` },
      { label:"Resume Structure",         score:sectScore,  max:15, note:`${sects.length} sections detected` },
    ],
    kwPct: Math.round((matchedKw.length / Math.max(jdWords.length, 1)) * 100),
    impactPct,
    weakLines,
    missingSkills,
    missingKw,
  };
}

const col = (s: number) => s >= 80 ? "#34d399" : s >= 60 ? "#fbbf24" : s >= 40 ? "#f97316" : "#fb7185";
const lbl = (s: number) => s >= 80 ? "Excellent" : s >= 60 ? "Good" : s >= 40 ? "Fair" : "Needs Work";

function Ring({ score }: { score: number }) {
  const r = 44, circ = 2 * Math.PI * r, c = col(score);
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} stroke="white" strokeOpacity="0.06" strokeWidth="6" fill="none"/>
          <motion.circle cx="48" cy="48" r={r} stroke={c} strokeWidth="6" fill="none"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - (circ * score) / 100 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${c}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span key={score} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-black tracking-tighter" style={{ color: c }}>{score}
          </motion.span>
          <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold">ATS</span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-xs font-black" style={{ color: c }}>{lbl(score)}</p>
        <p className="text-[10px] text-white/30 mt-0.5">out of 100</p>
      </div>
    </div>
  );
}

const TABS = ["Breakdown", "Phrases", "Keywords", "Skills", "Log"] as const;
type Tab = typeof TABS[number];

export default function Resume() {
  const [resume,  setResume]  = useState("");
  const [jd,      setJd]      = useState("");
  const [isExtracting, setEx] = useState(false);
  const [isExtractingJd, setExJd] = useState(false);
  const [copied,  setCopied]  = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [scores,  setScores]  = useState<number[]>([]);
  const [tab,     setTab]     = useState<Tab>("Breakdown");
  const [debR,    setDebR]    = useState("");
  const [debJ,    setDebJ]    = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const jdFileRef = useRef<HTMLInputElement>(null);
  const api     = useAnalyzeResume();

  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebR(resume); setDebJ(jd); }, 220);
    return () => clearTimeout(t);
  }, [resume, jd]);

  const analysis = useMemo<Analysis | null>(() => {
    if (!debR || !debJ) return null;
    return compute(debR, debJ);
  }, [debR, debJ]);

  useEffect(() => {
    if (!analysis) return;
    setScores(p => {
      if (p[p.length - 1] === analysis.score) return p;
      return [...p.slice(-9), analysis.score];
    });
  }, [analysis?.score]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEx(true);
    const reader = new FileReader();
    if (file.name.endsWith(".docx")) {
      reader.onload = async ev => {
        // @ts-ignore
        if (window.mammoth) {
          try {
            // @ts-ignore
            const result = await window.mammoth.extractRawText({ arrayBuffer: ev.target?.result });
            setResume(result.value);
            toast.success("Resume parsed");
          } catch { toast.error("Parse failed"); }
        }
        setEx(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = ev => { setResume(ev.target?.result as string); setEx(false); };
      reader.readAsText(file);
    }
  };

  const handleJdFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExJd(true);
    const reader = new FileReader();
    if (file.name.endsWith(".docx")) {
      reader.onload = async ev => {
        // @ts-ignore
        if (window.mammoth) {
          try {
            // @ts-ignore
            const result = await window.mammoth.extractRawText({ arrayBuffer: ev.target?.result });
            setJd(result.value);
            toast.success("Job description parsed");
          } catch { toast.error("Parse failed"); }
        }
        setExJd(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = ev => { setJd(ev.target?.result as string); setExJd(false); };
      reader.readAsText(file);
    }
  };

  const applyFix = (orig: string, improved: string) => {
    setResume(p => p.replace(orig, improved));
    setHistory(p => [`Rewrote: "${improved.slice(0, 48)}…"`, ...p]);
    toast.success("Fix applied");
  };

  const addSkill = (s: typeof SKILLS[0]) => {
    setResume(p => `${p.trimEnd()}\n• ${s.name}: ${s.ctx}`);
    setHistory(p => [`Injected ${s.name}`, ...p]);
    toast.success(`${s.name} added`);
  };

  const score     = analysis?.score ?? 0;
  const prevScore = scores[scores.length - 2] ?? 0;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] overflow-hidden">

      {/* TOP BAR */}
      <div className="flex items-center justify-end px-6 py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setResume(""); setJd(""); setScores([]); setHistory([]); toast("Reset"); }}
            className="h-7 px-3 text-[9px] font-black uppercase tracking-widest text-white/35 hover:text-white flex items-center gap-1.5 transition-colors">
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
          <button
            onClick={() => {
              if (!analysis) { toast.error("Paste resume & JD first"); return; }
              const blob = new Blob([JSON.stringify({
                score, grade: lbl(score),
                breakdown: analysis.breakdown,
                missingSkills: analysis.missingSkills.map(s => s.name),
                missingKeywords: analysis.missingKw,
                optimizations: history,
                exportedAt: new Date().toISOString(),
              }, null, 2)], { type: "application/json" });
              Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "ATS-Report.json" }).click();
              toast.success("Exported");
            }}
            className="h-7 px-3 text-[9px] font-black uppercase tracking-widest bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/60 hover:text-white flex items-center gap-1.5 transition-colors">
            <Download className="w-3 h-3" /> Export
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex flex-1 min-h-0 gap-0">

        {/* LEFT PANEL */}
        <div className="flex flex-col w-1/2 min-w-0 border-r border-white/[0.05] p-6 gap-6">

          {/* Resume Section */}
          <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-white/[0.07] bg-[#0d0d12] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Your Resume
              </span>
              <div className="flex items-center gap-4">
                <input ref={fileRef} type="file" className="hidden" accept=".txt,.docx" onChange={handleFile} />
                <button onClick={() => fileRef.current?.click()}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300">
                  {isExtracting ? "Parsing…" : "Upload Resume"}
                </button>
              </div>
            </div>
            <Textarea
              value={resume} onChange={e => setResume(e.target.value)}
              placeholder="Paste your resume here..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm text-white/60 p-5 resize-none placeholder:text-white/20 min-h-0"
            />
          </div>

          {/* Job Description Section - NOW SYMMETRIC */}
          <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-white/[0.07] bg-[#0d0d12] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" /> Your Job Description
              </span>
              <div className="flex items-center gap-4">
                <input ref={jdFileRef} type="file" className="hidden" accept=".txt,.docx" onChange={handleJdFile} />
                <button onClick={() => jdFileRef.current?.click()}
                  className="text-xs font-medium text-purple-400 hover:text-purple-300">
                  {isExtractingJd ? "Parsing…" : "Upload Job Description"}
                </button>
              </div>
            </div>
            <Textarea
              value={jd} onChange={e => setJd(e.target.value)}
              placeholder="Paste the job description here..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm text-white/60 p-5 resize-none placeholder:text-white/20 min-h-0"
            />
          </div>

          {/* Main Analyze Button */}
          <Button
            onClick={() => api.mutate({ data: { resume, jobDescription: jd } })}
            disabled={!resume || !jd || api.isPending}
            className="h-12 font-bold text-sm rounded-xl gap-2 text-slate-900 bg-[#00e5ff] hover:bg-[#00e5ff]/90 w-full shrink-0 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
            {api.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
              : <><Zap className="w-4 h-4 fill-current" /> Analyze Resume</>}
          </Button>
        </div>

        {/* RIGHT PANEL - ANALYTICS (Stay as it was) */}
        <div className="flex flex-col w-1/2 min-w-0 min-h-0 p-4 gap-3">

          {/* Live Score Ring */}
          <div className="rounded-xl border border-white/[0.07] bg-[#0d0d12] p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Live Score</span>
              {scores.length > 1 && (
                <span className={cn("text-[9px] font-black flex items-center gap-0.5", score > prevScore ? "text-emerald-400" : "text-rose-400")}>
                  {score > prevScore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {Math.abs(score - prevScore)}pts
                </span>
              )}
            </div>
            <Ring score={score} />
            {scores.length > 1 && (
              <div className="flex items-end gap-1 h-5 mt-2">
                {scores.map((s, i) => (
                  <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${(s / Math.max(...scores)) * 100}%` }}
                    className="flex-1 rounded-t-sm" style={{ background: col(s) + "77" }} />
                ))}
              </div>
            )}
          </div>

          {/* 4 Mini Stats */}
          {analysis && (
            <div className="grid grid-cols-4 gap-2 shrink-0">
              {[
                { l:"Keywords", v:`${analysis.kwPct}%`,           icon:Search,      c:"text-cyan-400" },
                { l:"Impact",   v:`${analysis.impactPct}%`,       icon:TrendingUp,  c:"text-purple-400" },
                { l:"Weak",     v:analysis.weakLines.length,      icon:AlertCircle, c:"text-rose-400" },
                { l:"Gaps",     v:analysis.missingSkills.length,  icon:Target,      c:"text-amber-400" },
              ].map(s => (
                <div key={s.l} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2 text-center">
                  <div className={cn("text-[8px] font-black uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1", s.c)}>
                    <s.icon className="w-2.5 h-2.5" />{s.l}
                  </div>
                  <div className="text-base font-black text-white">{s.v}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Selection */}
          <div className="flex gap-1 shrink-0">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  tab === t
                    ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-400"
                    : "text-white/30 hover:text-white/60"
                )}>
                {t}
              </button>
            ))}
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/[0.07] bg-[#0d0d12] p-3">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                {tab === "Breakdown" && (
                  <div className="space-y-3">
                    {!analysis
                      ? <p className="text-[10px] text-white/20">Analyze to see score breakdown</p>
                      : analysis.breakdown.map((b, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-white/60">{b.label}</span>
                            <span className="font-black text-white/80">{b.score}/{b.max}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(b.score / b.max) * 100}%` }}
                              transition={{ duration: 0.6 }} className="h-full rounded-full"
                              style={{ background: col((b.score / b.max) * 100) }} />
                          </div>
                          <p className="text-[9px] text-white/25 italic">{b.note}</p>
                        </div>
                      ))
                    }
                  </div>
                )}

                {tab === "Phrases" && (
                  <div className="space-y-2">
                    {!analysis ? <p className="text-[10px] text-white/20">Analyze to check phrasing</p> : analysis.weakLines.map((item, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-rose-500/[0.06] border border-rose-500/10">
                          <span className="text-[8px] font-black text-rose-400 uppercase block mb-1">Weak</span>
                          <p className="text-[10px] text-white/40 italic">{item.original}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
                          <span className="text-[8px] font-black text-emerald-400 uppercase block mb-1">Strong</span>
                          <p className="text-[10px] text-white/80">{item.improved}</p>
                          <button onClick={() => applyFix(item.original, item.improved)} className="mt-1 text-[8px] font-black text-cyan-400 uppercase tracking-widest">Apply Fix</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tab === "Keywords" && (
                  <div className="flex flex-wrap gap-1.5">
                    {!analysis ? <p className="text-[10px] text-white/20">Analyze to see missing keywords</p> : analysis.missingKw.map((kw, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-white/45">{kw}</span>
                    ))}
                  </div>
                )}

                {tab === "Skills" && (
                  <div className="space-y-2">
                    {!analysis ? <p className="text-[10px] text-white/20">Analyze to see skill gaps</p> : analysis.missingSkills.map(s => (
                      <button key={s.name} onClick={() => addSkill(s)}
                        className="w-full text-left p-2 rounded-lg bg-white/[0.03] border border-white/[0.07] hover:bg-amber-500/10 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <CircleDot className="w-2.5 h-2.5 text-amber-400" />
                          <span className="text-[10px] font-black text-white">{s.name}</span>
                          <span className="ml-auto text-[8px] text-cyan-400 uppercase tracking-widest">Inject Bullet</span>
                        </div>
                        <p className="text-[9px] text-white/30 italic">{s.ctx}</p>
                      </button>
                    ))}
                  </div>
                )}

                {tab === "Log" && (
                  <div className="space-y-1.5">
                    {history.map((log, i) => (
                      <div key={i} className="text-[10px] text-emerald-400/70 flex items-start gap-2">
                        <ArrowUpRight className="w-3 h-3 mt-0.5 shrink-0" />{log}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
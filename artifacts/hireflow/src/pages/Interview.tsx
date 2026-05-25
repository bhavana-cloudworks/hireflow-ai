import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Zap, Loader2, User, Wrench, Server, RefreshCw } from "lucide-react";
import { useGenerateInterviewQuestions } from "@workspace/api-client-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const JOB_TYPES = ["Software Engineer", "Backend Engineer", "Frontend Engineer", "Cloud Engineer", "Data Engineer"];
const EXP_LEVELS = ["Junior", "Mid", "Senior", "Staff"];

const CATEGORY_CONFIG = [
  { key: "behavioral" as const, label: "Behavioral", icon: User, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/25" },
  { key: "technical" as const, label: "Technical", icon: Wrench, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/25" },
  { key: "systemDesign" as const, label: "System Design", icon: Server, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
];

export default function Interview() {
  const [jobType, setJobType] = useState("Software Engineer");
  const [expLevel, setExpLevel] = useState("Mid");
  const [activeCategory, setActiveCategory] = useState<"behavioral" | "technical" | "systemDesign">("behavioral");
  const generateQuestions = useGenerateInterviewQuestions();

  const handleGenerate = () => {
    generateQuestions.mutate(
      { data: { jobType, experienceLevel: expLevel } },
      { onError: () => toast.error("Failed to generate questions") }
    );
  };

  const result = generateQuestions.data;
  const currentQuestions = result ? result[activeCategory] : [];

  return (
    <div className="px-6 pb-6 h-full flex flex-col bg-[#0d1117]">
      
      {/* TOP ACTION BAR - NO HEADING */}
      <div className="flex items-center justify-end py-3 shrink-0 gap-4">
          <div className="flex items-center gap-1.5 text-cyan-500 text-[10px] font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /> AI Engine Ready
          </div>
      </div>

      <div className="space-y-4">
        {/* Controls - Updated to fill width */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Job Type</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                  {JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Experience Level</Label>
              <Select value={expLevel} onValueChange={setExpLevel}>
                <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                  {EXP_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateQuestions.isPending}
              className="bg-[#00c2ff] hover:bg-[#00a3d9] text-[#0d1117] font-bold text-[14px] h-9 px-8 rounded-lg transition-all gap-2"
            >
              {generateQuestions.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Zap size={16} fill="currentColor" /> Generate Questions</>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Results Area */}
        {generateQuestions.isPending && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-16 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#00c2ff] animate-spin" />
            <p className="text-sm text-zinc-400 font-medium tracking-wide">AI is tailoring your {jobType} questions...</p>
          </div>
        )}

        {result && !generateQuestions.isPending && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Category Tabs */}
            <div className="flex gap-2">
              {CATEGORY_CONFIG.map(({ key, label, icon: Icon, color, bg, border }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-150 uppercase tracking-wider",
                    activeCategory === key
                      ? "bg-white/10 border-[#00c2ff] text-[#00c2ff]"
                      : "border-[#30363d] text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  <span className="ml-1 opacity-60">({result[key].length})</span>
                </button>
              ))}
            </div>

            {/* Questions List - Full Width */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {currentQuestions.map((q, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex gap-4 p-4 bg-[#0d1117] rounded-xl border border-[#30363d] hover:border-zinc-700 transition-all group"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover:text-[#00c2ff] transition-colors">
                          {i + 1}
                        </div>
                        <p className="text-[14px] text-zinc-200 leading-relaxed font-medium">{q}</p>
                      </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {!result && !generateQuestions.isPending && (
          <div className="bg-[#161b22] border border-[#30363d] border-dashed rounded-xl p-20 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-zinc-700" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-white">No questions generated yet</p>
              <p className="text-[13px] text-zinc-500 mt-1 max-w-[280px]">Select your parameters and click Generate to start your AI practice session.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
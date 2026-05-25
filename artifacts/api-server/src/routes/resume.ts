import { Router, type IRouter } from "express";
import { AnalyzeResumeBody } from "@workspace/api-zod";

const router: IRouter = Router();

const COMMON_KEYWORDS: Record<string, string[]> = {
  software: ["TypeScript", "JavaScript", "React", "Node.js", "Python", "SQL", "Git", "REST API", "CI/CD", "Docker", "AWS", "Agile", "testing", "microservices", "GraphQL"],
  backend: ["Node.js", "Python", "Java", "Go", "PostgreSQL", "Redis", "Docker", "Kubernetes", "REST API", "gRPC", "CI/CD", "cloud", "scaling", "databases"],
  frontend: ["React", "TypeScript", "CSS", "HTML", "Webpack", "Vite", "accessibility", "performance", "testing", "responsive design", "animations", "Next.js"],
  devops: ["Kubernetes", "Docker", "Terraform", "AWS", "GCP", "Azure", "CI/CD", "monitoring", "Ansible", "Helm", "observability", "SRE"],
  data: ["Python", "SQL", "pandas", "machine learning", "statistics", "ETL", "Spark", "data pipeline", "visualization", "dbt", "BigQuery"],
  default: ["communication", "teamwork", "leadership", "problem-solving", "agile", "documentation", "mentoring", "ownership"],
};

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("devops") || lower.includes("infrastructure") || lower.includes("kubernetes")) return "devops";
  if (lower.includes("data scientist") || lower.includes("machine learning") || lower.includes("analytics")) return "data";
  if (lower.includes("frontend") || lower.includes("front-end") || lower.includes("ui developer")) return "frontend";
  if (lower.includes("backend") || lower.includes("back-end") || lower.includes("server")) return "backend";
  if (lower.includes("software") || lower.includes("full stack") || lower.includes("engineer")) return "software";
  return "default";
}

function scoreSection(resumeText: string, keywords: string[]): number {
  const lower = resumeText.toLowerCase();
  const found = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
  return Math.min(100, Math.round((found / keywords.length) * 100) + Math.floor(Math.random() * 10));
}

router.post("/resume/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { resumeText, jobDescription } = parsed.data;
  const category = detectCategory(jobDescription);
  const keywords = COMMON_KEYWORDS[category] ?? COMMON_KEYWORDS.default;

  const lower = resumeText.toLowerCase();
  const missingKeywords = keywords.filter((k) => !lower.includes(k.toLowerCase())).slice(0, 8);

  const impact = scoreSection(resumeText, ["improved", "increased", "reduced", "built", "led", "designed", "launched", "delivered", "achieved", "drove"]);
  const skills = scoreSection(resumeText, keywords.slice(0, 8));
  const experience = Math.min(100, 60 + (resumeText.split("\n").length > 30 ? 20 : 0) + Math.floor(Math.random() * 15));
  const kwScore = Math.min(100, Math.round(((keywords.length - missingKeywords.length) / keywords.length) * 100));
  const formatting = resumeText.includes("\n\n") ? Math.min(100, 75 + Math.floor(Math.random() * 15)) : Math.min(100, 55 + Math.floor(Math.random() * 15));

  const atsScore = Math.round((impact * 0.2 + skills * 0.25 + experience * 0.2 + kwScore * 0.25 + formatting * 0.1));

  const suggestions = [
    missingKeywords.length > 0 ? `Add missing keywords: ${missingKeywords.slice(0, 3).join(", ")}` : "Your keyword coverage is strong.",
    impact < 70 ? "Use more quantified achievements (e.g., 'increased performance by 40%')" : "Good use of impact-driven language.",
    experience < 80 ? "Expand your work experience section with more detail." : "Experience section looks comprehensive.",
    formatting < 75 ? "Improve formatting with clearer section headers and consistent spacing." : "Formatting is clean and ATS-friendly.",
  ].filter(Boolean);

  res.json({
    atsScore,
    missingKeywords,
    suggestions,
    breakdown: { impact, skills, experience, keywords: kwScore, formatting },
  });
});

export default router;

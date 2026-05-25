import { Router, type IRouter } from "express";
import { GenerateInterviewQuestionsBody } from "@workspace/api-zod";

const router: IRouter = Router();

const QUESTIONS: Record<string, { behavioral: string[]; technical: string[]; systemDesign: string[] }> = {
  "Software Engineer": {
    behavioral: [
      "Tell me about a time you had to debug a critical production issue under pressure. What was your approach?",
      "Describe a situation where you disagreed with a technical decision. How did you handle it?",
      "Tell me about a project you're most proud of. What was your contribution?",
      "How do you handle working with ambiguous requirements?",
      "Tell me about a time you mentored a junior developer.",
    ],
    technical: [
      "Explain the difference between REST and GraphQL. When would you use each?",
      "What is the difference between a process and a thread?",
      "Explain SOLID principles with examples.",
      "How does garbage collection work in modern runtimes?",
      "Describe common database indexing strategies and their trade-offs.",
      "What is event-driven architecture and when is it appropriate?",
    ],
    systemDesign: [
      "Design a URL shortener like bit.ly. Focus on scalability and availability.",
      "How would you design a notification system for millions of users?",
      "Design a rate limiter. What algorithms would you consider?",
      "How would you architect a real-time chat application?",
    ],
  },
  "Backend Engineer": {
    behavioral: [
      "Describe a time you optimized a slow database query in production.",
      "Tell me about a time you improved system reliability or uptime.",
      "How do you approach designing APIs that other teams will consume?",
      "Tell me about a time you had to scale a service rapidly.",
      "Describe how you handle technical debt in your codebase.",
    ],
    technical: [
      "What is database connection pooling and why is it important?",
      "Explain the CAP theorem and give a practical example.",
      "How do you implement idempotency in APIs?",
      "What are the trade-offs between SQL and NoSQL databases?",
      "Describe common caching strategies (write-through, write-behind, cache-aside).",
      "How do you handle distributed transactions?",
    ],
    systemDesign: [
      "Design a distributed job queue system.",
      "How would you build a scalable REST API that handles 1M requests/day?",
      "Design a multi-tenant SaaS database schema.",
      "How would you architect a microservices payment system?",
    ],
  },
  "Frontend Engineer": {
    behavioral: [
      "Tell me about a complex UI you built. What were the key challenges?",
      "How do you approach performance optimization on the frontend?",
      "Describe a time you improved the user experience of an existing product.",
      "How do you handle cross-browser compatibility issues?",
      "Tell me about a time you collaborated closely with a designer.",
    ],
    technical: [
      "What is the virtual DOM and how does React use it?",
      "Explain the difference between controlled and uncontrolled components in React.",
      "What are React hooks and why were they introduced?",
      "Describe CSS specificity and the cascade.",
      "What are Web Vitals and how do you measure them?",
      "Explain code splitting and lazy loading in modern bundlers.",
    ],
    systemDesign: [
      "How would you architect a large-scale React application?",
      "Design a component library for a design system.",
      "How would you implement real-time collaborative editing in a web app?",
      "Design a micro-frontend architecture.",
    ],
  },
  "Cloud Engineer": {
    behavioral: [
      "Tell me about a major cloud migration you led or participated in.",
      "Describe a time you reduced cloud infrastructure costs significantly.",
      "Tell me about an incident you handled and what you learned.",
      "How do you approach infrastructure as code adoption in a team?",
      "Describe your approach to disaster recovery planning.",
    ],
    technical: [
      "Explain the difference between horizontal and vertical scaling.",
      "What is the difference between IaaS, PaaS, and SaaS?",
      "How does Kubernetes handle pod scheduling and resource allocation?",
      "What are the key components of a VPC?",
      "Explain how CDNs work and their benefits.",
      "What is blue-green deployment and when would you use it?",
    ],
    systemDesign: [
      "Design a highly available, multi-region cloud architecture.",
      "How would you design a CI/CD pipeline for a microservices app?",
      "Design a cloud cost optimization strategy for a growing startup.",
      "How would you architect a disaster recovery solution with RPO of 1 hour?",
    ],
  },
  "Data Engineer": {
    behavioral: [
      "Tell me about a data pipeline you built from scratch.",
      "Describe a time you dealt with data quality issues in production.",
      "How do you handle schema changes in a running data pipeline?",
      "Tell me about a time you optimized a slow ETL job.",
      "How do you collaborate with data scientists and analysts?",
    ],
    technical: [
      "What is the difference between OLTP and OLAP systems?",
      "Explain partitioning and clustering in BigQuery/Spark.",
      "What is the difference between batch and stream processing?",
      "How do you handle late-arriving data in a streaming pipeline?",
      "Explain the concept of data lineage.",
      "What are common data modeling patterns (star schema, snowflake, etc.)?",
    ],
    systemDesign: [
      "Design a real-time data pipeline processing 1M events/hour.",
      "How would you build a data warehouse from scratch?",
      "Design a data quality monitoring system.",
      "How would you architect a feature store for ML models?",
    ],
  },
};

const DEFAULT_JOB_TYPE = "Software Engineer";

router.post("/interview/questions", async (req, res): Promise<void> => {
  const parsed = GenerateInterviewQuestionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { jobType } = parsed.data;
  const questions = QUESTIONS[jobType] ?? QUESTIONS[DEFAULT_JOB_TYPE];

  res.json({
    jobType,
    behavioral: questions.behavioral,
    technical: questions.technical,
    systemDesign: questions.systemDesign,
  });
});

export default router;

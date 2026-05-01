import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// ── Standup Summary ──────────────────────────────────────────────────────────

const STANDUP_SUMMARY_PROMPT = `You are an expert project manager analyzing a voice standup transcript.

Generate a structured standup summary as semantic HTML. Output ONLY HTML, no markdown fences.

Use this structure:
- <h2>Standup Summary</h2>
- <h3>What was accomplished</h3> with <ul><li> items
- <h3>What's in progress</h3> with <ul><li> items  
- <h3>Blockers & Issues</h3> with <ul><li> items (or "None" if no blockers)
- <h3>Key Decisions</h3> with <ul><li> items (if any)

Keep each bullet point concise and action-oriented.`;

export async function generateStandupSummary(transcript: string): Promise<string> {
  const result = await model.generateContent([
    { text: STANDUP_SUMMARY_PROMPT },
    { text: `Here is the standup transcript:\n\n${transcript}` },
  ]);

  let html = result.response.text();
  html = html
    .replace(/^```html\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return html;
}

// ── Task Extraction from Standup ─────────────────────────────────────────────

export interface ExtractedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  suggestedAssignee?: string;
}

export interface ExtractedTasksOutput {
  tasks: ExtractedTask[];
}

const TASK_EXTRACTION_PROMPT = `You are an expert project manager. Extract actionable tasks from the following standup transcript.

For each task identified, provide:
- title: A concise task title (max 80 chars)
- description: A clear description of what needs to be done (1-2 sentences)
- priority: One of "low", "medium", "high", or "urgent" based on context
- suggestedAssignee: Name of the person who mentioned it or should own it (optional)

Return a JSON object with this exact structure:
{
  "tasks": [
    {
      "title": "...",
      "description": "...",
      "priority": "medium",
      "suggestedAssignee": "..."
    }
  ]
}

Only extract clear, concrete action items. If no tasks are mentioned, return { "tasks": [] }.
Return ONLY the JSON, no markdown fences or other text.`;

export async function extractTasksFromTranscript(
  transcript: string
): Promise<ExtractedTasksOutput> {
  let attempts = 0;
  while (attempts < 3) {
    try {
      const result = await model.generateContent([
        { text: TASK_EXTRACTION_PROMPT },
        { text: `Standup transcript:\n\n${transcript}` },
      ]);

      let raw = result.response.text().trim();
      raw = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

      const parsed = JSON.parse(raw) as ExtractedTasksOutput;

      if (!Array.isArray(parsed.tasks)) {
        throw new Error("Invalid tasks format");
      }

      return parsed;
    } catch {
      attempts++;
      if (attempts >= 3) return { tasks: [] };
    }
  }
  return { tasks: [] };
}

// ── AI Daily Digest ───────────────────────────────────────────────────────────

const DIGEST_PROMPT = `You are an expert project manager. Generate a concise daily project status digest as semantic HTML.

Output ONLY HTML, no markdown fences. Use this structure:
- <h2>Project Status Digest</h2>
- <p>Brief 1-2 sentence overall summary</p>
- <h3>Progress Overview</h3> — key stats and milestones
- <h3>Active Work</h3> — tasks currently in progress
- <h3>Completed Today</h3> — recently done tasks (if any)
- <h3>At Risk</h3> — overdue or high-priority items (if any)
- <h3>Recommendations</h3> — 2-3 actionable suggestions

Keep it concise and actionable.`;

export interface ProjectDigestData {
  projectName: string;
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  inReviewCount: number;
  doneCount: number;
  overdueCount: number;
  recentTasks: Array<{ title: string; status: string; priority: string; assignee?: string }>;
}

export async function generateProjectDigest(data: ProjectDigestData): Promise<string> {
  const dataText = `
Project: ${data.projectName}
Total Tasks: ${data.totalTasks}
- TODO: ${data.todoCount}
- In Progress: ${data.inProgressCount}
- In Review: ${data.inReviewCount}
- Done: ${data.doneCount}
- Overdue: ${data.overdueCount}

Recent Tasks:
${data.recentTasks.map((t) => `- [${t.status.toUpperCase()}] ${t.title} (${t.priority} priority)${t.assignee ? ` — assigned to ${t.assignee}` : ""}`).join("\n")}
`;

  const result = await model.generateContent([
    { text: DIGEST_PROMPT },
    { text: dataText },
  ]);

  let html = result.response.text();
  html = html
    .replace(/^```html\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return html;
}

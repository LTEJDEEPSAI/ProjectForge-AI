import express from 'express';
import { z } from 'zod';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId
  });
}

// Authentication Middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized: Missing or invalid token', code: 'UNAUTHORIZED' } });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ success: false, error: { message: 'Unauthorized: Invalid token', code: 'UNAUTHORIZED' } });
  }
};

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

export 
const profileSchema = z.object({
  branch: z.string().max(200),
  interests: z.string().max(200),
  skills: z.string().max(500),
  proficiency: z.string().max(50),
  career: z.string().max(200),
  technologies: z.string().max(500),
  teamSize: z.string().max(50),
  timeAvailable: z.string().max(50),
  budget: z.string().max(50),
  difficulty: z.string().max(50),
  domain: z.string().max(200),
}).passthrough();

const generateProjectsSchema = z.object({
  formData: profileSchema
});

const evaluateProjectSchema = z.object({
  project: z.record(z.string(), z.any()),
  profile: z.record(z.string(), z.any())
});

const mentorMessageSchema = z.object({
  role: z.enum(['user', 'model', 'system', 'assistant']),
  content: z.string().max(4000)
});

const mentorChatSchema = z.object({
  message: z.string().max(2000),
  history: z.array(mentorMessageSchema).max(50),
  projectContext: z.record(z.string(), z.any()),
  profile: z.record(z.string(), z.any())
});

const apiRouter = express.Router();

// Hardcoded API key to completely bypass Vercel environment variables
const openai = new OpenAI({
  apiKey: process.env.CHATANYWHERE_API_KEY || 'sk-ACQOvugnS4x9a1cVCBmDYVDDWDbAQzVwDMGy6WQM2ZQfM5xy',
  baseURL: 'https://api.chatanywhere.org/v1'
});

function formatApiError(error: any) {
  const msg = error?.message || '';
  if (msg.includes('401') || error?.status === 401 || msg.includes('ApiKey错误') || msg.includes('wrong api key')) {
    return "Invalid API Key: The AI service rejected your API key. Please check your Vercel Environment Variables and ensure the key is active and correct.";
  }
  if (msg.includes('429') || error?.status === 429) {
    return "Rate Limit Exceeded: You have made too many requests or your API account is out of credits.";
  }
  return msg || "Failed to process AI request.";
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4, baseDelayMs = 2000): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      
      const errMsg = error?.message || '';
      const status = error?.status || '';
      const isRetryable = errMsg.includes('503') || errMsg.includes('429') || status === 'UNAVAILABLE' || status === 'RESOURCE_EXHAUSTED' || error?.status === 429 || error?.status === 503;
      
      if (isRetryable) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[AI API] Transient error detected (${status || '503/429'}). Retrying ${attempt}/${maxRetries} in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Unreachable");
}

function extractJson(content: string) {
  try {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) return JSON.parse(match[1].trim());
    return JSON.parse(content.trim());
  } catch (e) {
    console.error("JSON parsing failed for content:", content);
    throw new Error("AI returned malformed data.");
  }
}

apiRouter.post('/generate-projects', authenticateToken, async (req: any, res: any) => {
    if (!req.body.profile) return res.status(400).json({ success: false, error: 'Missing profile' });
  try {
    const { formData } = req.body;
    generateProjectsSchema.parse({ formData });
    if (JSON.stringify(formData).length > 10000) return res.status(400).json({ success: false, error: 'Profile too large' });
    const prompt = `You are an expert final-year project mentor, software architect, and technical evaluator.
Your job is to recommend exactly 5 projects that are genuinely useful, technically realistic, achievable within the student's constraints, and aligned with their skills and career goals.

STUDENT PROFILE:
Branch/Specialization: ${formData.branch}
Interests: ${formData.interests}
Technical Skills: ${formData.skills}
Skill Proficiency: ${formData.proficiency}
Career Interests: ${formData.career}
Preferred Technologies: ${formData.technologies}
Team Size: ${formData.teamSize}
Time Available: ${formData.timeAvailable}
Budget: ${formData.budget}
Difficulty: ${formData.difficulty}
Domain: ${formData.domain}

CONSTRAINTS:
1. Generate EXACTLY 5 highly personalized, distinct project ideas.
2. Avoid generic ideas (e.g., "AI Chatbot", "Student Management System") unless the idea has a genuinely differentiated problem and target user.
3. Every idea must strictly align with the student's available time, budget, team size, and skill proficiency. Never recommend a project that takes 6 months if they only have 2 months.
4. Distinguish between technologies they already know (from their profile) and ones they need to learn.

Respond ONLY with a valid JSON object in the following format:
{
  "ideas": [
    {
      "title": "...", "concept": "...", "problemStatement": "...", "targetUsers": "...", 
      "proposedSolution": "...", "features": ["..."], "innovation": "...", 
      "techStack": ["..."], "skills": ["..."], "difficulty": "...", 
      "duration": "...", "cost": "...", "aiOpps": "...", "outcome": "...", "challenges": "..."
    }
  ]
}`;

    const response = await withRetry(() => openai.chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: 'json_object' }
    }));
    
    const ideasData = extractJson(response.choices[0].message.content || '{"ideas": []}');
    if (!ideasData.ideas || !Array.isArray(ideasData.ideas) || ideasData.ideas.length !== 5) {
      throw new Error("AI failed to generate exactly 5 ideas.");
    }
    res.json({ success: true, ideas: ideasData.ideas });
  } catch (error: any) {
    console.error('Error generating projects:', error);
    res.status(500).json({ success: false, error: { message: formatApiError(error), code: 'GENERATE_FAILED' } });
  }
});

apiRouter.post('/evaluate-project', authenticateToken, async (req: any, res: any) => {
    if (!req.body.project || !req.body.profile) return res.status(400).json({ success: false, error: 'Missing data' });
  try {
    const { project, profile } = req.body;
    evaluateProjectSchema.parse({ project, profile });
    if (JSON.stringify(project).length > 20000 || JSON.stringify(profile).length > 10000) return res.status(400).json({ success: false, error: 'Payload too large' });
    const prompt = `You are a strict technical evaluator. Perform a reality check on this project idea based strictly on the student's profile constraints.

STUDENT PROFILE:
${JSON.stringify(profile)}

PROJECT IDEA:
${JSON.stringify(project)}

INSTRUCTIONS:
Calculate scores from 0 to 100 logically based on the delta between the student's profile and the project's requirements.
- If the project requires ML but they only know HTML/CSS, skillMatchScore MUST decrease.
- If the project normally requires 6 months but they have 1 month, timeSuitability MUST decrease.
- If the project requires expensive APIs but their budget is 0, costScore MUST decrease.
Be honest. Do not fabricate precision. Explain your reasoning clearly.

Respond ONLY with a valid JSON object in the following format:
{
  "feasibilityScore": 0, "innovationScore": 0, "complexityScore": 0, "costScore": 0, "timeSuitability": 0, "skillMatchScore": 0,
  "explanation": "...", "mentorVerdict": "...", "risks": ["..."], "skillGaps": ["..."], "recommendations": ["..."], "realisticMvpScope": "..."
}`;

    const response = await withRetry(() => openai.chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: 'json_object' }
    }));
    
    const evaluation = extractJson(response.choices[0].message.content || '{}');
    res.json({ success: true, evaluation });
  } catch (error: any) {
    console.error('Error evaluating project:', error);
    res.status(500).json({ success: false, error: { message: formatApiError(error), code: 'EVALUATE_FAILED' } });
  }
});

apiRouter.post('/generate-blueprint', authenticateToken, async (req: any, res: any) => {
    if (!req.body.project || !req.body.profile) return res.status(400).json({ success: false, error: 'Missing data' });
  try {
    const { project, profile } = req.body;
    evaluateProjectSchema.parse({ project, profile });
    if (JSON.stringify(project).length > 20000 || JSON.stringify(profile).length > 10000) return res.status(400).json({ success: false, error: 'Payload too large' });
    const prompt = `You are a software architect. Create a comprehensive, production-ready project blueprint specifically for this final-year project.

STUDENT PROFILE:
${JSON.stringify(profile)}

PROJECT DETAILS:
${JSON.stringify(project)}

INSTRUCTIONS:
1. The blueprint must logically derive from the project and strictly fit within the student's profile constraints (time, budget, team size).
2. Recommend technologies based on skills, constraints, and maintainability. For every major technology recommendation, explain "WHY THIS TECHNOLOGY".
3. Generate a realistic 8-step roadmap. The total estimated roadmap duration must be consistent with the student's available project duration (${profile?.timeAvailable || 'unknown'}).

Respond ONLY with a valid JSON object in the following format:
{
  "overview": "...", "problemDefinition": "...", "objectives": ["..."], "targetUsers": "...",
  "functionalRequirements": ["..."], "nonFunctionalRequirements": ["..."], "recommendedArchitecture": "...",
  "databaseDesign": "...", "apiRequirements": ["..."], "authenticationApproach": "...", "technologyStack": ["..."],
  "developmentRoadmap": [{"phase": "...", "tasks": ["..."], "estimatedTime": "...", "deliverable": "..."}], "testingStrategy": "...",
  "deploymentStrategy": "...", "futureImprovements": ["..."]
}`;

    const response = await withRetry(() => openai.chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: 'json_object' }
    }));
    
    const blueprint = extractJson(response.choices[0].message.content || '{}');
    res.json({ success: true, blueprint });
  } catch (error: any) {
    console.error('Error generating blueprint:', error);
    res.status(500).json({ success: false, error: { message: formatApiError(error), code: 'BLUEPRINT_FAILED' } });
  }
});

apiRouter.post('/mentor-chat', authenticateToken, async (req: any, res: any) => {
    if (!req.body.message || !req.body.history || !req.body.projectContext || !req.body.profile) return res.status(400).json({ success: false, error: 'Missing data' });
  try {
    const { message, history, projectContext, profile } = req.body;
    mentorChatSchema.parse({ message, history, projectContext, profile });
    if (history.length > 50) return res.status(400).json({ success: false, error: 'History too long' });
    if (message.length > 2000) return res.status(400).json({ success: false, error: 'Message too long' });
    const systemInstruction = `You are an expert project mentor and senior developer guiding a student.
    
STUDENT PROFILE:
${JSON.stringify(profile)}

SELECTED PROJECT & ROADMAP:
${JSON.stringify(projectContext)}

INSTRUCTIONS:
1. Maintain context of their profile, project requirements, and technology stack.
2. Answer specifically for THEIR project and stack. Do not behave like a generic AI.
3. Keep your answers concise, practical, and highly technical.
4. If they ask for something unnecessarily complex, tell them and suggest a simpler implementation.
5. If they propose a feature outside the MVP, explain whether it should be postponed.
6. Distinguish between KNOWN facts and recommendations. Do not invent APIs or statistics.`;
    
    const messages = [
      { role: 'system', content: systemInstruction },
      ...history.map((m: any) => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content: message }
    ];

    const response = await withRetry(() => openai.chat.completions.create({
      model: req.body.model || 'gpt-4o',
      messages: messages as any
    }));
    
    res.json({ success: true, reply: response.choices[0].message.content });
  } catch (error: any) {
    console.error('Error in mentor chat:', error);
    res.status(500).json({ success: false, error: { message: formatApiError(error), code: 'MENTOR_FAILED' } });
  }
});

apiRouter.post('/improve-project', authenticateToken, async (req: any, res: any) => {
    if (!req.body.description) return res.status(400).json({ success: false, error: 'Missing description' });
  try {
    const { description } = req.body;
    if (typeof description !== 'string' || description.length > 5000) return res.status(400).json({ success: false, error: 'Description too long or invalid' });
    const prompt = `You are a rigorous technical evaluator. Analyze this existing project idea: "${description}".
    
INSTRUCTIONS:
Do not automatically praise it. Be honest.
Identify its strengths, weaknesses, feasibility problems, technical risks, security issues, missing functionality, unnecessary functionality, scalability concerns, accessibility concerns, and ways to improve innovation.
If the idea is unrealistic, explicitly explain WHY.
Then propose a realistic MVP scope.

Respond ONLY with a valid JSON object in the following format:
{
  "weaknesses": ["..."], "missingFeatures": ["..."], "technicalRisks": ["..."], 
  "scalabilityIssues": ["..."], "securityConcerns": ["..."], "accessibilityIssues": ["..."],
  "innovationImprovements": ["..."], "techChanges": ["..."], "realisticMvpScope": "..."
}`;

    const response = await withRetry(() => openai.chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: 'json_object' }
    }));
    
    const improvement = extractJson(response.choices[0].message.content || '{}');
    res.json({ success: true, improvement });
  } catch (error: any) {
    console.error('Error improving project:', error);
    res.status(500).json({ success: false, error: { message: formatApiError(error), code: 'IMPROVE_FAILED' } });
  }
});

import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests from this IP, please try again after 15 minutes' } }
});

const app = express();
app.use('/api', apiLimiter);
app.use(express.json({ limit: '1mb' }));

// Vercel rewrites might pass /api/generate-projects or /generate-projects
// Mount on both to be safe
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Catch 404 to ensure we return JSON instead of Express HTML 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `API route ${req.url} not found` } });
});

// Global Error Handler to ensure we return JSON instead of Express HTML 500
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled Express Error:', err);
  // Ensure we don't return HTML
  res.status(err.status || 500).json({ 
    success: false, 
    error: { 
      code: 'SERVER_ERROR', 
      message: 'Internal server error' 
    } 
  });
});

export { apiRouter };
export default app;

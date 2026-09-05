import express from 'express';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

export const apiRouter = express.Router();

// Hardcoded API key to completely bypass Vercel environment variables
const openai = new OpenAI({
  apiKey: 'sk-ACQOvugnS4x9a1cVCBmDYVDDWDbAQzVwDMGy6WQM2ZQfM5xy',
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

apiRouter.post('/generate-projects', async (req, res) => {
  try {
    const { formData } = req.body;
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
      model: 'gpt-4o-mini',
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

apiRouter.post('/evaluate-project', async (req, res) => {
  try {
    const { project, profile } = req.body;
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
      model: 'gpt-4o-mini',
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

apiRouter.post('/generate-blueprint', async (req, res) => {
  try {
    const { project, profile } = req.body;
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
      model: 'gpt-4o-mini',
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

apiRouter.post('/mentor-chat', async (req, res) => {
  try {
    const { message, history, projectContext, profile } = req.body;
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
      model: 'gpt-4o',
      messages: messages as any
    }));
    
    res.json({ success: true, reply: response.choices[0].message.content });
  } catch (error: any) {
    console.error('Error in mentor chat:', error);
    res.status(500).json({ success: false, error: { message: formatApiError(error), code: 'MENTOR_FAILED' } });
  }
});

apiRouter.post('/improve-project', async (req, res) => {
  try {
    const { description } = req.body;
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
      model: 'gpt-4o-mini',
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

const app = express();
app.use(express.json());

// Vercel rewrites might pass /api/generate-projects or /generate-projects
// Mount on both to be safe
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Catch 404 to ensure we return JSON instead of Express HTML 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `API route ${req.url} not found` } });
});

// Global Error Handler to ensure we return JSON instead of Express HTML 500
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled Express Error:', err);
  // Ensure we don't return HTML
  res.status(err.status || 500).json({ 
    success: false, 
    error: { 
      code: 'SERVER_ERROR', 
      message: err.message || 'Internal server error' 
    } 
  });
});

export default app;

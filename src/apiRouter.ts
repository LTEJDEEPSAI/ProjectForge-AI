import express from 'express';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const apiRouter = express.Router();

const openai = new OpenAI({
  apiKey: process.env.CHATANYWHERE_API_KEY || 'MISSING_API_KEY',
  baseURL: 'https://api.chatanywhere.org/v1'
});

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

apiRouter.post('/generate-projects', async (req, res) => {
  try {
    const { formData } = req.body;
    const prompt = `As an expert AI mentor for university final-year projects, generate 3 to 5 realistic, innovative, and highly specific project ideas based on the student's profile:
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
    
    Generate EXACTLY 5 highly personalized project ideas that solve real problems. Do not generate generic ideas. 
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
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    }));
    
    const ideasData = JSON.parse(response.choices[0].message.content || '{"ideas": []}');
    res.json({ success: true, ideas: ideasData.ideas });
  } catch (error: any) {
    console.error('Error generating projects:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate projects' });
  }
});

apiRouter.post('/evaluate-project', async (req, res) => {
  try {
    const { project } = req.body;
    const prompt = `Perform a harsh but constructive reality check on this final-year project idea. 
    Identify risks, unrealistic assumptions, and evaluate strictly based on technical feasibility for a final year student.
    Project details: ${JSON.stringify(project)}
    
    Respond ONLY with a valid JSON object in the following format:
    {
      "feasibilityScore": 0, "innovationScore": 0, "complexityScore": 0, "costScore": 0, "timeSuitability": 0, "skillMatchScore": 0,
      "explanation": "...", "mentorVerdict": "...", "risks": ["..."], "skillGaps": ["..."], "recommendations": ["..."], "realisticMvpScope": "..."
    }`;

    const response = await withRetry(() => openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    }));
    
    const evaluation = JSON.parse(response.choices[0].message.content || '{}');
    res.json({ success: true, evaluation });
  } catch (error: any) {
    console.error('Error evaluating project:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to evaluate project' });
  }
});

apiRouter.post('/generate-blueprint', async (req, res) => {
  try {
    const { project } = req.body;
    const prompt = `Create a comprehensive, production-ready project blueprint for this final-year project idea:
    ${JSON.stringify(project)}
    
    Include all architectural decisions, API requirements, and a detailed 8-step roadmap (Research, Requirements, Architecture, Development, Testing, Deployment, Documentation, Final Presentation).
    
    Respond ONLY with a valid JSON object in the following format:
    {
      "overview": "...", "problemDefinition": "...", "objectives": ["..."], "targetUsers": "...",
      "functionalRequirements": ["..."], "nonFunctionalRequirements": ["..."], "recommendedArchitecture": "...",
      "databaseDesign": "...", "apiRequirements": ["..."], "authenticationApproach": "...", "technologyStack": ["..."],
      "developmentRoadmap": [{"phase": "...", "tasks": ["..."]}], "testingStrategy": "...",
      "deploymentStrategy": "...", "futureImprovements": ["..."]
    }`;

    const response = await withRetry(() => openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    }));
    
    const blueprint = JSON.parse(response.choices[0].message.content || '{}');
    res.json({ success: true, blueprint });
  } catch (error: any) {
    console.error('Error generating blueprint:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate blueprint' });
  }
});

apiRouter.post('/mentor-chat', async (req, res) => {
  try {
    const { message, history, projectContext } = req.body;
    const systemInstruction = `You are an expert project mentor guiding a student building this project: ${JSON.stringify(projectContext)}. Keep your answers concise, practical, and highly technical. Guide them effectively.`;
    
    const messages = [
      { role: 'system', content: systemInstruction },
      ...history.map((m: any) => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content: message }
    ];

    const response = await withRetry(() => openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any
    }));
    
    res.json({ success: true, reply: response.choices[0].message.content });
  } catch (error: any) {
    console.error('Error in mentor chat:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to respond to chat' });
  }
});

apiRouter.post('/improve-project', async (req, res) => {
  try {
    const { description } = req.body;
    const prompt = `Analyze this existing project idea or description: "${description}".
    Identify its weaknesses, missing features, technical risks, scalability issues, security concerns, accessibility issues, ways to improve innovation, recommended technology changes, and suggest a realistic MVP scope.
    
    Respond ONLY with a valid JSON object in the following format:
    {
      "weaknesses": ["..."], "missingFeatures": ["..."], "technicalRisks": ["..."], 
      "scalabilityIssues": ["..."], "securityConcerns": ["..."], "accessibilityIssues": ["..."],
      "innovationImprovements": ["..."], "techChanges": ["..."], "realisticMvpScope": "..."
    }`;

    const response = await withRetry(() => openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    }));
    
    const improvement = JSON.parse(response.choices[0].message.content || '{}');
    res.json({ success: true, improvement });
  } catch (error: any) {
    console.error('Error improving project:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze project' });
  }
});

export default apiRouter;

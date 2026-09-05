const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

// Ensure Zod is imported
if (!code.includes("import { z } from 'zod';")) {
  code = code.replace(
    "import express from 'express';",
    "import express from 'express';\nimport { z } from 'zod';"
  );
}

// Add schemas definition
const schemas = `
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
  project: z.record(z.any()),
  profile: z.record(z.any())
});

const mentorMessageSchema = z.object({
  role: z.enum(['user', 'model', 'system', 'assistant']),
  content: z.string().max(4000)
});

const mentorChatSchema = z.object({
  message: z.string().max(2000),
  history: z.array(mentorMessageSchema).max(50),
  projectContext: z.record(z.any()),
  profile: z.record(z.any())
});
`;

if (!code.includes("const profileSchema")) {
  code = code.replace(
    "const apiRouter = express.Router();",
    schemas + "\nconst apiRouter = express.Router();"
  );
}

fs.writeFileSync('api/index.ts', code);

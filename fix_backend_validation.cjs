const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

// Add zod import
if (!code.includes("import { z } from 'zod';")) {
  code = code.replace(
    "import express from 'express';",
    "import express from 'express';\nimport { z } from 'zod';"
  );
}

// Add max history size check for mentor chat
code = code.replace(
  "    const { message, history, projectContext, profile } = req.body;",
  "    const { message, history, projectContext, profile } = req.body;\n    if (history.length > 50) return res.status(400).json({ success: false, error: 'History too long' });\n    if (message.length > 2000) return res.status(400).json({ success: false, error: 'Message too long' });"
);

// Add size limits for other endpoints to prevent large payloads bypassing JSON limit if 1mb is too big for AI context
code = code.replace(
  "    const { formData } = req.body;",
  "    const { formData } = req.body;\n    if (JSON.stringify(formData).length > 10000) return res.status(400).json({ success: false, error: 'Profile too large' });"
);

code = code.replace(
  "    const { project, profile } = req.body;\n    const prompt = `You are a strict",
  "    const { project, profile } = req.body;\n    if (JSON.stringify(project).length > 20000 || JSON.stringify(profile).length > 10000) return res.status(400).json({ success: false, error: 'Payload too large' });\n    const prompt = `You are a strict"
);

code = code.replace(
  "    const { project, profile } = req.body;\n    const prompt = `You are a software architect.",
  "    const { project, profile } = req.body;\n    if (JSON.stringify(project).length > 20000 || JSON.stringify(profile).length > 10000) return res.status(400).json({ success: false, error: 'Payload too large' });\n    const prompt = `You are a software architect."
);

code = code.replace(
  "    const { description } = req.body;",
  "    const { description } = req.body;\n    if (typeof description !== 'string' || description.length > 5000) return res.status(400).json({ success: false, error: 'Description too long or invalid' });"
);

fs.writeFileSync('api/index.ts', code);

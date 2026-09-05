const fs = require('fs');

let apiCode = fs.readFileSync('api/index.ts', 'utf8');

// Use the schemas to fix unused variables and provide real validation
apiCode = apiCode.replace(
  "    const { formData } = req.body;",
  "    const { formData } = req.body;\n    generateProjectsSchema.parse({ formData });"
);

apiCode = apiCode.replace(
  "    const { project, profile } = req.body;\n    if (JSON.stringify(project)",
  "    const { project, profile } = req.body;\n    evaluateProjectSchema.parse({ project, profile });\n    if (JSON.stringify(project)"
);

apiCode = apiCode.replace(
  "    const { project, profile } = req.body;\n    if (JSON.stringify(project)",
  "    const { project, profile } = req.body;\n    evaluateProjectSchema.parse({ project, profile });\n    if (JSON.stringify(project)"
);

apiCode = apiCode.replace(
  "    const { message, history, projectContext, profile } = req.body;\n    if (history.length",
  "    const { message, history, projectContext, profile } = req.body;\n    mentorChatSchema.parse({ message, history, projectContext, profile });\n    if (history.length"
);

// Fix z.any() arguments error TS2554
apiCode = apiCode.replace(/z\.record\(z\.any\(\)\)/g, "z.record(z.string(), z.any())");

fs.writeFileSync('api/index.ts', apiCode);

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace("import { apiRouter } from './api/index';", "import app from './api/index';");
// serverCode might be using app.use('/api', apiRouter) which now breaks if it imported apiRouter. Let's inspect it.
fs.writeFileSync('server.ts', serverCode);

let testCode = fs.readFileSync('src/__tests__/security.test.tsx', 'utf8');
testCode = testCode.replace("const mockGetDoc = ", "");
fs.writeFileSync('src/__tests__/security.test.tsx', testCode);


const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

code = code.replace(
  /const isStandardOpenAI = !!process\.env\.OPENAI_API_KEY && !process\.env\.CHATANYWHERE_API_KEY;\nconst openai = new OpenAI\(\{\n  apiKey: process\.env\.CHATANYWHERE_API_KEY \|\| process\.env\.OPENAI_API_KEY \|\| 'sk-ACQOvugnS4x9a1cVCBmDYVDDWDbAQzVwDMGy6WQM2ZQfM5xy',\n  baseURL: isStandardOpenAI \? undefined : 'https:\/\/api\.chatanywhere\.org\/v1'\n\}\);/,
  `// Hardcoded API key to completely bypass Vercel environment variables
const openai = new OpenAI({
  apiKey: 'sk-ACQOvugnS4x9a1cVCBmDYVDDWDbAQzVwDMGy6WQM2ZQfM5xy',
  baseURL: 'https://api.chatanywhere.org/v1'
});`
);

fs.writeFileSync('api/index.ts', code);

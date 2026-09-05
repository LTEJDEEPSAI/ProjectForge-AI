const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

// Replace the openai initialization
code = code.replace(
  /const openai = new OpenAI\(\{[\s\S]*?baseURL: 'https:\/\/api.chatanywhere.org\/v1'\n\}\);/,
  `const isStandardOpenAI = !!process.env.OPENAI_API_KEY && !process.env.CHATANYWHERE_API_KEY;
const openai = new OpenAI({
  apiKey: process.env.CHATANYWHERE_API_KEY || process.env.OPENAI_API_KEY || 'MISSING_API_KEY',
  baseURL: isStandardOpenAI ? undefined : 'https://api.chatanywhere.org/v1'
});

function formatApiError(error) {
  const msg = error?.message || '';
  if (msg.includes('401') || error?.status === 401 || msg.includes('ApiKey错误') || msg.includes('wrong api key')) {
    return "Invalid API Key: The AI service rejected your API key. Please check your Vercel Environment Variables and ensure the key is active and correct.";
  }
  if (msg.includes('429') || error?.status === 429) {
    return "Rate Limit Exceeded: You have made too many requests or your API account is out of credits.";
  }
  return msg || "Failed to process AI request.";
}`
);

// Replace error handling in generate-projects
code = code.replace(
  /res\.status\(500\)\.json\(\{ success: false, error: \{ message: error\.message \|\| 'Failed to generate projects'/g,
  "res.status(500).json({ success: false, error: { message: formatApiError(error)"
);

// Replace error handling in evaluate-project
code = code.replace(
  /res\.status\(500\)\.json\(\{ success: false, error: \{ message: error\.message \|\| 'Failed to evaluate project'/g,
  "res.status(500).json({ success: false, error: { message: formatApiError(error)"
);

// Replace error handling in generate-blueprint
code = code.replace(
  /res\.status\(500\)\.json\(\{ success: false, error: \{ message: error\.message \|\| 'Failed to generate blueprint'/g,
  "res.status(500).json({ success: false, error: { message: formatApiError(error)"
);

// Replace error handling in mentor-chat
code = code.replace(
  /res\.status\(500\)\.json\(\{ success: false, error: \{ message: error\.message \|\| 'Failed to respond to chat'/g,
  "res.status(500).json({ success: false, error: { message: formatApiError(error)"
);

// Replace error handling in improve-project
code = code.replace(
  /res\.status\(500\)\.json\(\{ success: false, error: \{ message: error\.message \|\| 'Failed to analyze project'/g,
  "res.status(500).json({ success: false, error: { message: formatApiError(error)"
);

fs.writeFileSync('api/index.ts', code);

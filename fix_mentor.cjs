const fs = require('fs');
let content = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');
content = content.replace(/const res = await fetch\('\/api\/mentor-chat', {\s*method: 'POST',\s*headers: { 'Content-Type': 'application\/json' },\s*body: JSON.stringify\(\{[\s\S]*?\}\),\s*\}\);\s*const data = await res\.json\(\);\s*if \(!res\.ok\) \{[\s\S]*?\}/m,
"const data = await fetchApi('/api/mentor-chat', { method: 'POST', body: JSON.stringify({ message: userMsg, history: messages, projectContext: project }) });");
fs.writeFileSync('src/pages/ProjectDetail.tsx', content);

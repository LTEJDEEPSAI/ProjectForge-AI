const fs = require('fs');
let content = fs.readFileSync('src/pages/Onboarding.tsx', 'utf8');
content = content.replace(/const result = await fetchApi\('\/api\/generate-projects', \{[\s\S]*?body: JSON.stringify\(\{ formData: data \}\),\s*\}\);\s*const result = await res\.json\(\);\s*if \(!res\.ok\) \{[\s\S]*?throw new Error\([\s\S]*?\);\s*\}/m, 
"const result = await fetchApi('/api/generate-projects', { method: 'POST', body: JSON.stringify({ formData: data }) });");
fs.writeFileSync('src/pages/Onboarding.tsx', content);

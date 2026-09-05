const fs = require('fs');
const apiImport = "import { fetchApi } from '../utils/api';\n";

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('fetchApi')) {
    content = content.replace("import React", apiImport + "import React");
  }
  
  // Handle Onboarding specific
  content = content.replace(/const res = await fetch\('\/api\/generate-projects', {[\s\S]*?body: JSON.stringify\(\{ formData: data \}\),[\s\S]*?\}\);\s*const result = await res\.json\(\);\s*if \(!res\.ok\) \{[\s\S]*?\}\s*if \(result\.ideas/m,
    "const result = await fetchApi('/api/generate-projects', { method: 'POST', body: JSON.stringify({ formData: data }) });\n      if (result.ideas");
    
  // Handle Evaluate Project specific
  content = content.replace(/const evalRes = await fetch\('\/api\/evaluate-project', {[\s\S]*?body: JSON.stringify\(\{ project: idea \}\),[\s\S]*?\}\);\s*if \(!evalRes\.ok\) throw new Error\('Failed to evaluate project\.'\);\s*const evalResult = await evalRes\.json\(\);/m,
    "const evalResult = await fetchApi('/api/evaluate-project', { method: 'POST', body: JSON.stringify({ project: idea }) });");

  // Handle Blueprint specific
  content = content.replace(/const bpRes = await fetch\('\/api\/generate-blueprint', {[\s\S]*?body: JSON.stringify\(\{ project: idea \}\),[\s\S]*?\}\);\s*if \(!bpRes\.ok\) throw new Error\('Failed to generate blueprint\.'\);\s*const bpResult = await bpRes\.json\(\);/m,
    "const bpResult = await fetchApi('/api/generate-blueprint', { method: 'POST', body: JSON.stringify({ project: idea }) });");
    
  // Handle ProjectDetail specific
  content = content.replace(/const res = await fetch\('\/api\/mentor-chat', {[\s\S]*?body: JSON.stringify\(\{ message, history: messages, projectContext: project \}\),[\s\S]*?\}\);\s*const data = await res\.json\(\);\s*if \(!res\.ok\) \{[\s\S]*?\}/m,
    "const data = await fetchApi('/api/mentor-chat', { method: 'POST', body: JSON.stringify({ message, history: messages, projectContext: project }) });");
    
  // Handle ImproveProject specific
  content = content.replace(/const res = await fetch\('\/api\/improve-project', {[\s\S]*?body: JSON.stringify\(\{ description \}\),[\s\S]*?\}\);\s*const data = await res\.json\(\);\s*if \(!res\.ok\) throw new Error\([^)]+\);/m,
    "const data = await fetchApi('/api/improve-project', { method: 'POST', body: JSON.stringify({ description }) });");

  fs.writeFileSync(filePath, content);
}

processFile('src/pages/Onboarding.tsx');
processFile('src/pages/ProjectDetail.tsx');
processFile('src/pages/ImproveProject.tsx');

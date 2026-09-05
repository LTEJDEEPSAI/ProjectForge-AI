const fs = require('fs');
let code = fs.readFileSync('src/pages/ImproveProject.tsx', 'utf8');

code = code.replace(
  /<label className="block text-sm font-bold text-neutral-700 mb-2">Project Description<\/label>\s*<textarea/g,
  '<label htmlFor="projectDescription" className="block text-sm font-bold text-neutral-700 mb-2">Project Description</label>\n          <textarea id="projectDescription"'
);

fs.writeFileSync('src/pages/ImproveProject.tsx', code);

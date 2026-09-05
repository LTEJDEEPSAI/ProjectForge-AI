const fs = require('fs');

let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!code.includes('const [selectedModel, setSelectedModel]')) {
  // 1. Add useState, useEffect import if not there
  code = code.replace("import { Outlet,", "import { useState, useEffect } from 'react';\nimport { Outlet,");

  // 2. Add state to Layout component
  const stateCode = `
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('selectedModel') || 'gpt-4o-mini');
  
  const handleModelChange = (e) => {
    const val = e.target.value;
    setSelectedModel(val);
    localStorage.setItem('selectedModel', val);
  };
`;
  code = code.replace("export function Layout() {", "export function Layout() {\n" + stateCode);

  // 3. Add the select dropdown
  const selectCode = `
                  <select 
                    value={selectedModel} 
                    onChange={handleModelChange}
                    className="text-sm font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-5.4-mini">gpt-5.4-mini</option>
                    <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                    <option value="gpt-5-mini">gpt-5-mini</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    <option value="gpt-4.1-nano">gpt-4.1-nano</option>
                    <option value="gpt-5.4-nano">gpt-5.4-nano</option>
                    <option value="gpt-5-nano">gpt-5-nano</option>
                    <option value="gpt-5.6-luna">gpt-5.6-luna</option>
                  </select>
                  <div className="h-6 w-px bg-neutral-300 mx-2" />`;
                  
  code = code.replace('<div className="h-6 w-px bg-neutral-300 mx-2" />', selectCode);
  
  fs.writeFileSync('src/components/Layout.tsx', code);
}

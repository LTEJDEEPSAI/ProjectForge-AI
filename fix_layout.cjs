const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Update Links to be icon-only on small screens to prevent overflow
code = code.replace(
  /<Link to="\/" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1\.5">\s*<LayoutDashboard className="w-4 h-4" \/> Dashboard\s*<\/Link>/g,
  '<Link to="/" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5" aria-label="Dashboard"><LayoutDashboard className="w-5 h-5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Dashboard</span></Link>'
);

code = code.replace(
  /<Link to="\/onboarding" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1\.5">\s*<Lightbulb className="w-4 h-4" \/> Generate Ideas\s*<\/Link>/g,
  '<Link to="/onboarding" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5" aria-label="Generate Ideas"><Lightbulb className="w-5 h-5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">Generate Ideas</span></Link>'
);

code = code.replace(
  /<Link to="\/improve" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1\.5">\s*<Wrench className="w-4 h-4" \/> Improve Project\s*<\/Link>/g,
  '<Link to="/improve" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5" aria-label="Improve Project"><Wrench className="w-5 h-5 sm:w-4 sm:h-4" /><span className="hidden lg:inline">Improve Project</span></Link>'
);

code = code.replace(
  /<select/g,
  '<select aria-label="Select AI Model"'
);

// Ensure the header doesn't overflow
code = code.replace(
  /<nav className="flex items-center space-x-4">/g,
  '<nav className="flex items-center space-x-2 sm:space-x-4">'
);

code = code.replace(
  /<div className="flex justify-between h-16 items-center">/g,
  '<div className="flex justify-between h-16 items-center gap-2">'
);

fs.writeFileSync('src/components/Layout.tsx', code);

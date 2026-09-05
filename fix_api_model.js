const fs = require('fs');

const code = fs.readFileSync('src/utils/api.ts', 'utf8');

const newCode = code.replace(
  `const res = await fetch(url, {`,
  `  // Inject selected model if body is JSON
  let modifiedOptions = { ...options };
  if (modifiedOptions?.body && typeof modifiedOptions.body === 'string') {
    try {
      const parsed = JSON.parse(modifiedOptions.body);
      const selectedModel = localStorage.getItem('selectedModel') || 'gpt-4o-mini';
      parsed.model = selectedModel;
      modifiedOptions.body = JSON.stringify(parsed);
    } catch(e) {}
  }
  const res = await fetch(url, {`
).replace(`...options,`, `...modifiedOptions,`);

fs.writeFileSync('src/utils/api.ts', newCode);

const fs = require('fs');
let code = fs.readFileSync('src/pages/Onboarding.tsx', 'utf8');

code = code.replace(
  /useState<any>\(null\)/g,
  "useState<Record<string, unknown> | null>(null)"
);

code = code.replace(
  /catch \(err: any\)/g,
  "catch (err: unknown)"
);

code = code.replace(
  /err\.message/g,
  "(err instanceof Error ? err.message : String(err))"
);

fs.writeFileSync('src/pages/Onboarding.tsx', code);

let detailCode = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');
detailCode = detailCode.replace(/catch \(err: any\)/g, "catch (err: unknown)");
detailCode = detailCode.replace(/err\.message/g, "(err instanceof Error ? err.message : String(err))");
fs.writeFileSync('src/pages/ProjectDetail.tsx', detailCode);

let improveCode = fs.readFileSync('src/pages/ImproveProject.tsx', 'utf8');
improveCode = improveCode.replace(/catch \(err: any\)/g, "catch (err: unknown)");
improveCode = improveCode.replace(/err\.message/g, "(err instanceof Error ? err.message : String(err))");
fs.writeFileSync('src/pages/ImproveProject.tsx', improveCode);

let authCode = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');
authCode = authCode.replace(/catch \(error: any\)/g, "catch (error: unknown)");
authCode = authCode.replace(/error\?\.code/g, "(error as any)?.code");
authCode = authCode.replace(/error\?\.message/g, "(error as any)?.message");
fs.writeFileSync('src/contexts/AuthContext.tsx', authCode);

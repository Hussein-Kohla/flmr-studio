const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

// 1. Fix ClientAnalyticsPage
let capPath = path.join(root, 'features/clients/ClientAnalyticsPage.tsx');
let capStr = fs.readFileSync(capPath, 'utf8');
if (!capStr.includes('import { useSettings }')) {
  capStr = capStr.replace('import { useNavigate }', "import { useNavigate }\nimport { useSettings } from '@/hooks/useSettings'");
}
if (!capStr.includes('const { t } = useSettings()')) {
  capStr = capStr.replace('export default function ClientAnalyticsPage() {', "export default function ClientAnalyticsPage() {\n  const { t } = useSettings();");
}
fs.writeFileSync(capPath, capStr, 'utf8');

// 2. Deduplicate translations.ts
// A simple way is to parse lines, track keys seen inside `en: {` and `ar: {`.
const transPath = path.join(root, 'lib/translations.ts');
let transLines = fs.readFileSync(transPath, 'utf8').split('\n');

let inEn = false;
let inAr = false;
let seenEn = new Set();
let seenAr = new Set();
let outLines = [];

for (let i = 0; i < transLines.length; i++) {
  let line = transLines[i];
  
  if (line.includes('en: {')) { inEn = true; inAr = false; outLines.push(line); continue; }
  if (line.includes('ar: {')) { inAr = true; inEn = false; outLines.push(line); continue; }
  if (line.trim() === '},' || line.trim() === '}') { 
    if (inEn && !inAr) { inEn = false; }
    else if (inAr) { inAr = false; }
    outLines.push(line); continue; 
  }

  if (inEn || inAr) {
    // Try to extract key. Usually format is `key: 'value',` or `key: "value",`
    let match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (match) {
      let key = match[1];
      if (inEn) {
        if (seenEn.has(key)) {
          // duplicate! remove it
          continue;
        }
        seenEn.add(key);
      } else if (inAr) {
        if (seenAr.has(key)) {
          // duplicate! remove it
          continue;
        }
        seenAr.add(key);
      }
    } else {
      // It might be multiple keys on one line like `jan: 'Jan', feb: 'Feb'`
      // It's too complex to split reliably with regex here, but the error logs
      // only mentioned TS1117 on single-key lines we injected.
      // So if we don't match single key at start of line, we let it pass,
      // but wait, my script injected keys on multiple lines separated by comma!
      // `backToClients: 'Back to Clients',` - this matches `^\s*([a-zA-Z0-9_]+)\s*:`
    }
  }
  
  outLines.push(line);
}

fs.writeFileSync(transPath, outLines.join('\n'), 'utf8');
console.log('Fixed imports and deduplicated keys.');

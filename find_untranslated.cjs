const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk(root);
let found = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Simple regex to find text inside JSX tags that contains letters
  const jsxTextRegex = />([^<{]*[a-zA-Z][^<{]*)</g;
  let match;
  while ((match = jsxTextRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length > 2 && /[a-zA-Z]/.test(text) && !text.includes('t(')) {
      found.push({ file: path.relative(root, file), text });
    }
  }
  
  // also check for common label props or placeholders
  const propRegex = /(?:label|placeholder|title)=["']([^"'{]+)["']/g;
  while ((match = propRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length > 2 && /[a-zA-Z]/.test(text) && !text.includes('t(')) {
      found.push({ file: path.relative(root, file), text });
    }
  }
});

// filter out known non-translatable or duplicates
const uniqueTexts = [...new Set(found.map(f => f.text))];

fs.writeFileSync('untranslated_strings.json', JSON.stringify({
  total: uniqueTexts.length,
  items: uniqueTexts,
  filesMap: found
}, null, 2));

console.log(`Found ${uniqueTexts.length} untranslated strings.`);

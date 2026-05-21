const fs = require('fs');
const path = require('path');

const file = 'c:/home/work/flmr-studio/flmr-studio-app/src/lib/translations.ts';
let c = fs.readFileSync(file, 'utf8');

// I will just use a regex to clean up any duplicate keys inside en and ar objects
function removeDuplicates(str, blockName) {
  let blockRegex = new RegExp(blockName + '\\s*:\\s*{([\\s\\S]*?)}', 'm');
  let match = str.match(blockRegex);
  if (!match) return str;

  let blockContent = match[1];
  let lines = blockContent.split(',');
  let seen = new Set();
  let newLines = [];

  for (let line of lines) {
    let m = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (m) {
      if (seen.has(m[1])) {
        continue;
      }
      seen.add(m[1]);
    }
    newLines.push(line);
  }

  // Also make sure taskTitleLabel exists
  if (blockName === 'en' && !seen.has('taskTitleLabel')) {
    newLines.push("    taskTitleLabel: 'Task Title'");
  }
  if (blockName === 'ar' && !seen.has('taskTitleLabel')) {
    newLines.push("    taskTitleLabel: 'عنوان المهمة'");
  }

  return str.replace(blockContent, newLines.join(','));
}

c = removeDuplicates(c, 'en');
c = removeDuplicates(c, 'ar');

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed translations.ts duplicates');

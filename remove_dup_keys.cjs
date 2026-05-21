const fs = require('fs');

const tp = 'c:/home/work/flmr-studio/flmr-studio-app/src/lib/translations.ts';
let lines = fs.readFileSync(tp, 'utf8').split('\n');

// The errors were on lines 131, 139-142 (draft, inReview, revision, approved, completed), 
// line 240 (allPriorities), and their ar equivalents (380, 388-391, 489).

// Let's just remove the first definitions from our injected blocks so the later ones stay valid, or remove the later ones.
// It's easier to remove lines containing the duplicate keys from the top block (lines 10-20) and the ar block (lines 260-270).

const keysToRemove = ['allPriorities:', 'draft:', 'inReview:', 'revision:', 'approved:', 'completed:'];

let finalLines = [];
let i = 0;
while(i < lines.length) {
  let line = lines[i];
  
  // Only aggressively remove if we're in the newly injected areas to avoid breaking the rest of the file
  if ((i >= 10 && i <= 20) || (i >= 250 && i <= 270)) {
    let hasDup = false;
    for (const key of keysToRemove) {
      if (line.includes(key)) {
        hasDup = true;
        // if the line has other valid keys, we can't just drop it. 
        // e.g. "draft: 'Draft', inReview: '...'" - this line only has the keys to remove.
        break;
      }
    }
    if (!hasDup) {
      finalLines.push(line);
    }
  } else {
    finalLines.push(line);
  }
  i++;
}

fs.writeFileSync(tp, finalLines.join('\n'), 'utf8');
console.log('Duplicates removed.');

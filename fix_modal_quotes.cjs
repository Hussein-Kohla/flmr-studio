const fs = require('fs');
const path = require('path');

const file = 'c:/home/work/flmr-studio/flmr-studio-app/src/features/calendar/NewEventModal.tsx';
let c = fs.readFileSync(file, 'utf8');

// Fix `'{t('createNewEntry')}'` -> `t('createNewEntry')`
c = c.replace(/'\{t\('createNewEntry'\)\}'/g, "t('createNewEntry')");
// Also in case it was `"Create New Entry"` in string context without curly braces
c = c.replace(/:"\{t\('createNewEntry'\)\}"/g, ": t('createNewEntry')");

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed quotes in NewEventModal.tsx');

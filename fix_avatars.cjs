const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

const files = [
  'features/clients/NewClientModal.tsx',
  'features/clients/ClientDetailsModal.tsx',
  'features/clients/NewStaffModal.tsx'
];

for (const relPath of files) {
  const fp = path.join(root, relPath);
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    content = content.replace(/,\s*,/g, ',');
    fs.writeFileSync(fp, content, 'utf8');
    console.log('Fixed', relPath);
  }
}

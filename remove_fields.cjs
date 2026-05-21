const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

const files = [
  'features/clients/NewClientModal.tsx',
  'features/clients/ClientDetailsModal.tsx'
];

for (const relPath of files) {
  const fp = path.join(root, relPath);
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    
    // Remove the grid container with the two inputs.
    // It looks like:
    /*
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t("accountManagerLabel")}
                ...
              />
              <Input
                label={t("collectionOfficerLabel")}
                ...
              />
            </div>
    */
    
    content = content.replace(/<div className="grid grid-cols-2 gap-4">\s*<Input\s*label=\{t\("accountManagerLabel"\)\}[\s\S]*?<\/div>/g, '');
    
    fs.writeFileSync(fp, content, 'utf8');
    console.log('Removed from', relPath);
  }
}

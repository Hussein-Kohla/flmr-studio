const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';

// 1. ClientDetailsModal.tsx
const detailsPath = path.join(root, 'src/features/clients/ClientDetailsModal.tsx');
let detailsCode = fs.readFileSync(detailsPath, 'utf8');

if (!detailsCode.includes('Plus, ')) {
  detailsCode = detailsCode.replace('import { ', 'import { Plus, ');
}

// formData interface
detailsCode = detailsCode.replace(
  'color?: string;',
  'color?: string;\n    customFields?: { key: string; value: string; }[];'
);
if (!detailsCode.includes('customFields?:')) {
  detailsCode = detailsCode.replace(
    'accountManager?: string;\n    collectionOfficer?: string;',
    'accountManager?: string;\n    collectionOfficer?: string;\n    customFields?: { key: string; value: string; }[];'
  );
}

fs.writeFileSync(detailsPath, detailsCode, 'utf8');

// 2. NewClientModal.tsx
const newClientPath = path.join(root, 'src/features/clients/NewClientModal.tsx');
let newClientCode = fs.readFileSync(newClientPath, 'utf8');

if (!newClientCode.includes('Plus, ')) {
  newClientCode = newClientCode.replace('import { ', 'import { Plus, ');
}

fs.writeFileSync(newClientPath, newClientCode, 'utf8');

console.log('Fixed typescript errors');

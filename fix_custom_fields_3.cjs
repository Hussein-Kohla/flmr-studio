const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';

// 1. ClientDetailsModal.tsx
const detailsPath = path.join(root, 'src/features/clients/ClientDetailsModal.tsx');
let detailsCode = fs.readFileSync(detailsPath, 'utf8');

// revert useState<any> to useState
detailsCode = detailsCode.replace('const [formData, setFormData] = useState<any>({', 'const [formData, setFormData] = useState({');

// Fix type inference for customFields
detailsCode = detailsCode.replace(
  'customFields: client.customFields || [],',
  'customFields: (client.customFields || []) as {key: string, value: string}[],'
);

fs.writeFileSync(detailsPath, detailsCode, 'utf8');

// 2. NewClientModal.tsx
const newClientPath = path.join(root, 'src/features/clients/NewClientModal.tsx');
let newClientCode = fs.readFileSync(newClientPath, 'utf8');

// Fix the bad import line
newClientCode = newClientCode.replace(
  'import { Plus, { useSettings } from "@/hooks/useSettings";',
  'import { useSettings } from "@/hooks/useSettings";'
);
newClientCode = newClientCode.replace(
  'import { Plus, import { useSettings }',
  'import { useSettings }'
);

fs.writeFileSync(newClientPath, newClientCode, 'utf8');

console.log('Fixed typescript issues cleanly');

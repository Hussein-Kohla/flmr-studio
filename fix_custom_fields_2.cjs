const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';

// 1. ClientDetailsModal.tsx
const detailsPath = path.join(root, 'src/features/clients/ClientDetailsModal.tsx');
let detailsCode = fs.readFileSync(detailsPath, 'utf8');

// Fix the formData type issue by casting to any or giving it a type
detailsCode = detailsCode.replace(
  'const [formData, setFormData] = useState({',
  'const [formData, setFormData] = useState<any>({'
);
fs.writeFileSync(detailsPath, detailsCode, 'utf8');

// 2. NewClientModal.tsx
const newClientPath = path.join(root, 'src/features/clients/NewClientModal.tsx');
let newClientCode = fs.readFileSync(newClientPath, 'utf8');

// Fix the bad import
newClientCode = newClientCode.replace(
  'import { Plus, { useSettings } from "@/hooks/useSettings";',
  'import { useSettings } from "@/hooks/useSettings";'
);
if (!newClientCode.includes('import { X } from \'lucide-react\';')) {
  newClientCode = newClientCode.replace(
    'import { X } from \'lucide-react\';',
    'import { X, Plus } from \'lucide-react\';'
  );
}
// Handle case where X is already imported but Plus is not
if (newClientCode.includes('import { X } from \'lucide-react\';') && !newClientCode.includes('Plus')) {
  newClientCode = newClientCode.replace(
    'import { X } from \'lucide-react\';',
    'import { X, Plus } from \'lucide-react\';'
  );
}

// Just safely insert Plus into lucide-react imports if not there
if (!newClientCode.includes('Plus')) {
  newClientCode = newClientCode.replace(
    'import { X } from \'lucide-react\';',
    'import { X, Plus } from \'lucide-react\';'
  );
}

fs.writeFileSync(newClientPath, newClientCode, 'utf8');

console.log('Fixed typescript issues');

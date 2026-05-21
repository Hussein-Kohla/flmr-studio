const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';

// 1. ClientDetailsModal.tsx
const detailsPath = path.join(root, 'src/features/clients/ClientDetailsModal.tsx');
let detailsCode = fs.readFileSync(detailsPath, 'utf8');

// Fix the initial state of formData
if (!detailsCode.includes('customFields: [] as {key: string, value: string}[]')) {
  detailsCode = detailsCode.replace(
    "status: 'lead',",
    "status: 'lead',\n    customFields: [] as {key: string, value: string}[],"
  );
}

fs.writeFileSync(detailsPath, detailsCode, 'utf8');

// 2. NewClientModal.tsx
const newClientPath = path.join(root, 'src/features/clients/NewClientModal.tsx');
let newClientCode = fs.readFileSync(newClientPath, 'utf8');

// The first line is `import { useSettings } from "@/hooks/useSettings";` or broken
// Just replace the first 3 lines with clean imports
newClientCode = newClientCode.replace(
  /import \{ useSettings \} from "@\/hooks\/useSettings";\nimport React, \{ useState \} from 'react';\nimport \{ X, Plus \} from 'lucide-react';/g,
  `import { useSettings } from "@/hooks/useSettings";\nimport React, { useState } from 'react';\nimport { X, Plus } from 'lucide-react';`
);

// Specifically fix any bad `useSettings` line
newClientCode = newClientCode.replace(/import \{ Plus, \{ useSettings \} from "@\/hooks\/useSettings";/g, 'import { useSettings } from "@/hooks/useSettings";');
newClientCode = newClientCode.replace(/import \{ Plus, import \{ useSettings \}/g, 'import { useSettings }');

fs.writeFileSync(newClientPath, newClientCode, 'utf8');

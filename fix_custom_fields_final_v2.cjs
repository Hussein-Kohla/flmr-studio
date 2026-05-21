const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';

// 1. Update convex/clients.ts
const apiPath = path.join(root, 'convex/clients.ts');
let apiCode = fs.readFileSync(apiPath, 'utf8');

if (!apiCode.includes('customFields: v.optional(v.array(')) {
  // We missed it in updateClient. Let's add it.
  apiCode = apiCode.replace(
    'accountManager: v.optional(v.string()),\n    collectionOfficer: v.optional(v.string()),',
    'customFields: v.optional(v.array(v.object({\n      key: v.string(),\n      value: v.string(),\n    }))),'
  );
  
  // Let's also make sure we pass customFields in the patch object
  apiCode = apiCode.replace(
    'accountManager: args.accountManager,\n      collectionOfficer: args.collectionOfficer,',
    'customFields: args.customFields,'
  );
  
  fs.writeFileSync(apiPath, apiCode, 'utf8');
  console.log('Fixed API');
} else if (apiCode.includes('accountManager: v.optional(v.string()),')) {
  // It's there but maybe customFields wasn't added to updateClient
  // Let's just find `status: v.optional(v.string()),` and put it above it in updateClient
  const updateClientBlock = apiCode.substring(apiCode.indexOf('export const updateClient'));
  if (!updateClientBlock.includes('customFields: v.optional')) {
    apiCode = apiCode.replace(
      'status: v.optional(v.string()),',
      'customFields: v.optional(v.array(v.object({ key: v.string(), value: v.string() }))),\n    status: v.optional(v.string()),'
    );
    apiCode = apiCode.replace(
      'notes: args.notes,',
      'notes: args.notes,\n      customFields: args.customFields,'
    );
    fs.writeFileSync(apiPath, apiCode, 'utf8');
    console.log('Fixed API (added customFields to updateClient)');
  }
}


// 2. Update ClientDetailsModal.tsx
const detailsPath = path.join(root, 'src/features/clients/ClientDetailsModal.tsx');
let detailsCode = fs.readFileSync(detailsPath, 'utf8');

// Remove Account Manager block
const amRegex = /\{\/\*\s*Account Manager\s*\*\/\}.*?<\/div>\s*<\/div>/s;
detailsCode = detailsCode.replace(amRegex, '');

// Remove Collection Officer block
const coRegex = /\{\/\*\s*Collection Officer\s*\*\/\}.*?<\/div>\s*<\/div>/s;
detailsCode = detailsCode.replace(coRegex, '');

fs.writeFileSync(detailsPath, detailsCode, 'utf8');
console.log('Fixed UI in ClientDetailsModal');

const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

// 1. Fix NewStaffModal.tsx (isLoading -> loading)
let nsmPath = path.join(root, 'features/clients/NewStaffModal.tsx');
let nsm = fs.readFileSync(nsmPath, 'utf8');
nsm = nsm.replace('isLoading={isSubmitting}', 'loading={isSubmitting}');
fs.writeFileSync(nsmPath, nsm, 'utf8');

// 2. Fix NewProjectStepperModal.tsx line 263 (MOCK_EMPLOYEES usage)
let npsmPath = path.join(root, 'features/projects/NewProjectStepperModal.tsx');
let npsm = fs.readFileSync(npsmPath, 'utf8');
// Replace the remaining MOCK_EMPLOYEES in NewProjectStepperModal
if (npsm.includes('MOCK_EMPLOYEES.map')) {
  npsm = npsm.replace(
    /MOCK_EMPLOYEES\.map\(emp => \(/g,
    "staffList.map((emp: any) => ("
  );
  npsm = npsm.replace(
    /emp\.id/g,
    "emp._id"
  );
}
fs.writeFileSync(npsmPath, npsm, 'utf8');

// 3. Fix translations.ts (duplicates and add keys)
const transPath = path.join(root, 'lib/translations.ts');
let transLines = fs.readFileSync(transPath, 'utf8').split('\n');
let inEn = false;
let inAr = false;
let seenEn = new Set();
let seenAr = new Set();
let outLines = [];

for (let i = 0; i < transLines.length; i++) {
  let line = transLines[i];
  
  if (line.includes('en: {')) { inEn = true; inAr = false; outLines.push(line); continue; }
  if (line.includes('ar: {')) { inAr = true; inEn = false; outLines.push(line); continue; }
  if (line.trim() === '},' || line.trim() === '}') { 
    if (inEn && !inAr) { inEn = false; }
    else if (inAr) { inAr = false; }
    outLines.push(line); continue; 
  }

  if (inEn || inAr) {
    let match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (match) {
      let key = match[1];
      if (inEn) {
        if (seenEn.has(key)) { continue; }
        seenEn.add(key);
      } else if (inAr) {
        if (seenAr.has(key)) { continue; }
        seenAr.add(key);
      }
    }
  }
  outLines.push(line);
}

let tObj = outLines.join('\n');
// Add missing keys
const missingEn = "addStaff: 'Add Staff',\n    staffLabel: 'Staff',\n    addNewStaff: 'Add New Staff',";
const missingAr = "addStaff: 'إضافة موظف',\n    staffLabel: 'فريق العمل',\n    addNewStaff: 'إضافة موظف جديد',";

if (!tObj.includes('addNewStaff:')) {
  tObj = tObj.replace('en: {', 'en: {\n    ' + missingEn);
  tObj = tObj.replace('ar: {', 'ar: {\n    ' + missingAr);
}
fs.writeFileSync(transPath, tObj, 'utf8');
console.log('Fixed compile errors.');

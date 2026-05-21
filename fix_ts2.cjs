const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/home/work/flmr-studio/flmr-studio-app';

// 1. Fix ClientsPage and ProjectsPage label={} types
function fixTabLabel(fp) {
  if (fs.existsSync(fp)) {
    let c = fs.readFileSync(fp, 'utf8');
    // For TypeScript, if `t` returns something that Tab's label doesn't like, we cast to `any`.
    // My previous script replaced label={t('...')} with label={t("...") as any} 
    // Wait, let's see if there's any `<Tab value="list" label={t('list')} />`.
    // It's probably easier to just replace `label={t(xxx) as any}` with `label={t(xxx) as string}`
    c = c.replace(/label=\{t\(([^)]+)\)\s+as\s+any\}/g, 'label={t($1) as string}');
    c = c.replace(/label=\{t\(([^)]+)\)\}/g, 'label={t($1) as string}');
    fs.writeFileSync(fp, c, 'utf8');
  }
}
fixTabLabel(path.join(projectRoot, 'src/features/clients/ClientsPage.tsx'));
fixTabLabel(path.join(projectRoot, 'src/features/projects/ProjectsPage.tsx'));

// 2. Fix NewTaskModal.tsx
const newTaskFp = path.join(projectRoot, 'src/features/tasks/NewTaskModal.tsx');
if (fs.existsSync(newTaskFp)) {
  let c = fs.readFileSync(newTaskFp, 'utf8');
  c = c.replace("import { Plus, ", "import { ");
  if (!c.includes('import { Plus')) {
    c = c.replace("import { X", "import { Plus, X");
  }
  fs.writeFileSync(newTaskFp, c, 'utf8');
}

// 3. Fix translations.ts
const translationsFp = path.join(projectRoot, 'src/lib/translations.ts');
if (fs.existsSync(translationsFp)) {
  let c = fs.readFileSync(translationsFp, 'utf8');
  const missingEnKeys = `
    source: 'Source',
    type: 'Type',
    amount: 'Amount',
    date: 'Date',
    descriptionText: 'Description',
    categoryManual: 'Manual',
    categoryGeneral: 'General',
  `;
  if (!c.includes("source: 'Source'")) {
    c = c.replace("dashboard: 'Dashboard',", missingEnKeys + "\n    dashboard: 'Dashboard',");
  }
  
  const missingArKeys = `
    source: 'المصدر',
    type: 'النوع',
    amount: 'المبلغ',
    date: 'التاريخ',
    descriptionText: 'الوصف',
    categoryManual: 'يدوي',
    categoryGeneral: 'عام',
  `;
  if (!c.includes("source: 'المصدر'")) {
    c = c.replace("dashboard: 'لوحة التحكم',", missingArKeys + "\n    dashboard: 'لوحة التحكم',");
  }
  fs.writeFileSync(translationsFp, c, 'utf8');
}

console.log('Fixed TS issues part 2');

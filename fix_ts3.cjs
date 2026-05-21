const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/home/work/flmr-studio/flmr-studio-app';

// Fix NewTaskModal.tsx
const newTaskFp = path.join(projectRoot, 'src/features/tasks/NewTaskModal.tsx');
if (fs.existsSync(newTaskFp)) {
  let c = fs.readFileSync(newTaskFp, 'utf8');
  c = c.replace(/import\s*\{\s*Plus,\s*useMutation\s*\}\s*from\s*['"]convex\/react['"]/, 'import { useMutation } from "convex/react"');
  c = c.replace(/import\s*\{\s*Plus,\s*X,\s*useMutation\s*\}\s*from\s*['"]convex\/react['"]/, 'import { useMutation } from "convex/react"');
  c = c.replace(/import\s*\{\s*Plus,\s*X\s*\}\s*from\s*['"]convex\/react['"]/, ''); // just in case
  fs.writeFileSync(newTaskFp, c, 'utf8');
}

// Fix ClientsPage and ProjectsPage (revert 'as string' or 'as any' since PageWrapper handles it)
function revertCast(fp) {
  if (fs.existsSync(fp)) {
    let c = fs.readFileSync(fp, 'utf8');
    c = c.replace(/label=\{t\(([^)]+)\)\s*as\s*string\}/g, 'label={t($1)}');
    c = c.replace(/label=\{t\(([^)]+)\)\s*as\s*any\}/g, 'label={t($1)}');
    fs.writeFileSync(fp, c, 'utf8');
  }
}
revertCast(path.join(projectRoot, 'src/features/clients/ClientsPage.tsx'));
revertCast(path.join(projectRoot, 'src/features/projects/ProjectsPage.tsx'));

// Fix translations.ts
const translationsFp = path.join(projectRoot, 'src/lib/translations.ts');
if (fs.existsSync(translationsFp)) {
  let c = fs.readFileSync(translationsFp, 'utf8');
  
  // Make sure totalProjects is in the english section.
  if (!c.includes("totalProjects: 'Total Projects'")) {
    c = c.replace("projects: 'Projects',", "projects: 'Projects',\n    totalProjects: 'Total Projects',");
  }

  // Make sure totalProjects is in the arabic section.
  if (!c.includes("totalProjects: 'إجمالي المشاريع'")) {
    c = c.replace("projects: 'المشاريع',", "projects: 'المشاريع',\n    totalProjects: 'إجمالي المشاريع',");
  }
  
  fs.writeFileSync(translationsFp, c, 'utf8');
}

console.log('Fixed TS part 3.');

const fs = require('fs');
const path = require('path');

const files = [
  'src/features/clients/ClientsPage.tsx',
  'src/features/projects/ProjectsPage.tsx',
  'src/features/projects/NewProjectStepperModal.tsx',
  'src/features/projects/ProjectDetailsDrawer.tsx'
];

const replacements = {
  'bg-\\[#0d0d0d\\]': 'bg-[var(--bg-base)]',
  'bg-\\[#111111\\]': 'bg-[var(--bg-raised)]',
  'bg-\\[#111\\]': 'bg-[var(--bg-raised)]',
  'bg-\\[#1a1a1a\\]': 'bg-[var(--bg-surface)]',
  'bg-\\[#151515\\]': 'bg-[var(--bg-overlay)]',
  'bg-\\[#222222\\]': 'bg-[var(--bg-muted)]',
  'text-\\[#10b981\\]': 'text-[var(--color-brand)]',
  'bg-\\[#10b981\\]': 'bg-[var(--color-brand)]',
  'border-\\[#10b981\\]': 'border-[var(--color-brand)]',
  'hover:text-\\[#10b981\\]': 'hover:text-[var(--color-brand)]',
  'hover:bg-\\[#10b981\\]': 'hover:bg-[var(--color-brand)]',
  'hover:border-\\[#10b981\\]': 'hover:border-[var(--color-brand)]',
  'text-\\[#059669\\]': 'text-[var(--color-brand-dim)]',
  'bg-\\[#059669\\]': 'bg-[var(--color-brand-dim)]',
  'hover:bg-\\[#059669\\]': 'hover:bg-[var(--color-brand-dim)]',
  'border-\\[#2a2a2a\\]': 'border-[var(--border-default)]',
  'bg-\\[#2a2a2a\\]': 'bg-[var(--border-default)]',
  'text-\\[#9ca3af\\]': 'text-[var(--text-muted)]',
  'text-\\[#f8fafc\\]': 'text-[var(--text-primary)]',
  'shadow-\\[#10b981\\]': 'shadow-[var(--color-brand-glow)]',
  'rgba\\(16,185,129,0\\.3\\)': 'var(--color-brand-glow)',
  '#10b981': 'var(--color-brand)',
  '#0d0d0d': 'var(--bg-base)',
  '#111111': 'var(--bg-raised)',
  '#1a1a1a': 'var(--bg-surface)',
  '#2a2a2a': 'var(--border-default)',
  '#9ca3af': 'var(--text-muted)',
};

files.forEach(file => {
  const filePath = path.join('c:/home/work/flmr-studio/flmr-studio-app', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    for (const [regexStr, replacement] of Object.entries(replacements)) {
      const regex = new RegExp(regexStr, 'g');
      content = content.replace(regex, replacement);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

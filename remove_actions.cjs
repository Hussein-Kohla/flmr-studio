const fs = require('fs');
const path = require('path');

const filePath = 'c:/home/work/flmr-studio/flmr-studio-app/src/features/clients/ClientsPage.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Replace grid-cols definitions
code = code.replace(/grid-cols-\[auto_2fr_1fr_1fr_1fr_1fr_auto\]/g, 'grid-cols-[auto_2fr_1fr_1fr_1fr_1fr]');

// Remove headers
code = code.replace(/<div className="w-10 text-center">\{t\('actions'\)\}<\/div>/g, '');

// Remove actions from ExpandableClientRow client
const clientActionsMatch = `        <div className="w-10 text-center">
          <button className="p-1 hover:bg-[var(--border-default)] rounded text-[var(--text-muted)] hover:text-white" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal size={16} />
          </button>
        </div>`;
code = code.replace(clientActionsMatch, '');

// Remove actions from ExpandableClientRow project
const projectActionsMatch = `                      <div className="text-xs text-[var(--text-muted)]">—</div>
                      <div className="w-10"></div>`;
const projectActionsReplacement = `                      <div className="text-xs text-[var(--text-muted)]">—</div>`;
code = code.replace(projectActionsMatch, projectActionsReplacement);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Removed actions column');

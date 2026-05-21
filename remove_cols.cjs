const fs = require('fs');
const path = require('path');

const filePath = 'c:/home/work/flmr-studio/flmr-studio-app/src/features/clients/ClientsPage.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Replace the grid-cols definitions
code = code.replace(/grid-cols-\[auto_2fr_1fr_1fr_1\.5fr_1fr_1fr_1fr_auto\]/g, 'grid-cols-[auto_2fr_1fr_1fr_1fr_1fr_auto]');

// Remove headers
code = code.replace("<div>{t('taskCompletion')}</div>", '');
code = code.replace("<div>{t('health')}</div>", '');

// Remove from ExpandableClientRow client
const clientTaskMatch = `        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-[80px]">
            <div className="h-1.5 w-full bg-[var(--border-default)] rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: \`\${taskRatio}%\` }} />
            </div>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{taskRatio}% / {remainingTasks} {t('tasksLeft')}</span>
        </div>`;
code = code.replace(clientTaskMatch, '');

const clientHealthMatch = `        <div>
          <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold", HEALTH_COLORS[healthStatus])}>
            {healthStatus} ▼
          </span>
        </div>`;
code = code.replace(clientHealthMatch, '');

// Remove from ExpandableClientRow project
const projectTaskMatch = `                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[80px]">
                          <div className="h-1.5 w-full bg-[var(--border-default)] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: \`\${pRatio}%\` }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)]">{pRatio}% / {pRemaining} left</span>
                      </div>`;
code = code.replace(projectTaskMatch, '');

const projectHealthMatch = `                      <div>
                        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold", HEALTH_COLORS[pHealth])}>
                          {pHealth} ▼
                        </span>
                      </div>`;
code = code.replace(projectHealthMatch, '');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Removed columns');

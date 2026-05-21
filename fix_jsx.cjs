const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/home/work/flmr-studio/flmr-studio-app';

const files = [
  'src/features/analytics/AnalyticsPage.tsx',
  'src/features/calendar/CalendarPage.tsx',
  'src/features/payments/PaymentsPage.tsx',
  'src/features/tasks/TasksPage.tsx'
];

files.forEach(relPath => {
  const fp = path.join(projectRoot, relPath);
  if (!fs.existsSync(fp)) return;

  let c = fs.readFileSync(fp, 'utf8');

  // Regex to fix invalid JSX attributes: title=t("key") -> title={t("key")}
  // It matches word characters followed by =t("someKey") or =t('someKey')
  // We'll replace it with word={t("someKey")}
  const regex = /(\w+)=t\((['"])([^'"]+)\2\)/g;
  c = c.replace(regex, '$1={t($2$3$2)}');

  fs.writeFileSync(fp, c, 'utf8');
  console.log('Fixed syntax in', relPath);
});

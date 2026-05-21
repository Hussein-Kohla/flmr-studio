const fs = require('fs');
const path = require('path');

const filePath = path.join('c:/home/work/flmr-studio/flmr-studio-app', 'src/features/dashboard/DashboardPage.tsx');

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Ensure useSettings is imported and used
  if (!content.includes('useSettings')) {
    content = content.replace(
      "import { useAuth } from '@/hooks/useAuth';",
      "import { useAuth } from '@/hooks/useAuth';\nimport { useSettings } from '@/hooks/useSettings';"
    );
  }
  
  if (!content.includes('const { t } = useSettings();')) {
    content = content.replace(
      "const { token } = useAuth();",
      "const { token } = useAuth();\n  const { t } = useSettings();"
    );
  }

  const replacements = {
    '"TOTAL AVERAGE MONTHLY"': "t('totalAverageMonthly')",
    '"TOTAL EXPENSES"': "t('totalExpenses')",
    '"NET PROFIT"': "t('netProfit')",
    '"TOTAL CLIENTS"': "t('totalClients')",
    '"ACTIVE PROJECTS"': "t('activeProjects')",
    '"COMPLETED PROJECTS"': "t('completedProjects')",
    '"PENDING COLLECTION"': "t('pendingCollection')",
    '"Average Monthly & Expenses Trend"': "t('averageAndExpensesTrend')",
    '"Project Pipeline"': "t('projectPipeline')",
    '"all collected"': "t('allCollected')",
    '"new this month"': "t('newThisMonth')",
    '"of total"': "t('ofTotal')",
    '"Recent Transactions"': "t('recentTransactions')",
    '"Top Clients"': "t('topClients')",
    '"Detailed Stats"': "t('detailedStats')",
  };

  for (const [search, replace] of Object.entries(replacements)) {
    // We split and join to replace all occurrences.
    content = content.split(search).join(replace);
  }

  // Also replace text inside JSX tags like >TOTAL AVERAGE MONTHLY< if they exist
  const jsxReplacements = {
    '>TOTAL AVERAGE MONTHLY<': ">{t('totalAverageMonthly')}<",
    '>TOTAL EXPENSES<': ">{t('totalExpenses')}<",
    '>NET PROFIT<': ">{t('netProfit')}<",
    '>TOTAL CLIENTS<': ">{t('totalClients')}<",
    '>ACTIVE PROJECTS<': ">{t('activeProjects')}<",
    '>COMPLETED PROJECTS<': ">{t('completedProjects')}<",
    '>PENDING COLLECTION<': ">{t('pendingCollection')}<",
    '>Average Monthly & Expenses Trend<': ">{t('averageAndExpensesTrend')}<",
    '>Project Pipeline<': ">{t('projectPipeline')}<",
    '>all collected<': ">{t('allCollected')}<",
    '>new this month<': ">{t('newThisMonth')}<",
    '>of total<': ">{t('ofTotal')}<",
  };

  for (const [search, replace] of Object.entries(jsxReplacements)) {
    content = content.split(search).join(replace);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('DashboardPage.tsx translated successfully!');
} else {
  console.log('File not found!');
}

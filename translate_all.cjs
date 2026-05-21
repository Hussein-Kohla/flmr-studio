const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/home/work/flmr-studio/flmr-studio-app';
const translationsPath = path.join(projectRoot, 'src/lib/translations.ts');

const newEnKeys = {
  // Analytics
  advancedAnalytics: 'Advanced Analytics',
  analyticsSubtitle: 'Comprehensive insights and financial tracking',
  liveData: 'Live Data',
  totalRevenue: 'Total Revenue',
  pendingInvoices: 'Pending Invoices',
  revenueProfitTrend: 'Revenue & Profit Trend (Last 6 Months)',
  monthlyRevenueYear: 'Monthly Revenue (Current Year)',
  performanceMetrics: 'Performance Metrics',
  avgRevenueClient: 'Avg. Revenue/Client',
  topClientsRevenue: 'Top Clients by Revenue',
  noProjectData: 'No project data',
  noClientDataFound: 'No client data found.',

  // Calendar
  calendarTasks: 'Calendar & Tasks',
  calendarSubtitle: 'Manage your monthly schedule and daily tasks',
  monthlyScheduleOverview: 'Overview of your monthly schedule',
  dailyProgress: 'Daily Progress',
  newTaskEvent: 'New Task / Event',
  upcoming: 'UPCOMING',
  today: 'Today',

  // Payments
  financialOverview: 'Financial Overview',
  financialSubtitle: 'Track your income, expenses, and budget with precision',
  overviewTab: 'OVERVIEW',
  monthlyCollectionsTab: 'MONTHLY COLLECTIONS',
  totalNetBalance: 'TOTAL NET BALANCE',
  incomeThisMonth: 'INCOME (THIS MONTH)',
  expensesThisMonth: 'EXPENSES (THIS MONTH)',
  fixedIncomeMonth: 'FIXED INCOME/MONTH',
  profitRatio: 'PROFIT RATIO',
  addIncome: 'ADD INCOME',
  addExpense: 'ADD EXPENSE',
  categoryManual: 'Manual',
  categoryGeneral: 'General',
  amount: 'Amount',
  source: 'Source',
  date: 'Date',
  type: 'Type',
  descriptionText: 'Description',
};

const newArKeys = {
  // Analytics
  advancedAnalytics: 'تحليلات متقدمة',
  analyticsSubtitle: 'رؤى شاملة وتتبع مالي دقيق',
  liveData: 'بيانات حية',
  totalRevenue: 'إجمالي الإيرادات',
  pendingInvoices: 'فواتير معلقة',
  revenueProfitTrend: 'اتجاه الإيرادات والأرباح (آخر 6 أشهر)',
  monthlyRevenueYear: 'الإيرادات الشهرية (العام الحالي)',
  performanceMetrics: 'مقاييس الأداء',
  avgRevenueClient: 'متوسط إيرادات العميل',
  topClientsRevenue: 'أهم العملاء حسب الإيرادات',
  noProjectData: 'لا توجد بيانات مشاريع',
  noClientDataFound: 'لم يتم العثور على بيانات عملاء.',

  // Calendar
  calendarTasks: 'التقويم والمهام',
  calendarSubtitle: 'إدارة جدولك الشهري ومهامك اليومية',
  monthlyScheduleOverview: 'نظرة عامة على جدولك الشهري',
  dailyProgress: 'التقدم اليومي',
  newTaskEvent: 'مهمة / حدث جديد',
  upcoming: 'القادمة',
  today: 'اليوم',

  // Payments
  financialOverview: 'نظرة عامة مالية',
  financialSubtitle: 'تتبع دخلك ومصروفاتك وميزانيتك بدقة',
  overviewTab: 'نظرة عامة',
  monthlyCollectionsTab: 'التحصيلات الشهرية',
  totalNetBalance: 'إجمالي الرصيد الصافي',
  incomeThisMonth: 'الدخل (هذا الشهر)',
  expensesThisMonth: 'المصروفات (هذا الشهر)',
  fixedIncomeMonth: 'الدخل الثابت/الشهر',
  profitRatio: 'نسبة الربح',
  addIncome: 'إضافة دخل',
  addExpense: 'إضافة مصروف',
  categoryManual: 'يدوي',
  categoryGeneral: 'عام',
  amount: 'المبلغ',
  source: 'المصدر',
  date: 'التاريخ',
  type: 'النوع',
  descriptionText: 'الوصف',
};

// 1. Update translations.ts
let transContent = fs.readFileSync(translationsPath, 'utf8');

// Insert EN keys
let enKeysStr = '';
for (const [k, v] of Object.entries(newEnKeys)) {
  if (!transContent.includes(`${k}: `)) {
    enKeysStr += `    ${k}: '${v}',\n`;
  }
}
transContent = transContent.replace('// Dashboard Page', enKeysStr + '\n    // Dashboard Page');

// Insert AR keys
let arKeysStr = '';
for (const [k, v] of Object.entries(newArKeys)) {
  if (!transContent.includes(`${k}: `)) {
    arKeysStr += `    ${k}: '${v}',\n`;
  }
}
transContent = transContent.replace('// Dashboard Page', arKeysStr + '\n    // Dashboard Page'); // Note: The second match will be in the ar section because replace only replaces the first instance (en section), wait, let me just do a targeted replace for AR.

// Re-read to ensure we replace correctly in the second section
fs.writeFileSync(translationsPath, transContent, 'utf8');
transContent = fs.readFileSync(translationsPath, 'utf8');

let lastIndex = transContent.lastIndexOf('// Dashboard Page');
if (lastIndex !== -1 && arKeysStr) {
  transContent = transContent.substring(0, lastIndex) + arKeysStr + '\n    ' + transContent.substring(lastIndex);
  fs.writeFileSync(translationsPath, transContent, 'utf8');
}

console.log('Updated translations.ts');


// Function to process a file
function processFile(relPath, replacements, jsxReplacements = {}) {
  const fp = path.join(projectRoot, relPath);
  if (!fs.existsSync(fp)) return console.log('Not found:', relPath);
  
  let c = fs.readFileSync(fp, 'utf8');
  
  if (!c.includes('useSettings')) {
    c = c.replace(
      "import { useAuth } from '@/hooks/useAuth'",
      "import { useAuth } from '@/hooks/useAuth'\nimport { useSettings } from '@/hooks/useSettings'"
    );
    if (!c.includes('useSettings')) { // fallback
      c = c.replace(
        "import { useQuery } from 'convex/react'",
        "import { useQuery } from 'convex/react'\nimport { useSettings } from '@/hooks/useSettings'"
      );
    }
  }
  
  if (!c.includes('const { t } = useSettings()')) {
    c = c.replace(
      "const { token } = useAuth()",
      "const { token } = useAuth()\n  const { t } = useSettings()"
    );
  }

  for (const [search, replace] of Object.entries(replacements)) {
    c = c.split(search).join(replace);
  }

  for (const [search, replace] of Object.entries(jsxReplacements)) {
    c = c.split(search).join(replace);
  }
  
  fs.writeFileSync(fp, c, 'utf8');
  console.log('Processed', relPath);
}

// AnalyticsPage
processFile('src/features/analytics/AnalyticsPage.tsx', {
  '"Advanced Analytics"': 't("advancedAnalytics")',
  '"Comprehensive insights and financial tracking"': 't("analyticsSubtitle")',
  '"Live Data"': 't("liveData")',
  '"Total Revenue"': 't("totalRevenue")',
  '"Total Expenses"': 't("totalExpenses")',
  '"Net Profit"': 't("netProfit")',
  '"Pending Invoices"': 't("pendingInvoices")',
  '"Revenue & Profit Trend (Last 6 Months)"': 't("revenueProfitTrend")',
  '"Project Pipeline"': 't("projectPipeline")',
  '"Monthly Revenue (Current Year)"': 't("monthlyRevenueYear")',
  '"Performance Metrics"': 't("performanceMetrics")',
  '"Total Clients"': 't("totalClients")',
  '"Total Projects"': 't("totalProjects") || "Total Projects"',
  '"Completed Projects"': 't("completedProjects")',
  '"Avg. Revenue/Client"': 't("avgRevenueClient")',
  '"Top Clients by Revenue"': 't("topClientsRevenue")',
}, {
  '>Live Data<': '>{t("liveData")}<',
  '>Revenue & Profit Trend (Last 6 Months)<': '>{t("revenueProfitTrend")}<',
  '>Project Pipeline<': '>{t("projectPipeline")}<',
  '>Monthly Revenue (Current Year)<': '>{t("monthlyRevenueYear")}<',
  '>Performance Metrics<': '>{t("performanceMetrics")}<',
  '>Total Clients<': '>{t("totalClients")}<',
  '>Total Projects<': '>{t("projects")}<',
  '>Completed Projects<': '>{t("completedProjects")}<',
  '>Avg. Revenue/Client<': '>{t("avgRevenueClient")}<',
  '>Top Clients by Revenue<': '>{t("topClientsRevenue")}<',
  '>No project data<': '>{t("noProjectData")}<',
  '>No client data found.<': '>{t("noClientDataFound")}<',
  '>Client<': '>{t("clientName")}<',
  '>Total Projects<': '>{t("totalProjects") || "Total Projects"}<',
  '>Revenue Generated<': '>{t("revenue")}<',
  '>Pending Collection<': '>{t("pendingCollection")}<'
});

// CalendarPage
processFile('src/features/calendar/CalendarPage.tsx', {
  '"Calendar & Tasks"': 't("calendarTasks")',
  '"Manage your monthly schedule and daily tasks"': 't("calendarSubtitle")',
  '"Overview of your monthly schedule"': 't("monthlyScheduleOverview")',
  '"Daily Progress"': 't("dailyProgress")',
  '"New Task / Event"': 't("newTaskEvent")',
  '"UPCOMING"': 't("upcoming")',
  '"Today"': 't("today")',
  '"Completed"': 't("completed")',
}, {
  '>Calendar & Tasks<': '>{t("calendarTasks")}<',
  '>Manage your monthly schedule and daily tasks<': '>{t("calendarSubtitle")}<',
  '>Overview of your monthly schedule<': '>{t("monthlyScheduleOverview")}<',
  '>Daily Progress<': '>{t("dailyProgress")}<',
  '>New Task / Event<': '>{t("newTaskEvent")}<',
  '>UPCOMING<': '>{t("upcoming")}<',
  '>Today<': '>{t("today")}<',
  '>Tasks<': '>{t("tasks")}<'
});

// PaymentsPage
processFile('src/features/payments/PaymentsPage.tsx', {
  '"Financial Overview"': 't("financialOverview")',
  '"Track your income, expenses, and budget with precision"': 't("financialSubtitle")',
  '"OVERVIEW"': 't("overviewTab")',
  '"MONTHLY COLLECTIONS"': 't("monthlyCollectionsTab")',
  '"TOTAL NET BALANCE"': 't("totalNetBalance")',
  '"INCOME (THIS MONTH)"': 't("incomeThisMonth")',
  '"EXPENSES (THIS MONTH)"': 't("expensesThisMonth")',
  '"FIXED INCOME/MONTH"': 't("fixedIncomeMonth")',
  '"PROFIT RATIO"': 't("profitRatio")',
  '"ADD INCOME"': 't("addIncome")',
  '"ADD EXPENSE"': 't("addExpense")',
  '"Recent Transactions"': 't("recentTransactions")',
  '"Manual"': 't("categoryManual")',
  '"General"': 't("categoryGeneral")',
}, {
  '>Financial Overview<': '>{t("financialOverview")}<',
  '>Track your income, expenses, and budget with precision<': '>{t("financialSubtitle")}<',
  '>OVERVIEW<': '>{t("overviewTab")}<',
  '>MONTHLY COLLECTIONS<': '>{t("monthlyCollectionsTab")}<',
  '>TOTAL NET BALANCE<': '>{t("totalNetBalance")}<',
  '>INCOME (THIS MONTH)<': '>{t("incomeThisMonth")}<',
  '>EXPENSES (THIS MONTH)<': '>{t("expensesThisMonth")}<',
  '>FIXED INCOME/MONTH<': '>{t("fixedIncomeMonth")}<',
  '>PROFIT RATIO<': '>{t("profitRatio")}<',
  '>ADD INCOME<': '>{t("addIncome")}<',
  '>ADD EXPENSE<': '>{t("addExpense")}<',
  '>Recent Transactions<': '>{t("recentTransactions")}<',
  '>All Types<': '>{t("allTypes")}<',
  '>DESCRIPTION<': '>{t("descriptionText")}<',
  '>CATEGORY<': '>{t("categoriesTags")}<',
  '>DATE<': '>{t("date")}<',
  '>TYPE<': '>{t("type")}<',
  '>SOURCE<': '>{t("source")}<',
  '>AMOUNT<': '>{t("amount")}<',
  '>ACTIONS<': '>{t("actions")}<'
});

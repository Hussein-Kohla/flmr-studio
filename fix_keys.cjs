const fs = require('fs');
const path = require('path');

const fp = path.join('c:/home/work/flmr-studio/flmr-studio-app/src/lib/translations.ts');
let content = fs.readFileSync(fp, 'utf8');

const enKeys = `
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

    calendarTasks: 'Calendar & Tasks',
    calendarSubtitle: 'Manage your monthly schedule and daily tasks',
    monthlyScheduleOverview: 'Overview of your monthly schedule',
    dailyProgress: 'Daily Progress',
    newTaskEvent: 'New Task / Event',
    upcoming: 'UPCOMING',
    today: 'Today',

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

    taskBoard: 'Task Board',
    taskBoardSubtitle: 'Manage tasks and track progress',
    listAdded: 'List added.',
    listAddFailed: 'Failed to add list.',
    deleteListConfirm: 'Delete this list? Tasks will remain but the list will be gone.',
    listDeleted: 'List deleted.',
    listDeleteFailed: 'Failed to delete list.',
    listRenamed: 'List renamed.',
    listRenameFailed: 'Failed to rename list.',
    taskDeleted: 'Task deleted.',
    taskDeleteFailed: 'Failed to delete task.',
    taskCompleted: 'Task completed!',
    taskUpdateFailed: 'Failed to update task.',
    overdue: 'Overdue',
    addTaskEvent: 'Add Task',
    searchTasksPlaceholder: 'Search tasks...',
    allPriorities: 'All Priorities',
    deleteTaskConfirm: 'Are you sure you want to delete this task?',
    markTaskCompleteConfirm: 'Mark this task as complete?',
`;

const arKeys = `
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

    calendarTasks: 'التقويم والمهام',
    calendarSubtitle: 'إدارة جدولك الشهري ومهامك اليومية',
    monthlyScheduleOverview: 'نظرة عامة على جدولك الشهري',
    dailyProgress: 'التقدم اليومي',
    newTaskEvent: 'مهمة / حدث جديد',
    upcoming: 'القادمة',
    today: 'اليوم',

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

    taskBoard: 'لوحة المهام',
    taskBoardSubtitle: 'إدارة المهام وتتبع التقدم',
    listAdded: 'تمت إضافة القائمة.',
    listAddFailed: 'فشل إضافة القائمة.',
    deleteListConfirm: 'هل تريد حذف هذه القائمة؟ ستبقى المهام ولكن ستُحذف القائمة.',
    listDeleted: 'تم حذف القائمة.',
    listDeleteFailed: 'فشل حذف القائمة.',
    listRenamed: 'تمت إعادة تسمية القائمة.',
    listRenameFailed: 'فشل إعادة تسمية القائمة.',
    taskDeleted: 'تم حذف المهمة.',
    taskDeleteFailed: 'فشل حذف المهمة.',
    taskCompleted: 'اكتملت المهمة!',
    taskUpdateFailed: 'فشل تحديث المهمة.',
    overdue: 'متأخرة',
    addTaskEvent: 'إضافة مهمة',
    searchTasksPlaceholder: 'ابحث في المهام...',
    allPriorities: 'كل الأولويات',
    deleteTaskConfirm: 'هل أنت متأكد من حذف هذه المهمة؟',
    markTaskCompleteConfirm: 'هل تريد تحديد المهمة كمكتملة؟',
`;

// Inject into `en` section
// Find `ar: {` which ends the `en` section.
const arStartIdx = content.indexOf('ar: {');
if (arStartIdx !== -1) {
  content = content.slice(0, arStartIdx - 4) + enKeys + content.slice(arStartIdx - 4);
}

// Inject into `ar` section
// Find the end of `ar` section which is `  }` before `};`
const endIdx = content.lastIndexOf('  }');
if (endIdx !== -1) {
  content = content.slice(0, endIdx) + arKeys + content.slice(endIdx);
}

// Clean up duplicate keys just to be safe by doing a quick parse or just letting TS pick the last one.
// TS actually throws error on duplicate keys in object literals!
// So let's filter out keys that already exist.
function appendMissingKeys(sectionStr, newKeysStr) {
  let lines = newKeysStr.split('\\n');
  let result = '';
  for (let line of lines) {
    let match = line.match(/^\\s*([a-zA-Z0-9_]+):/);
    if (match) {
      let key = match[1];
      if (!sectionStr.includes(key + ':')) {
        result += line + '\\n';
      }
    }
  }
  return result;
}

// Rewriting file with clean logic:
let origContent = fs.readFileSync(fp, 'utf8');
let enBlock = origContent.substring(0, origContent.indexOf('ar: {'));
let arBlock = origContent.substring(origContent.indexOf('ar: {'));

let finalEnKeys = '';
enKeys.split('\\n').forEach(line => {
  let m = line.match(/^\\s*([a-zA-Z0-9_]+):/);
  if (m && !enBlock.includes(m[1] + ':')) finalEnKeys += line + '\\n';
});

let finalArKeys = '';
arKeys.split('\\n').forEach(line => {
  let m = line.match(/^\\s*([a-zA-Z0-9_]+):/);
  if (m && !arBlock.includes(m[1] + ':')) finalArKeys += line + '\\n';
});

origContent = origContent.replace('ar: {', finalEnKeys + '\\n  ar: {');
let lastBrace = origContent.lastIndexOf('  }');
origContent = origContent.substring(0, lastBrace) + finalArKeys + '\\n' + origContent.substring(lastBrace);

fs.writeFileSync(fp, origContent, 'utf8');
console.log('Fixed missing keys in translations.ts');

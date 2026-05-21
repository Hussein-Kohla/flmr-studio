const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/home/work/flmr-studio/flmr-studio-app';

// Update translations.ts to add `week`, `month`, `sixMonths`, `year`, `sun`, `mon`, etc. if not present.
const transPath = path.join(projectRoot, 'src/lib/translations.ts');
let transC = fs.readFileSync(transPath, 'utf8');

const newEnKeys = {
  jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
  sun: 'SUN', mon: 'MON', tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT',
  week: 'Week', monthLabel: 'Month', sixMonths: '6M', yearLabel: 'Year', dayLabel: 'Day',
  tasksWord: 'Tasks', doing: 'Doing', addAnotherList: 'Add another list',
  organizeTasks: 'Organize and track your tasks with drag and drop',
  totalWord: 'TOTAL', incomeText: 'Income', expenseText: 'Expense',
  upcomingTasks: 'UPCOMING', allPriorities: 'All Priorities', taskBoardWord: 'Task Board',
  overviewTabUppercase: 'OVERVIEW', monthlyCollectionsTabUppercase: 'MONTHLY COLLECTIONS'
};

const newArKeys = {
  jan: 'يناير', feb: 'فبراير', mar: 'مارس', apr: 'أبريل', may: 'مايو', jun: 'يونيو', jul: 'يوليو', aug: 'أغسطس', sep: 'سبتمبر', oct: 'أكتوبر', nov: 'نوفمبر', dec: 'ديسمبر',
  sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة', sat: 'السبت',
  week: 'أسبوع', monthLabel: 'شهر', sixMonths: '6 أشهر', yearLabel: 'سنة', dayLabel: 'يوم',
  tasksWord: 'المهام', doing: 'قيد التنفيذ', addAnotherList: 'إضافة قائمة أخرى',
  organizeTasks: 'تنظيم وتتبع مهامك بكل سهولة',
  totalWord: 'الإجمالي', incomeText: 'دخل', expenseText: 'مصروف',
  upcomingTasks: 'القادمة', allPriorities: 'كل الأولويات', taskBoardWord: 'لوحة المهام',
  overviewTabUppercase: 'نظرة عامة', monthlyCollectionsTabUppercase: 'التحصيلات الشهرية'
};

let enBlock = transC.substring(0, transC.indexOf('ar: {'));
let arBlock = transC.substring(transC.indexOf('ar: {'));

let finalEnKeys = '';
Object.entries(newEnKeys).forEach(([k, v]) => {
  if (!enBlock.includes(`${k}: `)) finalEnKeys += `    ${k}: '${v}',\n`;
});

let finalArKeys = '';
Object.entries(newArKeys).forEach(([k, v]) => {
  if (!arBlock.includes(`${k}: `)) finalArKeys += `    ${k}: '${v}',\n`;
});

if (finalEnKeys) {
  transC = transC.replace('ar: {', finalEnKeys + '  ar: {');
}
if (finalArKeys) {
  let lastBrace = transC.lastIndexOf('  }');
  transC = transC.substring(0, lastBrace) + finalArKeys + transC.substring(lastBrace);
}
fs.writeFileSync(transPath, transC, 'utf8');

// Helper to replace text
function replaceInFile(relPath, replacements) {
  const fp = path.join(projectRoot, relPath);
  if (!fs.existsSync(fp)) return;
  let c = fs.readFileSync(fp, 'utf8');
  for (const [search, replace] of Object.entries(replacements)) {
    c = c.split(search).join(replace);
  }
  fs.writeFileSync(fp, c, 'utf8');
}

// 1. AnalyticsPage.tsx
replaceInFile('src/features/analytics/AnalyticsPage.tsx', {
  "months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']": "months = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')]",
  "label: 'Total Revenue'": "label: t('totalRevenue')",
  "label: 'Total Expenses'": "label: t('totalExpenses')",
  "label: 'Net Profit'": "label: t('netProfit')",
  "label: 'Pending Invoices'": "label: t('pendingInvoices')",
  ">Week<": ">{t('week')}<",
  ">Month<": ">{t('monthLabel')}<",
  ">6M<": ">{t('sixMonths')}<",
  ">Year<": ">{t('yearLabel')}<",
  ">Live Data<": ">{t('liveData')}<",
  "name: 'Draft'": "name: t('draft')",
  "name: 'In Review'": "name: t('inReview')",
  "name: 'Revision'": "name: t('revision')",
  "name: 'Approved'": "name: t('approved')",
  "name: 'Completed'": "name: t('completed')"
});

// 2. CalendarPage.tsx
replaceInFile('src/features/calendar/CalendarPage.tsx', {
  "'en-US'": "language === 'ar' ? 'ar-EG' : 'en-US'",
  ">Month<": ">{t('monthLabel')}<",
  ">Day<": ">{t('dayLabel')}<",
  ">Upcoming<": ">{t('upcomingTasks')}<",
  "Tasks<": "{t('tasksWord')}<",
  "+ New Task / Event": "+ {t('newTaskEvent')}",
  "{d}": "{t(d.toLowerCase() as any)}",
  "No upcoming events.": "لا يوجد مهام قادمة",
  "Detailed view for the selected day": "عرض تفصيلي لليوم المحدد",
  "No tasks or events scheduled for this day.": "لا توجد مهام أو أحداث مجدولة لهذا اليوم."
});

// 3. TasksPage.tsx
replaceInFile('src/features/tasks/TasksPage.tsx', {
  "Organize and track your tasks with drag and drop": "{t('organizeTasks')}",
  "TOTAL": "{t('totalWord')}",
  "All Priorities": "{t('allPriorities')}",
  "TO DO": "{t('todo')}",
  "DOING": "{t('doing')}",
  "DONE": "{t('done')}",
  "Add another list": "{t('addAnotherList')}",
  "+ Add another list": "+ {t('addAnotherList')}",
  "Task Board": "{t('taskBoardWord')}"
});

// 4. PaymentsPage.tsx
replaceInFile('src/features/payments/PaymentsPage.tsx', {
  "Overview<": "{t('overviewTabUppercase')}<",
  "Monthly Collections<": "{t('monthlyCollectionsTabUppercase')}<",
  "Total Net Balance": "{t('totalNetBalance')}",
  "INCOME (THIS MONTH)": "{t('incomeThisMonth')}",
  "EXPENSES (THIS MONTH)": "{t('expensesThisMonth')}",
  "FIXED INCOME/MONTH": "{t('fixedIncomeMonth')}",
  "PROFIT RATIO": "{t('profitRatio')}",
  "DESCRIPTION<": "{t('descriptionText')}<",
  "CATEGORY<": "{t('categoriesTags')}<",
  "DATE<": "{t('date')}<",
  "TYPE<": "{t('type')}<",
  "SOURCE<": "{t('source')}<",
  "AMOUNT<": "{t('amount')}<",
  "ACTIONS<": "{t('actions')}<",
});

// Also fix tasks.tsx columns if 'TO DO' etc are in a string format, wait, they are from stage.name usually.
// If stages are dynamic from DB, they need to be translated at the DB level, or mapped dynamically using `t(stage.name.toLowerCase()) || stage.name`.

console.log('Fixed more translations');

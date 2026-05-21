const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/home/work/flmr-studio/flmr-studio-app';

// Helper to replace text
function replaceInFile(relPath, replacements) {
  const fp = path.join(projectRoot, relPath);
  if (!fs.existsSync(fp)) return;
  let c = fs.readFileSync(fp, 'utf8');
  
  for (const [search, replace] of Object.entries(replacements)) {
    c = c.split(search).join(replace);
  }
  
  fs.writeFileSync(fp, c, 'utf8');
  console.log('Fixed', relPath);
}

// 1. Translations.ts Update
const translationsFp = path.join(projectRoot, 'src/lib/translations.ts');
let transC = fs.readFileSync(translationsFp, 'utf8');

const additionalEn = `
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
    sun: 'SUN', mon: 'MON', tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT',
    week: 'Week', month: 'Month', sixMonths: '6M', year: 'Year', day: 'Day',
    tasks: 'Tasks', doing: 'Doing', addAnotherList: 'Add another list',
    organizeTasks: 'Organize and track your tasks with drag and drop',
    totalWord: 'TOTAL', incomeText: 'Income', expenseText: 'Expense',
    upcomingTasks: 'UPCOMING',
    allPriorities: 'All Priorities',
    taskBoardWord: 'Task Board',
`;
const additionalAr = `
    jan: 'يناير', feb: 'فبراير', mar: 'مارس', apr: 'أبريل', may: 'مايو', jun: 'يونيو', jul: 'يوليو', aug: 'أغسطس', sep: 'سبتمبر', oct: 'أكتوبر', nov: 'نوفمبر', dec: 'ديسمبر',
    sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة', sat: 'السبت',
    week: 'أسبوع', month: 'شهر', sixMonths: '6 أشهر', year: 'سنة', day: 'يوم',
    tasks: 'المهام', doing: 'قيد التنفيذ', addAnotherList: 'إضافة قائمة أخرى',
    organizeTasks: 'تنظيم وتتبع مهامك بكل سهولة',
    totalWord: 'الإجمالي', incomeText: 'دخل', expenseText: 'مصروف',
    upcomingTasks: 'المهام القادمة',
    allPriorities: 'كل الأولويات',
    taskBoardWord: 'لوحة المهام',
`;

// Insert into EN
if (!transC.includes("jan: 'Jan'")) {
  transC = transC.replace("dashboard: 'Dashboard',", additionalEn + "\\n    dashboard: 'Dashboard',");
}
// Insert into AR
if (!transC.includes("jan: 'يناير'")) {
  transC = transC.replace("dashboard: 'لوحة التحكم',", additionalAr + "\\n    dashboard: 'لوحة التحكم',");
}
fs.writeFileSync(translationsFp, transC, 'utf8');


// 2. AnalyticsPage.tsx
replaceInFile('src/features/analytics/AnalyticsPage.tsx', {
  "['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']": "[t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')]",
  "'Total Revenue'": "t('totalRevenue')",
  "'Total Expenses'": "t('totalExpenses')",
  "'Net Profit'": "t('netProfit')",
  "'Pending Invoices'": "t('pendingInvoices')",
  ">Week<": ">{t('week')}<",
  ">Month<": ">{t('month')}<",
  ">6M<": ">{t('sixMonths')}<",
  ">Year<": ">{t('year")}<", // Wait, earlier I used double quotes for others. Let's use single.
  ">Year<": ">{t('year')}<",
  "'Live Data'": "t('liveData')"
});

// 3. PaymentsPage.tsx
replaceInFile('src/features/payments/PaymentsPage.tsx', {
  ">Overview<": ">{t('overviewTab')}<",
  ">Monthly Collections<": ">{t('monthlyCollectionsTab')}<",
  "Total Net Balance": "{t('totalNetBalance')}",
  ">INCOME (THIS MONTH)<": ">{t('incomeThisMonth')}<",
  ">EXPENSES (THIS MONTH)<": ">{t('expensesThisMonth')}<",
  ">FIXED INCOME/MONTH<": ">{t('fixedIncomeMonth')}<",
  ">PROFIT RATIO<": ">{t('profitRatio')}<",
  "+ ADD INCOME": "+ {t('addIncome')}",
  "- ADD EXPENSE": "- {t('addExpense')}",
  ">DESCRIPTION<": ">{t('descriptionText')}<",
  ">CATEGORY<": ">{t('categoriesTags')}<",
  ">DATE<": ">{t('date')}<",
  ">TYPE<": ">{t('type')}<",
  ">SOURCE<": ">{t('source')}<",
  ">AMOUNT<": ">{t('amount')}<",
  ">ACTIONS<": ">{t('actions')}<",
  ">Income<": ">{t('incomeText')}<",
  ">Expense<": ">{t('expenseText')}<",
  ">Manual<": ">{t('categoryManual')}<",
  ">General<": ">{t('categoryGeneral')}<",
});

// 4. CalendarPage.tsx
// Needs to handle date-fns localization.
const calendarFp = path.join(projectRoot, 'src/features/calendar/CalendarPage.tsx');
if (fs.existsSync(calendarFp)) {
  let c = fs.readFileSync(calendarFp, 'utf8');
  if (!c.includes("import { ar, enUS } from 'date-fns/locale'")) {
    c = c.replace("import { format, ", "import { ar, enUS } from 'date-fns/locale';\\nimport { format, ");
  }
  c = c.replace("format(currentDate, 'MMMM yyyy')", "format(currentDate, 'MMMM yyyy', { locale: language === 'ar' ? ar : enUS })");
  c = c.replace("format(day, 'MMM d, yyyy')", "format(day, 'MMM d, yyyy', { locale: language === 'ar' ? ar : enUS })");
  c = c.replace("format(new Date(task.dueDate), 'MM/dd/yyyy • hh:mm a')", "format(new Date(task.dueDate), 'MM/dd/yyyy • hh:mm a', { locale: language === 'ar' ? ar : enUS })");
  
  c = c.split(">SUN<").join(">{t('sun')}<");
  c = c.split(">MON<").join(">{t('mon')}<");
  c = c.split(">TUE<").join(">{t('tue')}<");
  c = c.split(">WED<").join(">{t('wed')}<");
  c = c.split(">THU<").join(">{t('thu')}<");
  c = c.split(">FRI<").join(">{t('fri')}<");
  c = c.split(">SAT<").join(">{t('sat')}<");
  c = c.split(">Month<").join(">{t('month')}<");
  c = c.split(">Day<").join(">{t('day')}<");
  c = c.split("+ New Task / Event").join("+ {t('newTaskEvent')}");
  c = c.split(">UPCOMING<").join(">{t('upcomingTasks')}<");
  c = c.split("Tasks<").join("{t('tasks')}<");
  c = c.split(">Task<").join(">{t('tasks')}<"); // or task
  fs.writeFileSync(calendarFp, c, 'utf8');
}

// 5. TasksPage.tsx
replaceInFile('src/features/tasks/TasksPage.tsx', {
  "Organize and track your tasks with drag and drop": "{t('organizeTasks')}",
  "+ New Task": "+ {t('newTaskEvent')}",
  ">TOTAL<": ">{t('totalWord')}<",
  ">All Priorities<": ">{t('allPriorities')}<",
  ">TO DO<": ">{t('todo')}<",
  ">DOING<": ">{t('doing')}<",
  ">DONE<": ">{t('done')}<",
  "+ Add another list": "+ {t('addAnotherList')}",
  "+ ADD TASK": "+ {t('addTask')}",
  "Task Board": "{t('taskBoardWord')}"
});

// AppShell Sidebar (checking if it needs localization)
replaceInFile('src/components/layout/Sidebar.tsx', {
  ">Dashboard<": ">{t('dashboard')}<",
  ">Analytics<": ">{t('analytics')}<",
  ">Clients<": ">{t('clients')}<",
  ">Projects<": ">{t('projects')}<",
  ">Calendar<": ">{t('calendar')}<",
  ">Payments<": ">{t('payments')}<",
  ">Settings<": ">{t('settings')}<",
});

console.log('Done translations.');

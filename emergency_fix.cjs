const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';

// 1. Fix translations.ts
const tp = path.join(root, 'src/lib/translations.ts');
let t = fs.readFileSync(tp, 'utf8');

const additionalEn = `
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
    sun: 'SUN', mon: 'MON', tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT',
    week: 'Week', monthLabel: 'Month', sixMonths: '6M', yearLabel: 'Year', dayLabel: 'Day',
    tasksWord: 'Tasks', doing: 'Doing', addAnotherList: 'Add another list',
    organizeTasks: 'Organize and track your tasks with drag and drop',
    totalWord: 'TOTAL', incomeText: 'Income', expenseText: 'Expense',
    upcomingTasks: 'UPCOMING',
    allPriorities: 'All Priorities',
    taskBoardWord: 'Task Board',
    overviewTabUppercase: 'OVERVIEW', monthlyCollectionsTabUppercase: 'MONTHLY COLLECTIONS',
    draft: 'Draft', inReview: 'In Review', revision: 'Revision', approved: 'Approved', completed: 'Completed',
`;

// It got placed above `ar: {`, which is right after `en: { ... },`
// Let's remove the broken keys inserted before `ar: {`
t = t.replace(/jan: 'Jan'[\s\S]*monthlyCollectionsTabUppercase: 'MONTHLY COLLECTIONS',\n/, '');
t = t.replace(/jan: 'يناير'[\s\S]*monthlyCollectionsTabUppercase: 'التحصيلات الشهرية',\n/, '');
t = t.replace(/draft: 'Draft'[\s\S]*completed: 'Completed',\n/, '');

// Clean any leftover commas and re-inject inside `en:`
const enInjection = `
  en: {
${additionalEn}
`;
t = t.replace('en: {', enInjection);

const additionalAr = `
    jan: 'يناير', feb: 'فبراير', mar: 'مارس', apr: 'أبريل', may: 'مايو', jun: 'يونيو', jul: 'يوليو', aug: 'أغسطس', sep: 'سبتمبر', oct: 'أكتوبر', nov: 'نوفمبر', dec: 'ديسمبر',
    sun: 'الأحد', mon: 'الإثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة', sat: 'السبت',
    week: 'أسبوع', monthLabel: 'شهر', sixMonths: '6 أشهر', yearLabel: 'سنة', dayLabel: 'يوم',
    tasksWord: 'المهام', doing: 'قيد التنفيذ', addAnotherList: 'إضافة قائمة أخرى',
    organizeTasks: 'تنظيم وتتبع مهامك بكل سهولة',
    totalWord: 'الإجمالي', incomeText: 'دخل', expenseText: 'مصروف',
    upcomingTasks: 'المهام القادمة',
    allPriorities: 'كل الأولويات',
    taskBoardWord: 'لوحة المهام',
    overviewTabUppercase: 'نظرة عامة', monthlyCollectionsTabUppercase: 'التحصيلات الشهرية',
    draft: 'مسودة', inReview: 'قيد المراجعة', revision: 'تعديلات', approved: 'مُعتمد', completed: 'مكتمل',
`;
const arInjection = `
  ar: {
${additionalAr}
`;
t = t.replace('ar: {', arInjection);

fs.writeFileSync(tp, t, 'utf8');

// 2. Fix CalendarPage.tsx language reference
const cp = path.join(root, 'src/features/calendar/CalendarPage.tsx');
let c = fs.readFileSync(cp, 'utf8');
c = c.replace('const { t } = useSettings()', 'const { language, t } = useSettings()');
fs.writeFileSync(cp, c, 'utf8');

console.log('Fixed syntax issues.');

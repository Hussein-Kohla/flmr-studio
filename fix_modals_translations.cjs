const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';

// 1. Update translations.ts
const tp = path.join(root, 'src/lib/translations.ts');
let tObj = fs.readFileSync(tp, 'utf8');

const additionalEn = `
    createNewEntry: 'Create New Entry', eventTab: 'EVENT', projectTab: 'PROJECT', taskTab: 'TASK', publishingTab: 'PUBLISHING',
    titleLabelUppercase: 'TITLE', eventTitlePlaceholder: 'Event Title', dateAndTime: 'DATE & TIME', eventTypeLabel: 'EVENT TYPE',
    advancedOptionsClientProject: 'Advanced Options (Client & Project)', notesDescriptionLabel: 'Notes & Description',
    addNewClientTitle: 'ADD NEW CLIENT', clientNameUppercase: 'CLIENT NAME', egJohnDoe: 'e.g. John Doe', companyUppercase: 'COMPANY',
    companyNamePlaceholder: 'Company Name', emailUppercase: 'EMAIL', emailPlaceholder: 'email@example.com',
    phoneSim1Uppercase: 'PHONE (SIM 1)', primaryNumber: 'Primary Number', phoneSim2Uppercase: 'PHONE (SIM 2)',
    secondaryNumber: 'Secondary Number', clientTypeService: 'CLIENT TYPE / SERVICE', accountManagerUppercase: 'ACCOUNT MANAGER',
    managerNamePlaceholder: 'Manager Name', collectionOfficerUppercase: 'COLLECTION OFFICER', collectorNamePlaceholder: 'Collector Name',
    categoriesTagsUppercase: 'CATEGORIES / TAGS', newTaskTitle: 'New Task', taskTitleUppercase: 'TASK TITLE',
    whatNeedsToBeDone: 'What needs to be done?', advancedOptionsTask: 'Advanced Options (Description, Priority, Client)',
    revenueProfitTrendLabel: 'Revenue & Profit Trend (Last 6 Months)', profitLegend: 'Profit', revenueLegend: 'Revenue',
    projectPipelineLabel: 'Project Pipeline', addClientButton: 'ADD CLIENT',
`;
const additionalAr = `
    createNewEntry: 'إنشاء إدخال جديد', eventTab: 'حدث', projectTab: 'مشروع', taskTab: 'مهمة', publishingTab: 'نشر',
    titleLabelUppercase: 'العنوان', eventTitlePlaceholder: 'عنوان الحدث', dateAndTime: 'التاريخ والوقت', eventTypeLabel: 'نوع الحدث',
    advancedOptionsClientProject: 'خيارات متقدمة (العميل والمشروع)', notesDescriptionLabel: 'ملاحظات ووصف',
    addNewClientTitle: 'إضافة عميل جديد', clientNameUppercase: 'اسم العميل', egJohnDoe: 'مثال: أحمد محمد', companyUppercase: 'الشركة',
    companyNamePlaceholder: 'اسم الشركة', emailUppercase: 'البريد الإلكتروني', emailPlaceholder: 'email@example.com',
    phoneSim1Uppercase: 'الهاتف (شريحة 1)', primaryNumber: 'الرقم الأساسي', phoneSim2Uppercase: 'الهاتف (شريحة 2)',
    secondaryNumber: 'الرقم الثانوي', clientTypeService: 'نوع العميل / الخدمة', accountManagerUppercase: 'مدير الحساب',
    managerNamePlaceholder: 'اسم المدير', collectionOfficerUppercase: 'مسؤول التحصيل', collectorNamePlaceholder: 'اسم المحصل',
    categoriesTagsUppercase: 'الفئات / العلامات', newTaskTitle: 'مهمة جديدة', taskTitleUppercase: 'عنوان المهمة',
    whatNeedsToBeDone: 'ما الذي يجب القيام به؟', advancedOptionsTask: 'خيارات متقدمة (الوصف، الأولوية، العميل)',
    revenueProfitTrendLabel: 'اتجاه الإيرادات والأرباح (آخر 6 أشهر)', profitLegend: 'الربح', revenueLegend: 'الإيرادات',
    projectPipelineLabel: 'مسار المشاريع', addClientButton: 'إضافة عميل',
`;

if (!tObj.includes('createNewEntry:')) {
  tObj = tObj.replace('en: {', 'en: {' + additionalEn);
  tObj = tObj.replace('ar: {', 'ar: {' + additionalAr);
  fs.writeFileSync(tp, tObj, 'utf8');
}

// Helper to replace text
function replaceInFile(relPath, replacements, imports) {
  const fp = path.join(root, relPath);
  if (!fs.existsSync(fp)) return;
  let c = fs.readFileSync(fp, 'utf8');

  if (imports && !c.includes('useSettings')) {
    c = c.replace('import React', 'import { useSettings } from "@/hooks/useSettings";\nimport React');
  }

  // Inject hook
  if (imports && !c.includes('const { t } = useSettings()')) {
    c = c.replace(/export function \w+\([^)]*\) \{/, (match) => match + '\n  const { t } = useSettings();');
  }

  for (const [search, replace] of Object.entries(replacements)) {
    c = c.split(search).join(replace);
  }
  fs.writeFileSync(fp, c, 'utf8');
}

// 1. NewEventModal.tsx
replaceInFile('src/features/calendar/NewEventModal.tsx', {
  "Create New Entry": "{t('createNewEntry')}",
  "EVENT<": "{t('eventTab')}<",
  "PROJECT<": "{t('projectTab')}<",
  "TASK<": "{t('taskTab')}<",
  "PUBLISHING<": "{t('publishingTab')}<",
  ">TITLE *<": ">{t('titleLabelUppercase')} *<",
  'placeholder="Event Title"': 'placeholder={t("eventTitlePlaceholder")}',
  "DATE & TIME *": "{t('dateAndTime')} *",
  "EVENT TYPE *": "{t('eventTypeLabel')} *",
  "Advanced Options (Client & Project)": "{t('advancedOptionsClientProject')}",
  "Notes & Description": "{t('notesDescriptionLabel')}",
  "Cancel<": "{t('cancel')}<",
  "Save Changes<": "{t('saveChanges')}<"
}, true);

// 2. NewClientModal.tsx
replaceInFile('src/features/clients/NewClientModal.tsx', {
  ">ADD NEW CLIENT<": ">{t('addNewClientTitle')}<",
  ">CLIENT NAME *<": ">{t('clientNameUppercase')} *<",
  'placeholder="e.g. John Doe"': 'placeholder={t("egJohnDoe")}',
  ">COMPANY<": ">{t('companyUppercase')}<",
  'placeholder="Company Name"': 'placeholder={t("companyNamePlaceholder")}',
  ">EMAIL<": ">{t('emailUppercase')}<",
  'placeholder="email@example.com"': 'placeholder={t("emailPlaceholder")}',
  ">PHONE (SIM 1)<": ">{t('phoneSim1Uppercase')}<",
  'placeholder="Primary Number"': 'placeholder={t("primaryNumber")}',
  ">PHONE (SIM 2)<": ">{t('phoneSim2Uppercase')}<",
  'placeholder="Secondary Number"': 'placeholder={t("secondaryNumber")}',
  ">CLIENT TYPE / SERVICE<": ">{t('clientTypeService')}<",
  ">ACCOUNT MANAGER<": ">{t('accountManagerUppercase')}<",
  'placeholder="Manager Name"': 'placeholder={t("managerNamePlaceholder")}',
  ">COLLECTION OFFICER<": ">{t('collectionOfficerUppercase')}<",
  'placeholder="Collector Name"': 'placeholder={t("collectorNamePlaceholder")}',
  ">CATEGORIES / TAGS<": ">{t('categoriesTagsUppercase')}<",
  ">CANCEL<": ">{t('cancel')}<",
  ">ADD CLIENT<": ">{t('addClientButton')}<"
}, true);

// 3. NewTaskModal.tsx
replaceInFile('src/features/tasks/NewTaskModal.tsx', {
  ">New Task<": ">{t('newTaskTitle')}<",
  ">TASK TITLE<": ">{t('taskTitleUppercase')}<",
  'placeholder="What needs to be done?"': 'placeholder={t("whatNeedsToBeDone")}',
  ">Advanced Options (Description, Priority, Client)<": ">{t('advancedOptionsTask')}<",
  ">Create Task<": ">{t('createTask')}<",
  "import { useAuth } from '@/hooks/useAuth';": "import { useAuth } from '@/hooks/useAuth';\nimport { useSettings } from '@/hooks/useSettings';"
}, true);

// Let's make sure useSettings hook is inside NewTaskModal
let ntmFp = path.join(root, 'src/features/tasks/NewTaskModal.tsx');
if (fs.existsSync(ntmFp)) {
  let c = fs.readFileSync(ntmFp, 'utf8');
  if (!c.includes('const { t }')) {
    c = c.replace(/export function NewTaskModal\([^)]*\) \{/, (match) => match + '\n  const { t } = useSettings();');
    fs.writeFileSync(ntmFp, c, 'utf8');
  }
}

// 4. DashboardPage.tsx
replaceInFile('src/features/dashboard/DashboardPage.tsx', {
  "Revenue & Profit Trend (Last 6 Months)": "{t('revenueProfitTrendLabel')}",
  "name: 'Profit'": "name: t('profitLegend')",
  "name: 'Revenue'": "name: t('revenueLegend')",
  "Project Pipeline": "{t('projectPipelineLabel')}"
}, true);

console.log('Done translations fix.');

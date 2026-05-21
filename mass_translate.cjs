const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

const replacements = {
  'features/clients/ClientAnalyticsPage.tsx': {
    '>Back to Clients<': '>{t("backToClients")}<',
    '>Total Clients<': '>{t("totalClients")}<',
    '>Total Projects<': '>{t("totalProjectsCount")}<',
    '>Avg. Proj. Value<': '>{t("avgProjValue")}<',
    '>Active Rate<': '>{t("activeRate")}<',
    '>proj/client<': '>{t("projPerClient")}<',
    '>Top 10 Clients by Revenue<': '>{t("top10ClientsRevenue")}<',
    '>Project Volume vs Completion<': '>{t("projVolumeVsCompletion")}<',
    '>Top 10 Clients by Average Monthly Income<': '>{t("top10ClientsAvgIncome")}<',
    '>Top Clients List<': '>{t("topClientsList")}<',
    '>Client Name<': '>{t("clientNameHeader")}<',
    '>Projects<': '>{t("projectsHeader")}<',
    '>Average Monthly Income<': '>{t("avgMonthlyIncomeHeader")}<',
    '>Client Analytics<': '>{t("clientAnalyticsTitle")}<',
    '>Deep dive into client value, project volume, and payment behavior.<': '>{t("clientAnalyticsDesc")}<'
  },
  'features/clients/ClientsPage.tsx': {
    '>TOTAL CLIENTS<': '>{t("totalClientsUppercase")}<',
    '>ACTIVE PROJECTS<': '>{t("activeProjectsUppercase")}<',
    '>TOTAL AVERAGE MONTHLY<': '>{t("totalAverageMonthly")}<',
    '>AVG. MONTHLY INCOME<': '>{t("avgMonthlyIncomeUppercase")}<',
    '>Add New Client<': '>{t("addNewClientButton")}<',
    'placeholder="Search clients..."': 'placeholder={t("searchClientsPlaceholder")}',
    '>Client Name *<': '>{t("clientNameLabel")}<',
    '>Company<': '>{t("companyLabel")}<',
    '>Phone (SIM 1)<': '>{t("phoneSim1Label")}<',
    '>Phone (SIM 2)<': '>{t("phoneSim2Label")}<',
    '>Client Type / Service<': '>{t("clientTypeServiceLabel")}<',
    '>Account Manager<': '>{t("accountManagerLabel")}<',
    '>Collection Officer<': '>{t("collectionOfficerLabel")}<',
    '>Categories / Tags<': '>{t("categoriesTagsLabel")}<',
    '>Facebook Ads (إعلانات فيس بوك)<': '>{t("facebookAds")}<',
    '>Video Editing (مونتاج)<': '>{t("videoEditing")}<',
    '>Photography (تصوير)<': '>{t("photography")}<',
    '>Graphic Design (تصميم)<': '>{t("graphicDesign")}<',
    '>Other (أخرى)<': '>{t("otherService")}<'
  },
  'features/projects/ProjectsPage.tsx': {
    'placeholder="Search projects..."': 'placeholder={t("searchProjectsPlaceholder")}',
    '>List view is under construction...<': '>{t("listViewUnderConstruction")}<',
    '>PROGRESS<': '>{t("progressUppercase")}<'
  },
  'features/projects/ProjectDrawer.tsx': {
    '>Production Progress<': '>{t("productionProgress")}<',
    '>Project Description<': '>{t("projectDescription")}<',
    '>Project Steps & Progress<': '>{t("projectStepsProgress")}<',
    '>No steps added yet<': '>{t("noStepsAdded")}<',
    '>Timeline & Status<': '>{t("timelineAndStatus")}<',
    '>Current Stage<': '>{t("currentStage")}<',
    'placeholder="Enter project details, objectives, requirements..."': 'placeholder={t("enterProjectDetails")}',
    'placeholder="Add a new step..."': 'placeholder={t("addNewStepPlaceholder")}'
  },
  'features/payments/PaymentsPage.tsx': {
    '>Export<': '>{t("exportButton")}<',
    '>Overview<': '>{t("overviewTab")}<',
    '>Monthly Collections<': '>{t("monthlyCollectionsTab")}<',
    '>Add Income<': '>{t("addIncomeButton")}<',
    '>Add Expense<': '>{t("addExpenseButton")}<',
    '>Income (This Month)<': '>{t("incomeThisMonth")}<',
    '>Expenses (This Month)<': '>{t("expensesThisMonth")}<',
    '>Fixed Income/Month<': '>{t("fixedIncomeMonth")}<',
    '>Profit Ratio<': '>{t("profitRatio")}<',
    '>Recent Transactions<': '>{t("recentTransactions")}<',
    '>Income Only<': '>{t("incomeOnly")}<',
    '>Expenses Only<': '>{t("expensesOnly")}<',
    '>No transactions yet<': '>{t("noTransactionsYet")}<',
    '>Start by adding your first income or expense<': '>{t("startByAddingTx")}<',
    '>Category<': '>{t("categoryHeader")}<',
    '>Type<': '>{t("typeHeader")}<',
    '>Source<': '>{t("sourceHeader")}<',
    '>Actions<': '>{t("actionsHeader")}<',
    '>Overview of recurring monthly income. Select a month to view and record payments.<': '>{t("overviewRecurringIncome")}<',
    '>Total Expected<': '>{t("totalExpected")}<',
    '>Collected<': '>{t("collectedAmount")}<',
    '>Remaining<': '>{t("remainingAmount")}<',
    '>Client Count<': '>{t("clientCount")}<',
    '>Progress<': '>{t("progressLabel")}<',
    '>Monthly Amount<': '>{t("monthlyAmount")}<',
    '>Due Day<': '>{t("dueDay")}<',
    '>Mark as Paid<': '>{t("markAsPaid")}<',
    '>No subscription clients found<': '>{t("noSubClients")}<'
  },
  'features/settings/SettingsPage.tsx': {
    '>Settings<': '>{t("settings")}<',
    '>General<': '>{t("generalTab")}<',
    '>Language<': '>{t("languageLabel")}<',
    '>Theme<': '>{t("themeLabel")}<'
  },
  'features/calendar/CalendarPage.tsx': {
    '>Today<': '>{t("today")}<',
    '>Month<': '>{t("monthView")}<',
    '>Day<': '>{t("dayView")}<',
    '>Completed<': '>{t("completed")}<'
  },
  'features/tasks/TasksPage.tsx': {
    '>New Task<': '>{t("newTask")}<',
    '>Total<': '>{t("totalCount")}<',
    '>Urgent<': '>{t("urgent")}<',
    '>Task<': '>{t("taskLabel")}<',
    '>Add Task<': '>{t("addTask")}<',
    'placeholder="List name..."': 'placeholder={t("listNamePlaceholder")}',
    '>Add<': '>{t("addButton")}<'
  }
};

const newEn = {
  backToClients: 'Back to Clients',
  totalClients: 'Total Clients',
  totalProjectsCount: 'Total Projects',
  avgProjValue: 'Avg. Proj. Value',
  activeRate: 'Active Rate',
  projPerClient: 'proj/client',
  top10ClientsRevenue: 'Top 10 Clients by Revenue',
  projVolumeVsCompletion: 'Project Volume vs Completion',
  top10ClientsAvgIncome: 'Top 10 Clients by Average Monthly Income',
  topClientsList: 'Top Clients List',
  clientNameHeader: 'Client Name',
  projectsHeader: 'Projects',
  avgMonthlyIncomeHeader: 'Average Monthly Income',
  clientAnalyticsTitle: 'Client Analytics',
  clientAnalyticsDesc: 'Deep dive into client value, project volume, and payment behavior.',
  totalClientsUppercase: 'TOTAL CLIENTS',
  activeProjectsUppercase: 'ACTIVE PROJECTS',
  totalAverageMonthly: 'TOTAL AVERAGE MONTHLY',
  avgMonthlyIncomeUppercase: 'AVG. MONTHLY INCOME',
  addNewClientButton: 'Add New Client',
  searchClientsPlaceholder: 'Search clients...',
  clientNameLabel: 'Client Name',
  companyLabel: 'Company',
  phoneSim1Label: 'Phone (SIM 1)',
  phoneSim2Label: 'Phone (SIM 2)',
  clientTypeServiceLabel: 'Client Type / Service',
  accountManagerLabel: 'Account Manager',
  collectionOfficerLabel: 'Collection Officer',
  categoriesTagsLabel: 'Categories / Tags',
  facebookAds: 'Facebook Ads',
  videoEditing: 'Video Editing',
  photography: 'Photography',
  graphicDesign: 'Graphic Design',
  otherService: 'Other',
  listViewUnderConstruction: 'List view is under construction...',
  progressUppercase: 'PROGRESS',
  productionProgress: 'Production Progress',
  projectDescription: 'Project Description',
  projectStepsProgress: 'Project Steps & Progress',
  noStepsAdded: 'No steps added yet',
  timelineAndStatus: 'Timeline & Status',
  currentStage: 'Current Stage',
  enterProjectDetails: 'Enter project details, objectives, requirements...',
  addNewStepPlaceholder: 'Add a new step...',
  exportButton: 'Export',
  overviewTab: 'Overview',
  monthlyCollectionsTab: 'Monthly Collections',
  addIncomeButton: 'Add Income',
  addExpenseButton: 'Add Expense',
  incomeThisMonth: 'Income (This Month)',
  expensesThisMonth: 'Expenses (This Month)',
  fixedIncomeMonth: 'Fixed Income/Month',
  profitRatio: 'Profit Ratio',
  recentTransactions: 'Recent Transactions',
  incomeOnly: 'Income Only',
  expensesOnly: 'Expenses Only',
  noTransactionsYet: 'No transactions yet',
  startByAddingTx: 'Start by adding your first income or expense',
  categoryHeader: 'Category',
  typeHeader: 'Type',
  sourceHeader: 'Source',
  actionsHeader: 'Actions',
  overviewRecurringIncome: 'Overview of recurring monthly income. Select a month to view and record payments.',
  totalExpected: 'Total Expected',
  collectedAmount: 'Collected',
  remainingAmount: 'Remaining',
  clientCount: 'Client Count',
  progressLabel: 'Progress',
  monthlyAmount: 'Monthly Amount',
  dueDay: 'Due Day',
  markAsPaid: 'Mark as Paid',
  noSubClients: 'No subscription clients found',
  generalTab: 'General',
  languageLabel: 'Language',
  themeLabel: 'Theme',
  today: 'Today',
  monthView: 'Month',
  dayView: 'Day',
  completed: 'Completed',
  newTask: 'New Task',
  totalCount: 'Total',
  urgent: 'Urgent',
  taskLabel: 'Task',
  addTask: 'Add Task',
  listNamePlaceholder: 'List name...',
  addButton: 'Add'
};

const newAr = {
  backToClients: 'العودة للعملاء',
  totalClients: 'إجمالي العملاء',
  totalProjectsCount: 'إجمالي المشاريع',
  avgProjValue: 'متوسط قيمة المشروع',
  activeRate: 'معدل النشاط',
  projPerClient: 'مشروع/عميل',
  top10ClientsRevenue: 'أفضل 10 عملاء حسب الإيرادات',
  projVolumeVsCompletion: 'حجم المشاريع مقابل الإنجاز',
  top10ClientsAvgIncome: 'أفضل 10 عملاء حسب متوسط الدخل الشهري',
  topClientsList: 'قائمة أفضل العملاء',
  clientNameHeader: 'اسم العميل',
  projectsHeader: 'المشاريع',
  avgMonthlyIncomeHeader: 'متوسط الدخل الشهري',
  clientAnalyticsTitle: 'تحليلات العملاء',
  clientAnalyticsDesc: 'تعمق في قيمة العملاء، حجم المشاريع وسلوك الدفع.',
  totalClientsUppercase: 'إجمالي العملاء',
  activeProjectsUppercase: 'المشاريع النشطة',
  totalAverageMonthly: 'إجمالي المتوسط الشهري',
  avgMonthlyIncomeUppercase: 'متوسط الدخل الشهري',
  addNewClientButton: 'إضافة عميل جديد',
  searchClientsPlaceholder: 'البحث عن عملاء...',
  clientNameLabel: 'اسم العميل',
  companyLabel: 'الشركة',
  phoneSim1Label: 'الهاتف (شريحة 1)',
  phoneSim2Label: 'الهاتف (شريحة 2)',
  clientTypeServiceLabel: 'نوع العميل / الخدمة',
  accountManagerLabel: 'مدير الحساب',
  collectionOfficerLabel: 'مسؤول التحصيل',
  categoriesTagsLabel: 'الفئات / العلامات',
  facebookAds: 'إعلانات فيسبوك',
  videoEditing: 'مونتاج فيديو',
  photography: 'تصوير',
  graphicDesign: 'تصميم جرافيك',
  otherService: 'أخرى',
  listViewUnderConstruction: 'طريقة عرض القائمة قيد الإنشاء...',
  progressUppercase: 'التقدم',
  productionProgress: 'تقدم الإنتاج',
  projectDescription: 'وصف المشروع',
  projectStepsProgress: 'خطوات المشروع والتقدم',
  noStepsAdded: 'لم يتم إضافة خطوات بعد',
  timelineAndStatus: 'الجدول الزمني والحالة',
  currentStage: 'المرحلة الحالية',
  enterProjectDetails: 'أدخل تفاصيل المشروع والأهداف والمتطلبات...',
  addNewStepPlaceholder: 'أضف خطوة جديدة...',
  exportButton: 'تصدير',
  overviewTab: 'نظرة عامة',
  monthlyCollectionsTab: 'التحصيلات الشهرية',
  addIncomeButton: 'إضافة دخل',
  addExpenseButton: 'إضافة مصروف',
  incomeThisMonth: 'الدخل (هذا الشهر)',
  expensesThisMonth: 'المصروفات (هذا الشهر)',
  fixedIncomeMonth: 'دخل ثابت/شهر',
  profitRatio: 'نسبة الربح',
  recentTransactions: 'أحدث المعاملات',
  incomeOnly: 'الدخل فقط',
  expensesOnly: 'المصروفات فقط',
  noTransactionsYet: 'لا توجد معاملات بعد',
  startByAddingTx: 'ابدأ بإضافة أول دخل أو مصروف',
  categoryHeader: 'الفئة',
  typeHeader: 'النوع',
  sourceHeader: 'المصدر',
  actionsHeader: 'إجراءات',
  overviewRecurringIncome: 'نظرة عامة على الدخل الشهري المتكرر. اختر شهراً لعرض وتسجيل المدفوعات.',
  totalExpected: 'الإجمالي المتوقع',
  collectedAmount: 'المُحصّل',
  remainingAmount: 'المتبقي',
  clientCount: 'عدد العملاء',
  progressLabel: 'التقدم',
  monthlyAmount: 'المبلغ الشهري',
  dueDay: 'تاريخ الاستحقاق',
  markAsPaid: 'تحديد كمدفوع',
  noSubClients: 'لا يوجد عملاء اشتراكات',
  generalTab: 'عام',
  languageLabel: 'اللغة',
  themeLabel: 'المظهر',
  today: 'اليوم',
  monthView: 'شهر',
  dayView: 'يوم',
  completed: 'مكتمل',
  newTask: 'مهمة جديدة',
  totalCount: 'الإجمالي',
  urgent: 'عاجل',
  taskLabel: 'مهمة',
  addTask: 'إضافة مهمة',
  listNamePlaceholder: 'اسم القائمة...',
  addButton: 'إضافة'
};

// 1. Process files
for (const [relPath, reps] of Object.entries(replacements)) {
  const fp = path.join(root, relPath);
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');

  // ensure imports
  if (!content.includes('useSettings')) {
    content = content.replace('import React', 'import { useSettings } from "@/hooks/useSettings";\nimport React');
  }
  if (!content.includes('const { t } = useSettings()')) {
    content = content.replace(/export function \w+\([^)]*\) \{|const \w+ = \([^)]*\) => \{/, (match) => match + '\n  const { t } = useSettings();');
  }

  for (const [search, replace] of Object.entries(reps)) {
    content = content.split(search).join(replace);
  }

  fs.writeFileSync(fp, content, 'utf8');
}

// 2. Update translations.ts
const tp = path.join(root, 'lib/translations.ts');
let tObj = fs.readFileSync(tp, 'utf8');

let enEntries = Object.entries(newEn).map(([k, v]) => `${k}: '${v}'`).join(',\n    ');
let arEntries = Object.entries(newAr).map(([k, v]) => `${k}: '${v}'`).join(',\n    ');

if (!tObj.includes('backToClients:')) {
  tObj = tObj.replace('en: {', 'en: {\n    ' + enEntries + ',');
  tObj = tObj.replace('ar: {', 'ar: {\n    ' + arEntries + ',');
  fs.writeFileSync(tp, tObj, 'utf8');
}

console.log('Mass translation complete.');

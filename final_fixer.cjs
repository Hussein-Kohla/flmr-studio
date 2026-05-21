const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

const replacements = {
  'features/calendar/NewEventModal.tsx': {
    '<label className="form-label">Category *</label>': '<label className="form-label">{t("categoryHeader")} *</label>',
    '<label className="form-label">Title *</label>': '<label className="form-label">{t("titleLabelUppercase")} *</label>',
    'Event Title': '{t("eventTitle")}',
    'Project Name': '{t("projectName")}',
    'Task Title': '{t("taskTitleLabel")}',
    'Post Title': '{t("postTitle")}',
    'label="{t(\'advancedOptionsClientProject\')}"': 'label={t("advancedOptionsClientProject")}',
    'label="{t(\'notesDescriptionLabel\')}"': 'label={t("notesDescriptionLabel")}',
    '<label className="form-label">Client Relationship</label>': '<label className="form-label">{t("clientRelationship")}</label>',
    '>No Client Association<': '>{t("noClientAssoc")}<',
    '>+ Create New Client...<': '>{t("createNewClient")}<',
    '<label className="form-label">Associated Project</label>': '<label className="form-label">{t("associatedProject")}</label>',
    '>No Project Association<': '>{t("noProjectAssoc")}<',
    '>Cancel<': '>{t("cancel")}<',
    '>Save Changes<': '>{t("saveChanges")}<',
    '<label className="form-label">Event Type *</label>': '<label className="form-label">{t("eventTypeLabel")} *</label>',
    '<label className="form-label">Budget</label>': '<label className="form-label">{t("budgetAmount")}</label>',
    '<label className="form-label">Priority</label>': '<label className="form-label">{t("priorityLabel")}</label>',
    '<label className="form-label">Platform *</label>': '<label className="form-label">{t("platformLabel")} *</label>',
    '<label className="form-label">Client *</label>': '<label className="form-label">{t("clientNameLabel")} *</label>',
  },
  'features/payments/PaymentsPage.tsx': {
    '>OVERVIEW<': '>{t("overviewTabUppercase")}<',
    '>MONTHLY COLLECTIONS<': '>{t("monthlyCollectionsTabUppercase")}<',
    '>Overview of recurring monthly income. Select a month to view and record payments.<': '>{t("overviewRecurringIncome")}<',
    '>TOTAL EXPECTED<': '>{t("totalExpectedUppercase")}<',
    '>COLLECTED<': '>{t("collectedAmountUppercase")}<',
    '>REMAINING<': '>{t("remainingAmountUppercase")}<',
    '>CLIENT COUNT<': '>{t("clientCountUppercase")}<',
    '>PROGRESS<': '>{t("progressUppercase")}<',
    '>MONTHLY AMOUNT<': '>{t("monthlyAmountUppercase")}<',
    '>DUE DAY<': '>{t("dueDayUppercase")}<',
    '>STATUS<': '>{t("statusUppercase")}<',
    '>MARK AS PAID<': '>{t("markAsPaidUppercase")}<',
    '>Pending<': '>{t("pending")}<',
  },
  'features/tasks/NewTaskModal.tsx': {
    '<label className="form-label">TASK TITLE</label>': '<label className="form-label">{t("taskTitleLabel")}</label>',
    'placeholder="ما الذي يجب القيام به؟"': 'placeholder={t("whatNeedsToBeDone")}',
    'trigger="Advanced Options (Description, Priority, Client)"': 'trigger={t("advancedOptionsTasks")}',
    '<label className="form-label text-[10px]">DESCRIPTION</label>': '<label className="form-label text-[10px]">{t("descriptionUppercase")}</label>',
    '<label className="form-label text-[10px]">PRIORITY</label>': '<label className="form-label text-[10px]">{t("priorityUppercase")}</label>',
    '<label className="form-label text-[10px]">DUE DATE</label>': '<label className="form-label text-[10px]">{t("dueDateUppercase")}</label>',
    '<label className="form-label text-[10px]">ASSIGN TO CLIENT</label>': '<label className="form-label text-[10px]">{t("assignToClientUppercase")}</label>',
    '>Medium<': '>{t("medium")}<',
    '>None<': '>{t("none")}<',
    '>Cancel<': '>{t("cancel")}<',
    '>Save Changes<': '>{t("saveChanges")}<',
  }
};

const newEn = {
  eventTitle: 'Event Title',
  postTitle: 'Post Title',
  clientRelationship: 'Client Relationship',
  noClientAssoc: 'No Client Association',
  createNewClient: '+ Create New Client...',
  associatedProject: 'Associated Project',
  noProjectAssoc: 'No Project Association',
  overviewTabUppercase: 'OVERVIEW',
  monthlyCollectionsTabUppercase: 'MONTHLY COLLECTIONS',
  totalExpectedUppercase: 'TOTAL EXPECTED',
  collectedAmountUppercase: 'COLLECTED',
  remainingAmountUppercase: 'REMAINING',
  clientCountUppercase: 'CLIENT COUNT',
  monthlyAmountUppercase: 'MONTHLY AMOUNT',
  dueDayUppercase: 'DUE DAY',
  statusUppercase: 'STATUS',
  markAsPaidUppercase: 'MARK AS PAID',
  advancedOptionsTasks: 'Advanced Options (Description, Priority, Client)',
  descriptionUppercase: 'DESCRIPTION',
  priorityUppercase: 'PRIORITY',
  dueDateUppercase: 'DUE DATE',
  assignToClientUppercase: 'ASSIGN TO CLIENT',
  none: 'None',
};

const newAr = {
  eventTitle: 'عنوان الحدث',
  postTitle: 'عنوان المنشور',
  clientRelationship: 'ارتباط العميل',
  noClientAssoc: 'بدون عميل',
  createNewClient: '+ إضافة عميل جديد...',
  associatedProject: 'المشروع المرتبط',
  noProjectAssoc: 'بدون مشروع',
  overviewTabUppercase: 'نظرة عامة',
  monthlyCollectionsTabUppercase: 'التحصيلات الشهرية',
  totalExpectedUppercase: 'الإجمالي المتوقع',
  collectedAmountUppercase: 'المُحصّل',
  remainingAmountUppercase: 'المتبقي',
  clientCountUppercase: 'عدد العملاء',
  monthlyAmountUppercase: 'المبلغ الشهري',
  dueDayUppercase: 'تاريخ الاستحقاق',
  statusUppercase: 'الحالة',
  markAsPaidUppercase: 'تحديد كمدفوع',
  advancedOptionsTasks: 'خيارات متقدمة (الوصف، الأولوية، العميل)',
  descriptionUppercase: 'الوصف',
  priorityUppercase: 'الأولوية',
  dueDateUppercase: 'تاريخ الاستحقاق',
  assignToClientUppercase: 'تعيين لعميل',
  none: 'لا يوجد',
};

for (const [relPath, reps] of Object.entries(replacements)) {
  const fp = path.join(root, relPath);
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');

  for (const [search, replace] of Object.entries(reps)) {
    content = content.split(search).join(replace);
  }

  fs.writeFileSync(fp, content, 'utf8');
}

// Update translations.ts safely (append to bottom before last bracket)
const tp = path.join(root, 'lib/translations.ts');
let tObj = fs.readFileSync(tp, 'utf8');

// Using the same deduplication/reconstruction logic
let transLines = tObj.split('\n');
let inEn = false;
let inAr = false;
let seenEn = new Set();
let seenAr = new Set();
let outLines = [];

for (let i = 0; i < transLines.length; i++) {
  let line = transLines[i];
  if (line.includes('en: {')) { inEn = true; inAr = false; outLines.push(line); continue; }
  if (line.includes('ar: {')) { inAr = true; inEn = false; outLines.push(line); continue; }
  if (line.trim() === '},' || line.trim() === '}') { 
    if (inEn && !inAr) { inEn = false; }
    else if (inAr) { inAr = false; }
    outLines.push(line); continue; 
  }
  if (inEn || inAr) {
    let match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (match) {
      let key = match[1];
      if (inEn) {
        if (seenEn.has(key)) { continue; }
        seenEn.add(key);
      } else if (inAr) {
        if (seenAr.has(key)) { continue; }
        seenAr.add(key);
      }
    }
  }
  outLines.push(line);
}

tObj = outLines.join('\n');
let enEntries = Object.entries(newEn).map(([k, v]) => `${k}: '${v}'`).join(',\n    ');
let arEntries = Object.entries(newAr).map(([k, v]) => `${k}: '${v}'`).join(',\n    ');

if (!tObj.includes('assignToClientUppercase:')) {
  tObj = tObj.replace('en: {', 'en: {\n    ' + enEntries + ',');
  tObj = tObj.replace('ar: {', 'ar: {\n    ' + arEntries + ',');
}
fs.writeFileSync(tp, tObj, 'utf8');

console.log('Final fixes applied.');

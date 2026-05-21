const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

const replacements = {
  'features/clients/NewClientModal.tsx': {
    'label="Client Name *"': 'label={`${t("clientNameLabel")} *`}',
    'label="Company"': 'label={t("companyLabel")}',
    'label="Email"': 'label={t("emailUppercase")}',
    'label="Phone (SIM 1)"': 'label={t("phoneSim1Label")}',
    'label="Phone (SIM 2)"': 'label={t("phoneSim2Label")}',
    'label="Client Type / Service"': 'label={t("clientTypeServiceLabel")}',
    'label="Account Manager"': 'label={t("accountManagerLabel")}',
    'label="Collection Officer"': 'label={t("collectionOfficerLabel")}',
    'label="Categories / Tags"': 'label={t("categoriesTagsLabel")}',
  },
  'features/calendar/NewEventModal.tsx': {
    'label="Category *"': 'label={`${t("categoryHeader")} *`}',
    'label="Title *"': 'label={`${t("titleLabelUppercase")} *`}',
    'label="Event Type *"': 'label={`${t("eventTypeLabel")} *`}',
    'label="Budget"': 'label={t("budgetAmount")}',
    'label="Priority"': 'label={t("priorityLabel")}',
    'label="Platform *"': 'label={`${t("platformLabel")} *`}',
    'label="Client *"': 'label={`${t("clientNameLabel")} *`}',
    'label="Status"': 'label={t("statusLabel")}',
    'label="Description / Notes"': 'label={t("notesDescriptionLabel")}',
  }
};

const newEn = {
  budgetAmount: 'Budget',
  priorityLabel: 'Priority',
  platformLabel: 'Platform',
  statusLabel: 'Status'
};

const newAr = {
  budgetAmount: 'الميزانية',
  priorityLabel: 'الأولوية',
  platformLabel: 'المنصة',
  statusLabel: 'الحالة'
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

// Update translations.ts
const tp = path.join(root, 'lib/translations.ts');
let tObj = fs.readFileSync(tp, 'utf8');

let enEntries = Object.entries(newEn).map(([k, v]) => `${k}: '${v}'`).join(',\n    ');
let arEntries = Object.entries(newAr).map(([k, v]) => `${k}: '${v}'`).join(',\n    ');

if (!tObj.includes('budgetAmount:')) {
  tObj = tObj.replace('en: {', 'en: {\n    ' + enEntries + ',');
  tObj = tObj.replace('ar: {', 'ar: {\n    ' + arEntries + ',');
  fs.writeFileSync(tp, tObj, 'utf8');
}

console.log('Fixed labels.');

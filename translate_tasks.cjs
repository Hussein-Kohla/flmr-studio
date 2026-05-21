const fs = require('fs');
const path = require('path');

const projectRoot = 'c:/home/work/flmr-studio/flmr-studio-app';
const translationsPath = path.join(projectRoot, 'src/lib/translations.ts');

const newEnKeys = {
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
};

const newArKeys = {
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
};

// 1. Update translations.ts
let transContent = fs.readFileSync(translationsPath, 'utf8');

let enKeysStr = '';
for (const [k, v] of Object.entries(newEnKeys)) {
  if (!transContent.includes(`${k}: `)) {
    enKeysStr += `    ${k}: '${v}',\n`;
  }
}
transContent = transContent.replace('// Dashboard Page', enKeysStr + '\n    // Dashboard Page');

let arKeysStr = '';
for (const [k, v] of Object.entries(newArKeys)) {
  if (!transContent.includes(`${k}: `)) {
    arKeysStr += `    ${k}: '${v}',\n`;
  }
}
fs.writeFileSync(translationsPath, transContent, 'utf8');
transContent = fs.readFileSync(translationsPath, 'utf8');

let lastIndex = transContent.lastIndexOf('// Dashboard Page');
if (lastIndex !== -1 && arKeysStr) {
  transContent = transContent.substring(0, lastIndex) + arKeysStr + '\n    ' + transContent.substring(lastIndex);
  fs.writeFileSync(translationsPath, transContent, 'utf8');
}


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
}

// TasksPage
processFile('src/features/tasks/TasksPage.tsx', {
  '"Task Board"': 't("taskBoard")',
  '"Manage tasks and track progress"': 't("taskBoardSubtitle")',
  '"List added."': 't("listAdded")',
  '"Failed to add list."': 't("listAddFailed")',
  '"Delete this list? Tasks will remain but the list will be gone."': 't("deleteListConfirm")',
  '"List deleted."': 't("listDeleted")',
  '"Failed to delete list."': 't("listDeleteFailed")',
  '"List renamed."': 't("listRenamed")',
  '"Failed to rename list."': 't("listRenameFailed")',
  '"Task deleted."': 't("taskDeleted")',
  '"Failed to delete task."': 't("taskDeleteFailed")',
  '"Task completed!"': 't("taskCompleted")',
  '"Failed to update task."': 't("taskUpdateFailed")',
  '"Search tasks..."': 't("searchTasksPlaceholder")',
  '"All Priorities"': 't("allPriorities")',
  '"Are you sure you want to delete this task?"': 't("deleteTaskConfirm")',
  '"Mark this task as complete?"': 't("markTaskCompleteConfirm")',
}, {
  '>To Do<': '>{t("todo")}<',
  '>In Progress<': '>{t("inProgress")}<',
  '>Done<': '>{t("done")}<',
  '>Overdue<': '>{t("overdue")}<',
  '>Add Task<': '>{t("addTaskEvent")}<',
  '>Cancel<': '>{t("cancel")}<',
  '>Confirm<': '>{t("save")}<',
});

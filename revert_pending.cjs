const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';
const clientsPagePath = path.join(root, 'src/features/clients/ClientsPage.tsx');

let code = fs.readFileSync(clientsPagePath, 'utf8');

const oldLogicStart = code.indexOf('const now = new Date();');
const oldLogicEnd = code.indexOf('const totalPendingAmount =', oldLogicStart) + code.substring(code.indexOf('const totalPendingAmount =', oldLogicStart)).indexOf(';') + 1;

const oldLogic = code.substring(oldLogicStart, oldLogicEnd);

const newLogic = `
  const totalPendingAmount = transactions.filter((t: any) => t.status === 'pending').reduce((sum: number, t: any) => sum + (t.amountCents || 0), 0);
`;

code = code.replace(oldLogic, newLogic.trim());

fs.writeFileSync(clientsPagePath, code, 'utf8');
console.log('Reverted to transactions pending logic');

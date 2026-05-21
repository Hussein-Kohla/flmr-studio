const fs = require('fs');
const path = require('path');

const file = 'c:/home/work/flmr-studio/flmr-studio-app/src/features/clients/ClientsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "const totalAverageMonthly = clients.reduce((sum, c) => sum + getClientFinancials(c._id).avg, 0);",
  `const totalAverageMonthly = clients.reduce((sum, c) => sum + getClientFinancials(c._id).avg, 0);
  const totalPaidAmount = transactions.filter((t: any) => t.status === 'paid' || t.status === 'posted').reduce((sum: number, t: any) => sum + (t.amountCents || 0), 0);`
);

code = code.replace(
  '<StatCard title="TOTAL AVERAGE MONTHLY" value={`${formatCurrency(totalAverageMonthly)}`} highlight />',
  '<StatCard title="TOTAL PAID AMOUNT" value={`${formatCurrency(totalPaidAmount)}`} highlight />'
);

code = code.replace(
  "title === 'TOTAL AVERAGE MONTHLY' ? t('totalAverageMonthly') :",
  "title === 'TOTAL PAID AMOUNT' ? (language === 'ar' ? 'إجمالي المدفوع' : 'Total Paid Amount') :"
);

fs.writeFileSync(file, code, 'utf8');
console.log('Replaced successfully');

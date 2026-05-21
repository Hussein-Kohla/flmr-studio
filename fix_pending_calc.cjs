const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';
const clientsPagePath = path.join(root, 'src/features/clients/ClientsPage.tsx');

let code = fs.readFileSync(clientsPagePath, 'utf8');

const oldLogic = "const totalPendingAmount = payments.filter((p: any) => p.status !== 'paid').reduce((sum: number, p: any) => sum + (p.amountCents || 0), 0);";

const newLogic = `
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const subscriptionClients = clients.filter(c =>
    (c.subscription && (c.subscription.amountCents ?? 0) > 0) ||
    c.tags?.includes('تحصيل')
  );

  const totalExpected = subscriptionClients.reduce((acc, c) => acc + (c.subscription?.amountCents || 0), 0);
  
  const totalCollected = subscriptionClients.reduce((acc, c) => {
    const payment = transactions.find(t => 
      t.clientId === c._id && 
      t.subscriptionMonth === currentMonth && 
      t.subscriptionYear === currentYear &&
      (t.status === 'posted' || t.status === 'paid')
    );
    if (payment) {
      return acc + (payment.amountCents || c.subscription?.amountCents || 0);
    }
    return acc;
  }, 0);

  const totalPendingAmount = totalExpected > totalCollected ? totalExpected - totalCollected : 0;
`;

code = code.replace(oldLogic, newLogic.trim());

fs.writeFileSync(clientsPagePath, code, 'utf8');
console.log('Fixed pending calc in ClientsPage');

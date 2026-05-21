const fs = require('fs');
const path = require('path');

const file = 'c:/home/work/flmr-studio/flmr-studio-app/src/features/clients/ClientsPage.tsx';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('activeTab')) {
  c = c.replace(
    "const [isNewClientOpen, setIsNewClientOpen] = useState(false);",
    "const [isNewClientOpen, setIsNewClientOpen] = useState(false);\n  const [isNewStaffOpen, setIsNewStaffOpen] = useState(false);\n  const [activeTab, setActiveTab] = useState<'clients' | 'staff'>('clients');"
  );

  c = c.replace(
    "const clientsQuery = useQuery(api.clients.getClients",
    "const staffQuery = useQuery(api.staff.getStaff as any, token ? { token } : 'skip');\n  const staffList = staffQuery || [];\n  const clientsQuery = useQuery(api.clients.getClients"
  );

  c = c.replace(
    "import { NewClientModal } from './NewClientModal';",
    "import { NewClientModal } from './NewClientModal';\nimport { NewStaffModal } from './NewStaffModal';"
  );

  // Add the tab toggle under actions
  c = c.replace(
    "<Plus size={18} /> {t('newClient')}\n          </button>",
    `<Plus size={18} /> {t('newClient')}
          </button>
          <button 
            onClick={() => setIsNewStaffOpen(true)}
            className="flex items-center gap-2 bg-[#1f2937] hover:bg-[#374151] text-white px-5 py-2.5 rounded-full font-bold transition-all border border-white/10"
          >
            <Plus size={18} /> {t('addStaff') || 'إضافة موظف'}
          </button>`
  );

  // Add the Tab switcher below PageWrapper start
  c = c.replace(
    '<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" dir="rtl">',
    `<div className="flex gap-4 mb-6" dir="rtl">
        <button onClick={() => setActiveTab('clients')} className={\`px-6 py-2 rounded-xl font-bold transition-all \${activeTab === 'clients' ? 'bg-[var(--color-brand)] text-white shadow-lg' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white'}\`}>{t('clients')}</button>
        <button onClick={() => setActiveTab('staff')} className={\`px-6 py-2 rounded-xl font-bold transition-all \${activeTab === 'staff' ? 'bg-[var(--color-brand)] text-white shadow-lg' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white'}\`}>{t('staffLabel') || 'فريق العمل'}</button>
      </div>
      
      {activeTab === 'clients' ? (
      <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" dir="rtl">`
  );

  // Close the conditional render at the bottom of the file
  c = c.replace(
    "<NewClientModal isOpen={isNewClientOpen} onClose={() => setIsNewClientOpen(false)} />",
    `</>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4" dir="rtl">
          {staffList.length === 0 ? (
            <div className="col-span-full py-12 text-center text-white/50 bg-white/5 rounded-2xl border border-dashed border-white/10">
              لا يوجد موظفين مضافين بعد
            </div>
          ) : (
            staffList.map((st: any) => (
              <Card key={st._id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--color-brand)] transition-all">
                <div className="p-6 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-2 border-[var(--color-brand)] overflow-hidden">
                    <img src={st.avatarUrl || '/avatars/avatar_1.png'} alt={st.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white">{st.name}</h3>
                    <p className="text-xs text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-1 rounded-full mt-2 inline-block">
                      {st.platform || 'General'}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <NewStaffModal isOpen={isNewStaffOpen} onClose={() => setIsNewStaffOpen(false)} />
      <NewClientModal isOpen={isNewClientOpen} onClose={() => setIsNewClientOpen(false)} />`
  );

  fs.writeFileSync(file, c, 'utf8');
  console.log('ClientsPage patched.');
} else {
  console.log('Already patched.');
}

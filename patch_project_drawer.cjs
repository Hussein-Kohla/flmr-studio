const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

const stepperFile = path.join(root, 'features/projects/NewProjectStepperModal.tsx');
if (fs.existsSync(stepperFile)) {
  let c = fs.readFileSync(stepperFile, 'utf8');

  // Add staff query
  if (!c.includes('const staffQuery = useQuery(api.staff.getStaff')) {
    c = c.replace(
      "const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip');",
      "const clientsData = useQuery(api.clients.getClients, token ? { token, paginationOpts: { numItems: 1000, cursor: null } } : 'skip');\n  const staffQuery = useQuery(api.staff.getStaff as any, token ? { token } : 'skip');\n  const staffList = staffQuery || [];"
    );
  }

  // Replace MOCK_EMPLOYEES map
  if (c.includes('MOCK_EMPLOYEES.map')) {
    c = c.replace(
      /MOCK_EMPLOYEES\.map\(emp => \(/g,
      "staffList.map((emp: any) => ("
    );
    c = c.replace(
      /emp\.id/g,
      "emp._id"
    );
    c = c.replace(
      /<div className="text-2xl">\{emp\.avatar\}<\/div>/g,
      `<div className="w-10 h-10 rounded-full border border-[var(--color-brand)] overflow-hidden">
                      <img src={emp.avatarUrl || '/avatars/avatar_1.png'} alt={emp.name} className="w-full h-full object-cover" />
                    </div>`
    );
  }

  fs.writeFileSync(stepperFile, c, 'utf8');
  console.log('Patched NewProjectStepperModal.tsx');
}

// Let's also check NewTaskModal.tsx if it has hardcoded employees
const taskModalFile = path.join(root, 'features/tasks/NewTaskModal.tsx');
if (fs.existsSync(taskModalFile)) {
  let c = fs.readFileSync(taskModalFile, 'utf8');
  
  if (c.includes('const MOCK_EMPLOYEES')) {
    if (!c.includes('const staffQuery = useQuery(api.staff.getStaff')) {
      c = c.replace(
        "const { token } = useAuth();",
        "const { token } = useAuth();\n  const staffQuery = useQuery(api.staff.getStaff as any, token ? { token } : 'skip');\n  const staffList = staffQuery || [];"
      );
    }
    
    c = c.replace(
      /MOCK_EMPLOYEES\.map\(emp => \(/g,
      "staffList.map((emp: any) => ("
    );
    c = c.replace(
      /emp\.id/g,
      "emp._id"
    );
    c = c.replace(
      /<div className="text-2xl">\{emp\.avatar\}<\/div>/g,
      `<div className="w-8 h-8 rounded-full border border-[var(--color-brand)] overflow-hidden">
                    <img src={emp.avatarUrl || '/avatars/avatar_1.png'} alt={emp.name} className="w-full h-full object-cover" />
                  </div>`
    );
    
    fs.writeFileSync(taskModalFile, c, 'utf8');
    console.log('Patched NewTaskModal.tsx');
  }
}

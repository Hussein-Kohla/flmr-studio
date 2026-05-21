const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';

// 1. Update convex/schema.ts
let schemaCode = fs.readFileSync(path.join(root, 'convex/schema.ts'), 'utf8');
if (!schemaCode.includes('color: v.optional(v.string()), // staff color')) {
  schemaCode = schemaCode.replace(
    'pages: v.optional(v.array(v.string())),',
    'pages: v.optional(v.array(v.string())),\n    color: v.optional(v.string()), // staff color'
  );
  fs.writeFileSync(path.join(root, 'convex/schema.ts'), schemaCode, 'utf8');
}

// 2. Update convex/staff.ts
let staffApiCode = fs.readFileSync(path.join(root, 'convex/staff.ts'), 'utf8');
if (!staffApiCode.includes('color: v.optional(v.string()),')) {
  staffApiCode = staffApiCode.replace(
    'avatarUrl: v.optional(v.string()),',
    'avatarUrl: v.optional(v.string()),\n    color: v.optional(v.string()),'
  );
  staffApiCode = staffApiCode.replace(
    'avatarUrl: args.avatarUrl,',
    'avatarUrl: args.avatarUrl,\n      color: args.color,'
  );
  fs.writeFileSync(path.join(root, 'convex/staff.ts'), staffApiCode, 'utf8');
}

// 3. Update NewStaffModal.tsx
let staffModalCode = fs.readFileSync(path.join(root, 'src/features/clients/NewStaffModal.tsx'), 'utf8');

const newStaffModalImports = `import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';`;

staffModalCode = staffModalCode.replace(
  `import React, { useState } from 'react';\nimport { X } from 'lucide-react';\nimport { Card } from '@/components/ui/Card';\nimport { Button } from '@/components/ui/Button';\nimport { Input } from '@/components/ui/Input';\nimport { useMutation } from 'convex/react';\nimport { api } from '../../../convex/_generated/api';\nimport { useAuth } from '@/hooks/useAuth';\nimport { useSettings } from '@/hooks/useSettings';\nimport { useToast } from '@/components/ui/Toast';`,
  newStaffModalImports
);

const stateBlock = `  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CLIENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];
  const PRESET_AVATARS = [
    '/avatars/doctor_male.png', '/avatars/doctor_female.png', '/avatars/engineer_male.png', '/avatars/engineer_female.png', '/avatars/business_male.png', '/avatars/business_female.png'];`;

staffModalCode = staffModalCode.replace(
  /const \[name, setName\] = useState\(''\);[\s\S]*?';\];/m,
  stateBlock
);

staffModalCode = staffModalCode.replace(
  `await createStaff({
        token,
        name,
        avatarUrl,
        platform,
      });`,
  `await createStaff({
        token,
        name,
        avatarUrl,
        platform,
        color,
      });`
);

const renderBlock = `<div className="flex flex-col items-center justify-center gap-4 mb-2">
              <div className="w-24 h-24 rounded-full p-1 shadow-2xl shadow-indigo-500/20 transition-all duration-300" style={{ backgroundImage: \`linear-gradient(to top right, \${color}, #4f46e5)\` }}>
                <div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-2xl font-black text-[var(--text-muted)] uppercase">
                      {name ? name.slice(0, 2) : '?'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {PRESET_AVATARS.map((url, _i) => (
                  <button 
                    key={url} 
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all hover:scale-110 overflow-hidden",
                      avatarUrl === url ? 'border-[var(--color-brand)] scale-110 shadow-lg shadow-[var(--color-brand-glow)]' : 'border-[var(--border-default)]'
                    )}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2 mb-2">
                {CLIENT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setColor(c); setAvatarUrl(''); }}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                      color === c && !avatarUrl ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-60'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>`;

staffModalCode = staffModalCode.replace(
  /<div className="flex flex-col items-center justify-center gap-4">[\s\S]*?<\/div>[\s\S]*?<\/div>/m,
  renderBlock
);

fs.writeFileSync(path.join(root, 'src/features/clients/NewStaffModal.tsx'), staffModalCode, 'utf8');

// 4. Update ClientsPage.tsx to render the staff
let clientsPageCode = fs.readFileSync(path.join(root, 'src/features/clients/ClientsPage.tsx'), 'utf8');
const staffCardHtml = `<div className="p-6 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full p-1 transition-all duration-300" style={{ backgroundImage: \`linear-gradient(to top right, \${st.color || '#8b5cf6'}, #4f46e5)\` }}>
                    <div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center">
                      {st.avatarUrl ? (
                        <img src={st.avatarUrl} alt={st.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xl font-black text-[var(--text-muted)] uppercase">
                          {st.name ? st.name.slice(0, 2) : '?'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white">{st.name}</h3>
                    <p className="text-xs text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-1 rounded-full mt-2 inline-block">
                      {st.platform || 'General'}
                    </p>
                  </div>
                </div>`;

clientsPageCode = clientsPageCode.replace(
  /<div className="p-6 flex flex-col items-center gap-4">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/m,
  staffCardHtml
);

fs.writeFileSync(path.join(root, 'src/features/clients/ClientsPage.tsx'), clientsPageCode, 'utf8');
console.log('Patched staff UI');

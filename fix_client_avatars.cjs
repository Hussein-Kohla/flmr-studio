const fs = require('fs');
const path = require('path');

const filePath = 'c:/home/work/flmr-studio/flmr-studio-app/src/features/clients/ClientsPage.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Replace avatar in ExpandableClientRow
const oldRowAvatar = `<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-[var(--color-brand)] flex items-center justify-center text-white font-bold text-xs" onClick={(e) => { e.stopPropagation(); onClientClick(); }}>
            {client.name?.charAt(0)}
          </div>`;

const newRowAvatar = `<div className="w-8 h-8 rounded-full p-[2px] transition-all duration-300 flex-shrink-0 cursor-pointer" style={{ backgroundImage: \`linear-gradient(to top right, \${client.color || '#8b5cf6'}, #4f46e5)\` }} onClick={(e) => { e.stopPropagation(); onClientClick(); }}>
            <div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-[2px] overflow-hidden flex items-center justify-center relative">
              <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xs font-bold text-white uppercase absolute inset-0 z-0">
                {client.name?.charAt(0)}
              </div>
              {client.avatarUrl && (
                <img 
                  src={client.avatarUrl} 
                  alt={client.name} 
                  className="w-full h-full object-cover rounded-full absolute inset-0 z-10" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>`;

code = code.replace(oldRowAvatar, newRowAvatar);

// Replace avatar in GridCard
const oldGridAvatar = `<div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--color-brand)] to-blue-500 p-1 mb-3">
          <div className="w-full h-full bg-[var(--bg-raised)] rounded-full flex items-center justify-center text-3xl font-bold text-white">
            {client.name?.charAt(0)}
          </div>
        </div>`;

const newGridAvatar = `<div className="w-20 h-20 rounded-full p-1 mb-3 transition-all duration-300" style={{ backgroundImage: \`linear-gradient(to top right, \${client.color || '#8b5cf6'}, #4f46e5)\` }}>
          <div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center relative">
            <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-3xl font-bold text-white uppercase absolute inset-0 z-0">
              {client.name?.charAt(0)}
            </div>
            {client.avatarUrl && (
              <img 
                src={client.avatarUrl} 
                alt={client.name} 
                className="w-full h-full object-cover rounded-full absolute inset-0 z-10" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        </div>`;

code = code.replace(oldGridAvatar, newGridAvatar);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed client avatars');

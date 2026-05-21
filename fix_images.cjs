const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';
const clientsPagePath = path.join(root, 'src/features/clients/ClientsPage.tsx');

let clientsCode = fs.readFileSync(clientsPagePath, 'utf8');

const oldStaffHtml = `<div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center">
                      {st.avatarUrl ? (
                        <img src={st.avatarUrl} alt={st.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xl font-black text-[var(--text-muted)] uppercase">
                          {st.name ? st.name.slice(0, 2) : '?'}
                        </div>
                      )}
                    </div>`;

const newStaffHtml = `<div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center relative">
                      <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xl font-black text-[var(--text-muted)] uppercase absolute inset-0 z-0">
                        {st.name ? st.name.slice(0, 2) : '?'}
                      </div>
                      {st.avatarUrl && (
                        <img 
                          src={st.avatarUrl} 
                          alt={st.name} 
                          className="w-full h-full object-cover rounded-full absolute inset-0 z-10" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>`;

clientsCode = clientsCode.replace(oldStaffHtml, newStaffHtml);
fs.writeFileSync(clientsPagePath, clientsCode, 'utf8');


const staffModalPath = path.join(root, 'src/features/clients/NewStaffModal.tsx');
let staffModalCode = fs.readFileSync(staffModalPath, 'utf8');

const oldModalHtml = `<div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-2xl font-black text-[var(--text-muted)] uppercase">
                      {name ? name.slice(0, 2) : '?'}
                    </div>
                  )}
                </div>`;

const newModalHtml = `<div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center relative">
                  <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-2xl font-black text-[var(--text-muted)] uppercase absolute inset-0 z-0">
                    {name ? name.slice(0, 2) : '?'}
                  </div>
                  {avatarUrl && (
                    <img 
                      src={avatarUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-full absolute inset-0 z-10" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>`;

staffModalCode = staffModalCode.replace(oldModalHtml, newModalHtml);
fs.writeFileSync(staffModalPath, staffModalCode, 'utf8');

const clientModalPath = path.join(root, 'src/features/clients/NewClientModal.tsx');
let clientModalCode = fs.readFileSync(clientModalPath, 'utf8');

const oldClientModalHtml = `<div className="w-full h-full rounded-full bg-[var(--bg-raised)] p-1 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-2xl font-black text-[var(--text-muted)] uppercase">
                      {name ? name.slice(0, 2) : '?'}
                    </div>
                  )}
                </div>`;

clientModalCode = clientModalCode.replace(oldClientModalHtml, newModalHtml);
fs.writeFileSync(clientModalPath, clientModalCode, 'utf8');

console.log("Patched avatar fallback");

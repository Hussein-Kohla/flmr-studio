const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app';

// 1. Update convex/clients.ts
const apiPath = path.join(root, 'convex/clients.ts');
let apiCode = fs.readFileSync(apiPath, 'utf8');

// createClient args
apiCode = apiCode.replace(
  'color: v.optional(v.string()),',
  `color: v.optional(v.string()),\n    customFields: v.optional(v.array(v.object({\n      key: v.string(),\n      value: v.string(),\n    }))),`
);

fs.writeFileSync(apiPath, apiCode, 'utf8');

// 2. Update ClientDetailsModal.tsx
const detailsPath = path.join(root, 'src/features/clients/ClientDetailsModal.tsx');
let detailsCode = fs.readFileSync(detailsPath, 'utf8');

// State
if (!detailsCode.includes('customFields: client.customFields')) {
  detailsCode = detailsCode.replace(
    'accountManager: client.accountManager || \'\',',
    'accountManager: client.accountManager || \'\',\n    customFields: client.customFields || [],'
  );
}

const customFieldsUI = `
                {/* Custom Fields */}
                {formData.customFields && formData.customFields.map((field: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                      <Briefcase size={20} />
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={field.key}
                            onChange={(e) => {
                              const newFields = [...formData.customFields];
                              newFields[idx].key = e.target.value;
                              setFormData({ ...formData, customFields: newFields });
                            }}
                            placeholder="Field Name"
                            className="w-1/2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:border-[var(--color-brand)]"
                          />
                          <input 
                            type="text"
                            value={field.value}
                            onChange={(e) => {
                              const newFields = [...formData.customFields];
                              newFields[idx].value = e.target.value;
                              setFormData({ ...formData, customFields: newFields });
                            }}
                            placeholder="Value"
                            className="w-1/2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:border-[var(--color-brand)]"
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              const newFields = formData.customFields.filter((_: any, i: number) => i !== idx);
                              setFormData({ ...formData, customFields: newFields });
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">
                            {field.key}
                          </p>
                          <p className="text-sm font-bold text-white/80">{field.value}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                {isEditing && (
                  <button 
                    type="button"
                    onClick={() => {
                      const newFields = [...(formData.customFields || []), { key: '', value: '' }];
                      setFormData({ ...formData, customFields: newFields });
                    }}
                    className="flex items-center gap-2 justify-center w-full py-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-colors"
                  >
                    <Plus size={16} /> {language === 'ar' ? 'إضافة حقل جديد' : 'Add Custom Field'}
                  </button>
                )}
`;

// Insert the customFieldsUI before the "Client Status" block
detailsCode = detailsCode.replace(
  '{/* Client Status */}',
  customFieldsUI + '\n\n                {/* Client Status */}'
);

fs.writeFileSync(detailsPath, detailsCode, 'utf8');

// 3. Optional: NewClientModal.tsx 
const newClientPath = path.join(root, 'src/features/clients/NewClientModal.tsx');
let newClientCode = fs.readFileSync(newClientPath, 'utf8');
if (!newClientCode.includes('customFields')) {
  newClientCode = newClientCode.replace(
    'const [isSubmitting, setIsSubmitting] = useState(false);',
    'const [isSubmitting, setIsSubmitting] = useState(false);\n  const [customFields, setCustomFields] = useState([{key: "", value: ""}].filter(Boolean));'
  );
  
  // createClient call
  newClientCode = newClientCode.replace(
    'clientType,',
    'clientType,\n      customFields: customFields.filter(f => f.key.trim() !== ""), // Only send non-empty'
  );

  const newClientFieldsUI = `
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              {language === 'ar' ? 'حقول إضافية' : 'Custom Fields'}
            </label>
            {customFields.map((field, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input 
                  type="text"
                  placeholder={language === 'ar' ? "اسم الحقل" : "Field Name"}
                  value={field.key}
                  onChange={e => {
                    const newFields = [...customFields];
                    newFields[idx].key = e.target.value;
                    setCustomFields(newFields);
                  }}
                  className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-[var(--color-brand)] outline-none"
                />
                <input 
                  type="text"
                  placeholder={language === 'ar' ? "القيمة" : "Value"}
                  value={field.value}
                  onChange={e => {
                    const newFields = [...customFields];
                    newFields[idx].value = e.target.value;
                    setCustomFields(newFields);
                  }}
                  className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-[var(--color-brand)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                  className="w-12 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCustomFields([...customFields, { key: '', value: '' }])}
              className="h-12 border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 rounded-xl flex items-center justify-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              <Plus size={18} /> {language === 'ar' ? 'إضافة حقل جديد' : 'Add Custom Field'}
            </button>
          </div>
  `;

  newClientCode = newClientCode.replace(
    '{/* CRM Fields */}',
    newClientFieldsUI + '\n\n          {/* CRM Fields */}'
  );
  
  // Since we use 'language' we need to make sure we extract it
  if (!newClientCode.includes('const { t, language } = useSettings();')) {
    newClientCode = newClientCode.replace('const { t } = useSettings();', 'const { t, language } = useSettings();');
  }

  fs.writeFileSync(newClientPath, newClientCode, 'utf8');
}

console.log('Patched API and Modals successfully');

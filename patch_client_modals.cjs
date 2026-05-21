const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

const CLIENT_COLORS = "const CLIENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];\n";

function processModal(filePath, isDetails) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Clean PRESET_AVATARS
  content = content.replace(/'\/avatars\/avatar_\d+\.png',\s*/g, '');
  
  // 2. Add color state
  if (!content.includes('const [color,')) {
    if (isDetails) {
      content = content.replace(
        'const [avatarUrl, setAvatarUrl] = useState(client.avatarUrl || \'\');',
        'const [avatarUrl, setAvatarUrl] = useState(client.avatarUrl || \'\');\n  const [color, setColor] = useState(client.color || \'#8b5cf6\');'
      );
    } else {
      content = content.replace(
        'const [avatarUrl, setAvatarUrl] = useLocalStorage(\'new_client_avatar\', \'\');',
        'const [avatarUrl, setAvatarUrl] = useLocalStorage(\'new_client_avatar\', \'\');\n  const [color, setColor] = useLocalStorage(\'new_client_color\', \'#8b5cf6\');'
      );
    }
  }

  // Add CLIENT_COLORS definition at the top if missing
  if (!content.includes('CLIENT_COLORS = [')) {
    content = content.replace(
      'const PRESET_AVATARS = [',
      CLIENT_COLORS + '\nconst PRESET_AVATARS = ['
    );
  }

  // 3. Update API call to include color
  if (isDetails) {
    if (content.match(/updateClient\(\{[\s\S]*?token,[\s\S]*?clientId: client\._id,[\s\S]*?name/)) {
        content = content.replace(
          /(updateClient\(\{[\s\S]*?clientId: client\._id,[\s\S]*?name,)([\s\S]*?\n\s+avatarUrl,)/,
          '$1\n        color,$2'
        );
    }
  } else {
    if (content.match(/createClient\(\{[\s\S]*?token,[\s\S]*?name/)) {
        content = content.replace(
          /(createClient\(\{[\s\S]*?name,)([\s\S]*?\n\s+avatarUrl,)/,
          '$1\n        color,$2'
        );
    }
  }

  // 4. Update the Avatar rendering to use the color
  // <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[var(--color-brand)] to-[var(--color-accent)] shadow-2xl shadow-indigo-500/20">
  content = content.replace(
    /className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-\[var\(--color-brand\)\] to-\[var\(--color-accent\)\] shadow-2xl shadow-indigo-500\/20"/g,
    'className="w-24 h-24 rounded-full p-1 shadow-2xl shadow-indigo-500/20 transition-all duration-300" style={{ backgroundImage: `linear-gradient(to top right, ${color}, #4f46e5)` }}'
  );

  // 5. Add color picker UI right below the avatar list
  const colorPickerUI = `
             <div className="flex flex-wrap justify-center gap-2 mt-4 mb-2">
                {CLIENT_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                      color === c ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-60'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
             </div>
  `;

  if (!content.includes('CLIENT_COLORS.map')) {
    content = content.replace(
      /<\/div>\s*<\/div>\s*<Input/g,
      `</div>${colorPickerUI}</div>\n\n          <Input`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

processModal(path.join(root, 'features/clients/NewClientModal.tsx'), false);
processModal(path.join(root, 'features/clients/ClientDetailsModal.tsx'), true);
console.log('Patched modals');

const fs = require('fs');
const path = require('path');

const root = 'c:/home/work/flmr-studio/flmr-studio-app/src';

const files = [
  'features/clients/NewClientModal.tsx',
  'features/clients/ClientDetailsModal.tsx',
  'features/clients/NewStaffModal.tsx'
];

const newAvatars = [
  "'/avatars/doctor_male.png'",
  "'/avatars/doctor_female.png'",
  "'/avatars/engineer_male.png'",
  "'/avatars/engineer_female.png'",
  "'/avatars/business_male.png'",
  "'/avatars/business_female.png'"
].join(', ');

for (const relPath of files) {
  const fp = path.join(root, relPath);
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    
    // Find PRESET_AVATARS array
    // usually looks like: const PRESET_AVATARS = ['/avatars/avatar_1.png', '/avatars/avatar_2.png', ...];
    
    const arrayRegex = /(const\s+PRESET_AVATARS\s*=\s*\[)([^\]]+)(\];)/;
    if (arrayRegex.test(content)) {
      content = content.replace(arrayRegex, (match, p1, p2, p3) => {
        if (!p2.includes('doctor_male.png')) {
          return p1 + p2 + ', ' + newAvatars + p3;
        }
        return match;
      });
      fs.writeFileSync(fp, content, 'utf8');
      console.log('Updated', relPath);
    }
  }
}

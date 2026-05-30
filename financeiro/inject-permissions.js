const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (fs.existsSync(manifestPath)) {
  let content = fs.readFileSync(manifestPath, 'utf8');
  
  if (!content.includes('android.permission.RECORD_AUDIO')) {
    const permissionTags = `
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
`;
    
    // Injetar as tags logo antes da tag <application
    content = content.replace('<application', `${permissionTags}    <application`);
    fs.writeFileSync(manifestPath, content, 'utf8');
    console.log('✓ Permissões de microfone injetadas no AndroidManifest.xml com sucesso!');
  } else {
    console.log('As permissões de microfone já existem no manifesto.');
  }
} else {
  console.error('AndroidManifest.xml não encontrado no caminho:', manifestPath);
}

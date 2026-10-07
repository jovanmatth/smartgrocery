/**
 * AUTO-PUSH WATCHER SCRIPT
 * Memantau berkas proyek secara otomatis.
 * Setiap kali ada perubahan/penyimpanan berkas, skrip ini akan otomatis melakukan:
 * 1. git add .
 * 2. git commit -m "auto-update: sync changes at ..."
 * 3. git push origin main -> yang langsung men-trigger Vercel build secara realtime!
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WATCH_DIR = __dirname;
const IGNORED_PATHS = ['.git', 'node_modules', '.gitignore', '.log'];
let debounceTimer = null;
let isPushing = false;

console.log('🚀 [Auto-Push Watcher] Memulai pemantauan berkas proyek Smart Grocery...');
console.log('📁 Direktori:', WATCH_DIR);
console.log('⚡ Setiap perubahan berkas akan otomatis di-commit & di-push ke GitHub -> Vercel!\n');

function triggerAutoPush(filename) {
  if (isPushing) return;
  isPushing = true;

  try {
    const timestamp = new Date().toLocaleString('id-ID');
    console.log(`\n📝 [${timestamp}] Terdeteksi perubahan pada: "${filename}"`);

    // 1. Git add
    console.log('⏳ Menjalankan git add . ...');
    execSync('git add .', { cwd: WATCH_DIR, stdio: 'inherit' });

    // 2. Check if there are changes
    const status = execSync('git status --porcelain', { cwd: WATCH_DIR }).toString().trim();
    if (!status) {
      console.log('ℹ️ Tidak ada perubahan berkas untuk di-commit.');
      isPushing = false;
      return;
    }

    // 3. Git commit
    const commitMsg = `auto-sync: update ${filename || 'project files'} (${timestamp})`;
    console.log(`💾 Melakukan commit: "${commitMsg}"...`);
    execSync(`git commit -m "${commitMsg}"`, { cwd: WATCH_DIR, stdio: 'inherit' });

    // 4. Git push
    console.log('☁️ Melakukan git push origin main ke GitHub...');
    execSync('git push origin main', { cwd: WATCH_DIR, stdio: 'inherit' });

    console.log('✅ SUKSES! Perubahan telah terdorong ke GitHub. Vercel akan otomatis redeploy dalam hitungan detik!\n');
  } catch (error) {
    console.error('❌ Gagal melakukan auto-push:', error.message);
  } finally {
    isPushing = false;
  }
}

// Watch directory recursively
fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;

  // Abaikan folder tersembunyi & file log/git
  const isIgnored = IGNORED_PATHS.some(p => filename.includes(p));
  if (isIgnored) return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    triggerAutoPush(filename);
  }, 2000); // Debounce 2 detik
});

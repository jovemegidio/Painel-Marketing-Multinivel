/* ═══════════════════════════════════════════
   Credbusiness — Quick Deploy (Native SSH)
   Uses built-in Windows OpenSSH via child_process
   No external dependencies needed
   ═══════════════════════════════════════════ */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VPS_HOST = '177.153.58.152';
const VPS_USER = 'root';
const VPS_PORT = 22;
const APP_DIR = '/var/www/credbusiness';
const LOCAL_DIR = path.join(__dirname, '..');

// SSH options
const SSH_OPTS = `-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p ${VPS_PORT}`;
const DEST = `${VPS_USER}@${VPS_HOST}`;

function ssh(cmd) {
    console.log(`  $ ${cmd}`);
    try {
        const result = execSync(`ssh ${SSH_OPTS} ${DEST} "${cmd.replace(/"/g, '\\"')}"`, {
            encoding: 'utf-8',
            timeout: 120000,
            stdio: ['inherit', 'pipe', 'pipe']
        });
        if (result) console.log(result.trim());
        return result;
    } catch (e) {
        console.error(`  Error: ${e.stderr || e.message}`);
        return '';
    }
}

function scpFile(localPath, remotePath) {
    try {
        execSync(`scp ${SSH_OPTS} "${localPath}" ${DEST}:${remotePath}`, {
            encoding: 'utf-8',
            timeout: 30000,
            stdio: ['inherit', 'pipe', 'pipe']
        });
        return true;
    } catch (e) {
        console.error(`  SCP Error for ${path.basename(localPath)}: ${e.stderr || e.message}`);
        return false;
    }
}

// Collect all project files (skip node_modules, .git, .db, deploy, etc.)
function collectFiles(dir, base = '') {
    const files = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = base ? `${base}/${item}` : item;
        const stat = fs.statSync(fullPath);

        // Skip
        if (['node_modules', '.git', 'deploy', 'android', 'android-twa', 'tests', '.env', 'uploads'].some(s => relativePath.startsWith(s))) continue;
        if (item.endsWith('.db') || item.endsWith('.old.js') || item.endsWith('.idsig') || item.endsWith('.apk')) continue;
        if (item.startsWith('.')) continue;

        if (stat.isDirectory()) {
            files.push(...collectFiles(fullPath, relativePath));
        } else {
            files.push({ local: fullPath, remote: `${APP_DIR}/${relativePath}` });
        }
    }
    return files;
}

async function deploy() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  Credbusiness — Quick Deploy (Native SSH) ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    // Step 1: Test connection
    console.log('🔌 Testing SSH connection...');
    const testResult = ssh('echo "SSH OK" && node -v');
    if (!testResult.includes('SSH OK')) {
        console.error('❌ Cannot connect to VPS. Check credentials.');
        process.exit(1);
    }
    console.log('  ✅ Connected\n');

    // Step 2: Ensure directories exist
    console.log('📁 Creating directories...');
    ssh(`mkdir -p ${APP_DIR}/{database,logs,css/Fundo,js,pages,admin,middleware,routes,utils,icons,scripts}`);
    console.log('  ✅ Directories ready\n');

    // Step 3: Upload files
    console.log('📤 Uploading files...');
    const files = collectFiles(LOCAL_DIR);
    console.log(`  ${files.length} files to upload\n`);

    // Create remote directories first
    const dirs = new Set();
    files.forEach(f => {
        const dir = path.dirname(f.remote);
        dirs.add(dir);
    });
    const dirList = Array.from(dirs).join(' ');
    ssh(`mkdir -p ${dirList}`);

    let uploaded = 0;
    let failed = 0;
    for (const file of files) {
        process.stdout.write(`\r  Uploading: ${uploaded + 1}/${files.length} - ${path.basename(file.local)}                    `);
        if (scpFile(file.local, file.remote)) {
            uploaded++;
        } else {
            failed++;
        }
    }
    console.log(`\n  ✅ ${uploaded} uploaded, ${failed} failed\n`);

    // Step 4: Preserve .env (don't overwrite existing)
    console.log('⚙️  Checking .env...');
    ssh(`test -f ${APP_DIR}/.env && echo "ENV exists" || echo "Creating .env"`);
    // Only create .env if it doesn't exist
    ssh(`test -f ${APP_DIR}/.env || cat > ${APP_DIR}/.env << 'ENVEOF'
PORT=3001
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
DB_PATH=./database/credbusiness.db
DOMAIN=mkt-credbusiness.vps-kinghost.net
ASAAS_API_KEY=
ASAAS_ENV=production
ASAAS_WEBHOOK_TOKEN=
ENVEOF`);
    console.log('  ✅ .env checked\n');

    // Step 5: Install dependencies
    console.log('📦 Installing dependencies...');
    ssh(`cd ${APP_DIR} && npm install --production 2>&1 | tail -5`);
    console.log('  ✅ Dependencies installed\n');

    // Step 6: Restart with PM2
    console.log('🚀 Restarting application...');
    ssh(`cd ${APP_DIR} && pm2 delete credbusiness 2>/dev/null; pm2 start server.js --name credbusiness --max-memory-restart 512M && pm2 save`);
    console.log('  ✅ Application restarted\n');

    // Step 7: Verify
    console.log('🔍 Verifying...');
    setTimeout(() => {
        const status = ssh('pm2 list');
        const httpCheck = ssh('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/content/settings');
        console.log(`  HTTP Status: ${httpCheck.trim()}`);

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║  ✅ DEPLOY COMPLETO!                                      ║');
        console.log('║  🌐 http://mkt-credbusiness.vps-kinghost.net               ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        process.exit(0);
    }, 3000);
}

deploy().catch(err => {
    console.error('❌ Deploy error:', err.message);
    process.exit(1);
});

// Quick deploy: upload single file and restart PM2
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const VPS = {
    host: process.env.VPS_HOST || '177.153.58.152',
    port: Number(process.env.VPS_PORT) || 22,
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASSWORD,
    readyTimeout: 30000
};
if (!VPS.password) { console.error('❌ VPS_PASSWORD não definida no .env'); process.exit(1); }

const APP_DIR = '/var/www/credbusiness';
const filesToUpload = [
    { local: 'pages/contratos.html', remote: `${APP_DIR}/pages/contratos.html` },
    { local: 'routes/admin.js', remote: `${APP_DIR}/routes/admin.js` },
    { local: 'admin/users.html', remote: `${APP_DIR}/admin/users.html` },
];

const c = new Client();

function exec(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => out += d);
            stream.stderr.on('data', d => out += d);
            stream.on('close', () => resolve(out));
        });
    });
}

c.on('ready', async () => {
    console.log('🔗 Conectado à VPS\n');

    const sftp = await new Promise((res, rej) => c.sftp((e, s) => e ? rej(e) : res(s)));

    for (const file of filesToUpload) {
        const localPath = path.join(__dirname, '..', file.local);
        const content = fs.readFileSync(localPath);
        await new Promise((resolve, reject) => {
            const ws = sftp.createWriteStream(file.remote);
            ws.on('close', () => { console.log(`  ✅ ${file.local}`); resolve(); });
            ws.on('error', reject);
            ws.end(content);
        });
    }

    console.log('\n🔄 Reiniciando aplicação...');
    const out = await exec(c, `cd ${APP_DIR} && pm2 restart credbusiness`);
    console.log('  ', out.trim());

    await new Promise(r => setTimeout(r, 3000));
    const status = await exec(c, 'pm2 status');
    console.log('\n📊 Status PM2:');
    console.log(status);

    console.log('\n✅ Deploy concluído!');
    c.end();
});

c.on('error', (err) => { console.error('❌ Erro SSH:', err.message); process.exit(1); });
c.connect(VPS);

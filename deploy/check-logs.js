const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('tail -40 /var/www/credbusiness/logs/error-0.log 2>&1; echo "===OUT==="; tail -20 /var/www/credbusiness/logs/out-0.log 2>&1', (e, s) => {
        let o = '';
        s.on('data', d => o += d);
        s.stderr.on('data', d => o += d);
        s.on('close', () => { console.log(o); c.end(); });
    });
});
c.connect({ host: 'YOUR_VPS_IP', port: 22, username: 'root', password: 'CHANGE_ME_VPS_PASSWORD' });

// PM2 Ecosystem Configuration
module.exports = {
    apps: [
        {
            name: 'credbusiness',
            script: 'server.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            },
            error_file: '/var/www/credbusiness/logs/error.log',
            out_file: '/var/www/credbusiness/logs/out.log',
            log_file: '/var/www/credbusiness/logs/combined.log',
            time: true
        },
        {
            name: 'credbusiness-banco',
            script: 'node_modules/.bin/next',
            args: 'start -p 3002',
            cwd: '/var/www/credbusiness/GloryBank',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'production',
                PORT: 3002,
                DEMO_MODE: 'true'
            },
            error_file: '/var/www/credbusiness/logs/banco-error.log',
            out_file: '/var/www/credbusiness/logs/banco-out.log',
            log_file: '/var/www/credbusiness/logs/banco-combined.log',
            time: true
        }
    ]
};

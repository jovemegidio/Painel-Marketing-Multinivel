# CredBusiness — Plataforma de Consultoria Financeira & Internet Banking

Plataforma completa de consultoria financeira (recuperação de crédito, contestação de negativações, programa de indicação) + Internet Banking digital com PIX, boletos, transferências e cartão virtual via **Asaas BaaS**.

## Acesso

| Ambiente | URL |
|---|---|
| Painel (Escritório Virtual) | https://credbusinessconsultoria.com.br |
| Internet Banking | https://credbusinessconsultoria.com.br/banco |
| VPS | mkt-credbusiness.vps-kinghost.net |

## Arquitetura

```
┌──────────────────────────────────────────────────┐
│                    Nginx (443)                    │
│    SSL · Gzip · Security Headers · Proxy          │
├──────────────────────┬───────────────────────────┤
│  /  → :3001          │  /banco → :3002            │
│  Express + SQLite    │  Next.js 16 (App Router)   │
│  Escritório Virtual  │  Internet Banking          │
│  JWT · REST API      │  Asaas BaaS · Prisma       │
└──────────────────────┴───────────────────────────┘
```

## Stack

| Camada | Escritório Virtual | Internet Banking |
|---|---|---|
| Framework | Express 4.x | Next.js 16.2 |
| Banco | SQLite (better-sqlite3) | PostgreSQL (Prisma 6) |
| Auth | JWT + bcrypt | JWT HttpOnly + bcrypt |
| Pagamentos | Asaas (gateway) | Asaas (BaaS completo) |
| UI | HTML/CSS/JS | React 19 + Tailwind v4 |
| Deploy | PM2 + Nginx | PM2 + Nginx |

## Funcionalidades

### Escritório Virtual (Limpa Nome)
- Gestão de usuários e rede multinível
- Limpa Nome (contestação de negativações)
- Consulta CPF/CNPJ e Bacen (SVR)
- Programa de indicação com comissões em 3 níveis
- Universidade (treinamentos em vídeo)
- Pagamentos via Asaas (PIX, boleto)
- Landing page editável via admin CMS
- App Android (TWA)

### Internet Banking (GloryBank)
- Dashboard com saldo e transações
- PIX instantâneo (envio, recebimento, QR Code)
- Transferências TED/PIX
- Boletos bancários registrados
- Cartão virtual
- Extrato com filtros
- Agendamentos
- Notificações
- Modo demo (funciona sem banco/API)

## Segurança

| Medida | Descrição |
|---|---|
| JWT HttpOnly | Cookie seguro, não acessível via JS |
| bcrypt 12 rounds | Hash de senhas |
| Rate Limiting | 300 req/15min geral, 15/15min auth |
| CSP + Security Headers | Proteção contra XSS, clickjacking |
| CSRF | Proteção cross-site |
| 2FA TOTP | Autenticação em dois fatores |
| Zod | Validação de entrada nas APIs |
| Audit Log | Registro de operações sensíveis |
| AES-256 | Criptografia de dados |

## Deploy

### Quick Deploy (Escritório Virtual)
```powershell
.\deploy\quick-deploy.ps1
```

### Deploy Internet Banking
```powershell
.\deploy\deploy-banco.ps1
```

### Deploy completo (primeira vez)
```bash
node deploy/deploy.js
```

### Atualizar Nginx com SSL
```bash
node deploy/fix-nginx-ssl.js
```

## Variáveis de Ambiente

### Escritório Virtual (.env)
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=<segredo>
DB_PATH=./database/credbusiness.db
ASAAS_API_KEY=<chave>
ASAAS_ENV=production
```

### Internet Banking (GloryBank/.env)
```env
PORT=3002
DEMO_MODE=true
JWT_SECRET=<segredo>
NEXT_PUBLIC_APP_URL=https://credbusinessconsultoria.com.br/banco
DATABASE_URL=<postgres>
ASAAS_API_KEY=<chave>
ASAAS_API_URL=https://api.asaas.com/api/v3
```

## Estrutura do Projeto

```
├── server.js                 # Backend Express (escritório virtual)
├── ecosystem.config.js       # PM2 config (ambos os apps)
├── index.html                # Landing page principal
├── admin/                    # Painel administrativo
├── pages/                    # Páginas do escritório virtual
├── routes/                   # Rotas API REST
├── js/                       # Scripts frontend
├── css/                      # Estilos
├── deploy/                   # Scripts de deploy
│   ├── deploy.js             # Deploy completo via SSH
│   ├── quick-deploy.ps1      # Deploy rápido (arquivos)
│   ├── deploy-banco.ps1      # Deploy do Internet Banking
│   └── fix-nginx-ssl.js      # Config Nginx + SSL
├── GloryBank/                # Internet Banking (Next.js)
│   ├── src/app/              # App Router (pages, API routes)
│   ├── src/components/       # Componentes React
│   ├── src/lib/              # Auth, Asaas client, validações
│   ├── prisma/               # Schema + seed
│   └── public/               # Assets estáticos
└── README.md
```

## Executar Localmente

```bash
# Escritório Virtual
npm install
npm run dev  # http://localhost:3001

# Internet Banking
cd GloryBank
npm install
npm run dev  # http://localhost:3000/banco
```

## Contato

Desenvolvido por [jovemegidio](https://github.com/jovemegidio)

---

**© 2026 CredBusiness. Serviços financeiros por [Asaas Pagamentos S.A.](https://www.asaas.com), regulada pelo Banco Central do Brasil.**


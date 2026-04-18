# CredBusiness — Internet Banking Digital

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16"/>
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19"/>
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind v4"/>
  <img src="https://img.shields.io/badge/BaaS-Asaas-00a650?style=for-the-badge" alt="Asaas BaaS"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript 5"/>
</p>

<p align="center">
  Internet banking digital completo com PIX, boletos, transferências e cartão virtual.<br/>
  Infraestrutura financeira via <strong>Asaas BaaS</strong>, regulada pelo Banco Central do Brasil.
</p>

---

## Acesso

| Ambiente | URL |
|---|---|
| Produção | https://credbusinessconsultoria.com.br/banco |
| Demo local | http://localhost:3000/banco |

Credenciais de demonstração:

| Campo | Valor |
|---|---|
| Login | `demo@credbusiness.com` |
| Senha | `Demo@123456` |

> O botão **"Entrar como Demo"** na tela de login faz o acesso com um clique.

---

## Funcionalidades

| Funcionalidade | Status |
|---|---|
| Login / Logout / 2FA | ✅ |
| Dashboard com saldo em tempo real | ✅ |
| PIX (envio, recebimento, QR Code) | ✅ |
| Transferências TED/PIX | ✅ |
| Boletos bancários registrados | ✅ |
| Cartão virtual | ✅ |
| Extrato com filtros e paginação | ✅ |
| Agendamentos de transferências | ✅ |
| Notificações | ✅ |
| Modo demo (sem banco/API) | ✅ |
| PWA (instalável) | ✅ |
| Responsivo (mobile/tablet/desktop) | ✅ |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.2 (App Router) |
| Linguagem | TypeScript 5 |
| React | 19.2.4 |
| UI | Tailwind CSS v4 |
| ORM | Prisma 6.6 (PostgreSQL) |
| Auth | JWT HttpOnly (jose) + bcrypt 12 rounds |
| Formulários | react-hook-form + Zod |
| Ícones | Lucide React |
| BaaS | Asaas Pagamentos (PIX, boleto, TED, sub-accounts) |
| Deploy | PM2 + Nginx (VPS) / Vercel |

---

## Arquitetura

```
src/
├── app/
│   ├── page.tsx                    # Landing page institucional
│   ├── layout.tsx                  # Root layout (Geist fonts, PWA)
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login + demo
│   │   └── register/page.tsx       # Registro com CPF/CNPJ
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── page.tsx            # Dashboard principal
│   │       ├── pix/               # PIX
│   │       ├── transferir/        # Transferências
│   │       ├── boleto/            # Boletos
│   │       ├── extrato/           # Extrato
│   │       ├── cartao/            # Cartão virtual
│   │       ├── conta/             # Dados da conta
│   │       ├── notificacoes/      # Central de notificações
│   │       └── agendamentos/      # Transferências agendadas
│   └── api/
│       ├── auth/                  # Login, registro, sessão, 2FA
│       ├── asaas/                 # Balance, PIX, boleto, TED, webhook
│       ├── notifications/         # Notificações
│       └── card/                  # Cartão virtual
├── components/
│   ├── ui/                        # Button, Input, Card, Modal, Loading
│   └── dashboard/                 # Shell, Sidebar, Header, BalanceCard
├── lib/
│   ├── auth.ts                    # JWT, sessão, getCurrentUser()
│   ├── asaas.ts                   # Asaas API client (BaaS)
│   ├── demo.ts                    # Mock data para modo demo
│   ├── validations.ts             # Schemas Zod (CPF/CNPJ checksum)
│   ├── rate-limit.ts              # Rate limiter em memória
│   ├── audit.ts                   # Audit log
│   └── prisma.ts                  # Singleton PrismaClient
└── types/
    └── index.ts                   # Tipos TypeScript
```

---

## Segurança

| Medida | Implementação |
|---|---|
| JWT HttpOnly | Cookie seguro, 7 dias, sameSite lax |
| bcrypt | 12 rounds para hash de senhas |
| Rate Limiting | 5 login/15min, 20 tx/min |
| CSP | Content Security Policy restritivo |
| Security Headers | X-Frame-Options, HSTS, X-Content-Type |
| 2FA TOTP | Autenticação em dois fatores |
| Zod | Validação de CPF/CNPJ com checksum |
| Audit Log | Registro de operações sensíveis |
| Middleware | Guard em todas as rotas protegidas |

---

## Modo Demo

Quando `DEMO_MODE=true`, o app funciona **sem banco de dados e sem credenciais Asaas**:

- Login com `demo@credbusiness.com` / `Demo@123456`
- Saldo simulado: R$ 12.450,00
- Transações e PIX simulados
- Registro desabilitado
- Ideal para apresentações e demonstrações

---

## Variáveis de Ambiente

| Variável | Descrição | Demo |
|---|---|---|
| `DEMO_MODE` | Modo demonstração | `true` |
| `JWT_SECRET` | Chave JWT (64+ chars) | qualquer string |
| `NEXT_PUBLIC_APP_URL` | URL pública | URL do deploy |
| `DATABASE_URL` | PostgreSQL (Prisma) | não necessário no demo |
| `ASAAS_API_KEY` | Chave Asaas | não necessário no demo |
| `ASAAS_API_URL` | URL API Asaas | sandbox ou production |

---

## Executar Localmente

```bash
npm install
npm run dev
# http://localhost:3000/banco
```

## Deploy na VPS

```powershell
# Pelo script dedicado
.\deploy\deploy-banco.ps1
```

O app roda na porta **3002** com PM2, atrás do Nginx em `/banco`.

---

## Licença

MIT

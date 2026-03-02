# Sistema de Gestão de Acessos aos Armários — PROPPGI/UFCSPA

Sistema web para gerenciar armários/chaves de laboratório, com controle de usuários, alocações (empréstimos), devoluções, histórico e auditoria.  
Projeto dividido em **Backend (NestJS + Prisma + PostgreSQL)** e **Frontend (React + Vite + Tailwind)**.

---

## Funcionalidades principais

### Gestão de Armários
- Listagem com busca e filtros
- Status: **Livre**, **Ocupado**, **Manutenção**
- CRUD de armários (criar/editar/excluir)
- Restrições para manter consistência (ex.: não excluir armário com alocação ativa)

### Gestão de Usuários
- CRUD de usuários
- Regras de integridade:
  - não permite excluir usuário com **alocação ativa**
  - não permite excluir usuário com **histórico** (mantém rastreabilidade)

### Alocações (Empréstimos)
- Registrar alocação (saída)
- Registrar devolução (check-in)
- Histórico por usuário e por armário
- Auditoria automática das operações

### Relatórios
- Auditoria filtrável por período
- Exportação em **CSV**
- Exportação em **PDF** formatado (PDFKit)

### Segurança
- Rotas protegidas no frontend (necessita login)
- Guard no backend validando e-mail (ex.: domínio institucional e lista de autorizados)

### Configurações (essenciais)
- Regras de alocação
- Notificações
- Segurança
- Aparência

---

## Tecnologias

### Backend
- Node.js
- NestJS
- Prisma ORM
- PostgreSQL
- PDFKit (geração de PDF)
- Nodemailer (infra para e-mail, se habilitado)

### Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- React Router

---

## Pré-requisitos
- Node.js (recomendado LTS)
- PostgreSQL rodando localmente (ou via Docker)
- npm / pnpm / yarn (use o que teu projeto já usa)

---

## Como rodar (desenvolvimento)

> **1) Backend**
```bash
cd apps/api
cp .env.example .env
# configure DATABASE_URL e demais variáveis

npx prisma generate
npx prisma migrate dev

npm run dev
# API em: http://localhost:3000

cd apps/web
cp .env.example .env
# VITE_API_URL=http://localhost:3000

npm run dev
# Web em: http://localhost:5173

2) Frontend

cd apps/web
cp .env.example .env
# VITE_API_URL=http://localhost:3000

npm run dev
# Web em: http://localhost:5173
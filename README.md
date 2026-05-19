# TaskBoard

> Portfolio-grade Kanban task manager. Trabalho em progresso.

## Status

- [x] **Plan 1 — Foundation + Backend completo**
      Fastify 5 + Prisma 6 + Postgres 16, auth com JWT + refresh rotativo + detecção de reuso,
      CRUD multi-user de tasks/categories/comments, Swagger UI em `/docs`, ~94 testes verdes
      entre `@taskboard/shared` e `@taskboard/api`.
- [ ] Plan 2 — Frontend (React 19 + Tailwind + shadcn/ui + TanStack Query + dnd-kit)
- [ ] Plan 3 — Docker compose completo (api + web), E2E Playwright, GitHub Actions, README profissional com GIF

## Stack atual (backend)

Node 22+, Fastify 5, Prisma 6, Postgres 16, Zod 3, JWT (jsonwebtoken),
bcrypt, pino, Vitest, pnpm + Turborepo, ESLint flat config, Prettier, Husky + commitlint.

## Como rodar agora (apenas backend)

```bash
pnpm install
docker compose up -d postgres
cd apps/api
cp .env.example .env
pnpm prisma migrate dev
pnpm prisma:seed
pnpm dev
```

- Swagger UI: <http://localhost:3001/docs>
- Health: <http://localhost:3001/healthz>

## Como rodar os testes

```bash
pnpm test
```

## Estrutura do monorepo (atual)

```
apps/
  api/          Fastify backend
packages/
  shared/       Schemas Zod compartilhados (front+back)
docs/
  superpowers/  specs + plans (gerados durante o desenvolvimento)
```

## Licença

MIT

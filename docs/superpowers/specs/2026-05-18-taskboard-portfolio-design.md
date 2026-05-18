# TaskBoard — Portfolio-grade Kanban (Design Spec)

- **Data:** 2026-05-18
- **Autor:** Ricardo Galvao
- **Status:** Aprovado para implementação
- **Origem:** Refactor do projeto `workshop-aws-main` (Bun + SQLite + React 19) para um projeto modelo demonstrando competências de desenvolvedor sênior full-stack.

---

## 1. Objetivo

Transformar o Kanban de tarefas existente em um repositório público no GitHub que sirva como **principal peça de portfolio** para vagas sênior full-stack TypeScript no mercado brasileiro e internacional. O projeto deve ser legível, testado, dockerizado e demonstrar decisões de arquitetura defensáveis em entrevistas técnicas.

### Critérios de sucesso

1. Recrutador clona, roda `docker compose up` e tem o app no ar em menos de 3 minutos.
2. README transmite seniority em menos de 30 segundos de leitura (badges, GIF, decisões).
3. CI verde em todos os PRs (lint, typecheck, unit, integration, e2e, build).
4. Cobertura de testes ≥ 70% no backend e ≥ 50% no frontend.
5. Zero `any`, zero `eslint-disable` sem justificativa, zero warnings no build.
6. Cada decisão técnica não óbvia tem um ADR de 1 página.

### Não-objetivos

- Deploy em produção (out of scope desta fase; pode ser fase futura).
- Multi-tenant complexo (organizações, times, papéis avançados). Cada usuário é seu próprio "tenant" simples.
- Funcionalidades de produto além do CRUD de tarefas + comentários + categorias.
- Integração com AWS específica (não é um workshop AWS, apesar do nome da pasta original).

---

## 2. Stack consolidada

| Camada | Tecnologia | Motivo |
|---|---|---|
| Runtime | Node 22 LTS | Mainstream, sem fricção de leitura. |
| Backend framework | Fastify 5 | Performance, DX e schema-first compatível com Zod. |
| ORM | Prisma 6 | Migrations versionadas, type-safe, padrão de mercado. |
| DB | Postgres 16 | Padrão profissional; substitui SQLite. |
| Validação | Zod | Schemas compartilhados front+back. |
| Auth | JWT (access 15min) + refresh rotativo 7d em DB, bcrypt cost 12 | Demonstra cuidado com segurança e domínio do tópico. |
| Logs | pino | Estruturado, com redact de campos sensíveis. |
| Docs API | `@fastify/swagger` + Swagger UI | OpenAPI 3 em `/docs`. |
| Frontend framework | React 19 + Vite 7 | Mantém base atual, moderno. |
| UI | Tailwind 4 + shadcn/ui + lucide-react | Visual de produto real. |
| Server state | TanStack Query 5 | Cache, mutations otimistas, retries. |
| Forms | react-hook-form + zod | Integrado ao schema compartilhado. |
| Drag & drop | dnd-kit | Acessível e moderno. |
| Toasts | sonner | Leve e elegante. |
| Tema | Hook custom de dark mode + `prefers-color-scheme` | Esperado em produto 2026; evita dependência específica de Next. |
| Testes (unit/integration) | Vitest + React Testing Library | Padrão atual da comunidade. |
| Testes (e2e) | Playwright | Padrão de mercado. |
| Lint/format | ESLint flat config + Prettier | Configuração na raiz, compartilhada. |
| Monorepo | pnpm workspaces + Turborepo | Cache de build/test, mostra organização. |
| Git hooks | Husky + lint-staged + commitlint | Conventional Commits enforcement. |
| Container | Docker multi-stage + docker-compose | Zero-fricção para o recrutador. |
| CI | GitHub Actions | Jobs: lint, typecheck, test:unit, test:e2e, build. |

---

## 3. Arquitetura de alto nível

```
[Browser]
   │  HTTPS (local: HTTP)
   ▼
[apps/web — React/Vite]
   │  fetch JSON via TanStack Query
   ▼
[apps/api — Fastify]
   ├─ routes      → controllers finos (request → service)
   ├─ services    → regra de negócio
   ├─ repositories→ acesso a dados (encapsula Prisma)
   ├─ schemas     → validação Zod (importa de packages/shared)
   ├─ plugins     → auth, error-handler, logger, swagger
   └─ Prisma Client
        │
        ▼
   [Postgres]
```

### Princípios

- **Camadas isoladas**: controller não conhece Prisma; service não conhece Fastify Request.
- **Schemas no centro**: o mesmo schema Zod valida no front (form) e no back (rota). Tipos derivados via `z.infer`.
- **Erros tipados**: classe `AppError` com `code` e `statusCode`; error handler global converte para resposta JSON consistente.
- **Repository pattern leve**: não inventar abstração desnecessária, mas encapsular Prisma para testabilidade.

---

## 4. Estrutura de pastas

```
taskboard/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ app.ts                 build do Fastify (sem listen — testável)
│  │  │  ├─ server.ts              listen
│  │  │  ├─ env.ts                 validação de env com Zod
│  │  │  ├─ plugins/
│  │  │  │  ├─ auth.ts             decorator request.user
│  │  │  │  ├─ error-handler.ts
│  │  │  │  ├─ logger.ts
│  │  │  │  └─ swagger.ts
│  │  │  ├─ modules/
│  │  │  │  ├─ auth/
│  │  │  │  │  ├─ auth.routes.ts
│  │  │  │  │  ├─ auth.service.ts
│  │  │  │  │  ├─ auth.repository.ts
│  │  │  │  │  └─ auth.test.ts
│  │  │  │  ├─ tasks/
│  │  │  │  ├─ categories/
│  │  │  │  └─ comments/
│  │  │  ├─ lib/
│  │  │  │  ├─ jwt.ts
│  │  │  │  ├─ password.ts
│  │  │  │  └─ errors.ts
│  │  │  └─ prisma.ts
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma
│  │  │  ├─ migrations/
│  │  │  └─ seed.ts
│  │  ├─ test/
│  │  │  ├─ setup.ts               sobe DB de teste
│  │  │  └─ helpers.ts
│  │  ├─ vitest.config.ts
│  │  ├─ tsconfig.json
│  │  └─ package.json
│  └─ web/
│     ├─ src/
│     │  ├─ main.tsx
│     │  ├─ App.tsx
│     │  ├─ routes/
│     │  │  ├─ login.tsx
│     │  │  ├─ signup.tsx
│     │  │  ├─ board.tsx           rota protegida
│     │  │  └─ settings.tsx
│     │  ├─ components/
│     │  │  ├─ ui/                 shadcn/ui (button, dialog, etc)
│     │  │  ├─ board/
│     │  │  │  ├─ KanbanBoard.tsx
│     │  │  │  ├─ KanbanColumn.tsx
│     │  │  │  ├─ TaskCard.tsx
│     │  │  │  ├─ TaskFormDialog.tsx
│     │  │  │  ├─ TaskDetailDialog.tsx
│     │  │  │  └─ DeleteConfirmDialog.tsx
│     │  │  └─ layout/
│     │  ├─ hooks/
│     │  │  ├─ useAuth.ts
│     │  │  ├─ useTasks.ts         TanStack Query
│     │  │  └─ useCategories.ts
│     │  ├─ lib/
│     │  │  ├─ api.ts              axios + interceptor refresh
│     │  │  ├─ queryClient.ts
│     │  │  └─ utils.ts            cn() etc
│     │  └─ styles/globals.css
│     ├─ vitest.config.ts
│     ├─ vite.config.ts
│     ├─ tailwind.config.ts
│     ├─ tsconfig.json
│     └─ package.json
├─ packages/
│  └─ shared/
│     ├─ src/
│     │  ├─ schemas/
│     │  │  ├─ auth.ts
│     │  │  ├─ task.ts
│     │  │  ├─ category.ts
│     │  │  ├─ comment.ts
│     │  │  └─ user.ts
│     │  ├─ types/
│     │  │  └─ index.ts            re-exporta z.infer<>
│     │  └─ index.ts
│     ├─ tsconfig.json
│     └─ package.json
├─ e2e/
│  ├─ tests/
│  │  ├─ auth.spec.ts
│  │  └─ board.spec.ts
│  ├─ playwright.config.ts
│  └─ package.json
├─ docs/
│  ├─ architecture.md
│  ├─ adr/
│  │  ├─ 0001-monorepo-pnpm-turborepo.md
│  │  ├─ 0002-jwt-refresh-rotativo.md
│  │  ├─ 0003-prisma-vs-typeorm.md
│  │  ├─ 0004-fastify-vs-express.md
│  │  └─ 0005-zod-shared-schemas.md
│  └─ superpowers/specs/
├─ .github/
│  ├─ workflows/ci.yml
│  └─ dependabot.yml
├─ docker-compose.yml
├─ Dockerfile.api
├─ Dockerfile.web
├─ .env.example
├─ .editorconfig
├─ .nvmrc
├─ .gitignore
├─ .eslintrc / eslint.config.js    (flat config)
├─ .prettierrc
├─ commitlint.config.cjs
├─ turbo.json
├─ pnpm-workspace.yaml
├─ package.json
├─ LICENSE                          MIT
└─ README.md
```

---

## 5. Modelo de dados (Prisma)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  tasks        Task[]
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  @@index([userId])
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  icon  String           // ex.: "code" (nome lucide), substitui emoji
  tasks Task[]
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String   @default("")
  priority    Priority
  status      Status   @default(TODO)
  dueDate     DateTime?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  comments    Comment[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([userId, status])
}

model Comment {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  content   String
  author    String
  createdAt DateTime @default(now())
  @@index([taskId])
}

enum Priority { LOW MEDIUM HIGH }
enum Status   { TODO IN_PROGRESS DONE }
```

**Decisões:**
- Enums em inglês no banco (padrão) e exibidos em PT-BR no front via dicionário fixo (sem lib de i18n, escopo single-locale). Justificativa: dados portáveis, código de back legível em PRs internacionais.
- `cuid()` em vez de auto-increment: melhor pra distribuição, evita enumeração.
- Categorias agora têm `icon` (nome lucide) em vez de emoji.

---

## 6. API REST

Base: `/api/v1`. Documentada via Swagger em `/docs`.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/signup` | público | cria user, retorna `{ user, accessToken, refreshToken }` |
| POST | `/auth/login` | público | retorna `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | refresh | rotaciona refresh, retorna novos tokens |
| POST | `/auth/logout` | acesso | revoga refresh atual |
| GET | `/me` | acesso | dados do user logado |
| GET | `/categories` | acesso | lista categorias (globais) |
| GET | `/tasks` | acesso | lista tasks do user, com `?status=`, `?priority=`, `?categoryId=` |
| POST | `/tasks` | acesso | cria task |
| GET | `/tasks/:id` | acesso | detalhe |
| PUT | `/tasks/:id` | acesso | atualiza |
| PATCH | `/tasks/:id/status` | acesso | muda status |
| DELETE | `/tasks/:id` | acesso | exclui |
| GET | `/tasks/:id/comments` | acesso | lista comentários |
| POST | `/tasks/:id/comments` | acesso | cria comentário |
| DELETE | `/comments/:id` | acesso | exclui (autor) |
| GET | `/healthz` | público | liveness |
| GET | `/readyz` | público | readiness (checa DB) |

**Convenções:**
- Erros sempre em formato `{ error: { code, message, details? } }`.
- Paginação cursor-based onde aplicável (preparação pra escala).
- Rate limit: `/auth/*` = 5 req/min/IP; demais = 100 req/min/user.

---

## 7. Frontend

### Telas

- **/login** — email + senha, link "criar conta", toast erros.
- **/signup** — nome + email + senha (zxcvbn-like meter via zod), CTA "Já tenho conta".
- **/** (autenticado) — Kanban com 3 colunas (TODO / IN_PROGRESS / DONE), drag entre colunas, header com stats e progresso, filtros (categoria, prioridade), botão "Nova tarefa".
- **/settings** — alterar nome, alterar senha, deletar conta.

### Padrões

- Toda mutation usa TanStack Query com optimistic update e rollback em erro.
- Form com react-hook-form + zodResolver; mesmo schema do back via `@taskboard/shared`.
- Interceptor axios: ao receber 401, tenta `/auth/refresh` 1x; se falhar, redireciona pra `/login`.
- Dark mode persistido em localStorage.
- Erros de rede: banner + retry button.

---

## 8. Segurança

- Senhas hasheadas com bcrypt cost 12.
- Refresh tokens armazenados **hasheados** no banco (SHA-256); cliente recebe o token cru.
- Rotação obrigatória: refresh usado é revogado, novo é emitido.
- Detection de reuse: se um refresh já revogado é apresentado, revogar **todos** os refresh tokens do user (provável vazamento).
- Helmet com CSP estrita.
- CORS configurado por env (`CORS_ORIGIN`).
- Rate limit em rotas sensíveis.
- Logs com `pino` + `redact` para `password`, `passwordHash`, `authorization`, `refreshToken`.
- JWT signed com secret de pelo menos 32 chars (validado no env).
- Sem `eval`, sem `dangerouslySetInnerHTML` no front.

---

## 9. Testes

### Backend (`apps/api`)

- **Unit (Vitest)**: services puros, `jwt.ts`, `password.ts`, validators Zod.
- **Integration (Vitest + Fastify.inject)**: cada rota com casos: feliz, validação, auth, autorização (não acessar task de outro user), 404.
- DB de teste: Postgres em `docker-compose.test.yml` ou testcontainers; cada suite usa um schema isolado e roda migrations antes.

Meta: ≥ 70% de cobertura no `src/modules`.

### Frontend (`apps/web`)

- **Vitest + React Testing Library**: hooks (`useTasks`, `useAuth`), componentes críticos (`TaskFormDialog`, `KanbanColumn`).
- MSW pra mockar API.
- Meta: ≥ 50% cobertura.

### E2E (`e2e/`)

- **Playwright** roda contra docker-compose subido em CI.
- Cenários:
  - signup → login → criar tarefa → mover drag → comentar → deletar tarefa.
  - login com credenciais inválidas → erro visível.
  - token expirado → refresh automático transparente.
  - logout → tentar acessar `/` → redireciona pra `/login`.

---

## 10. DevX, lint, hooks

- ESLint flat config compartilhado na raiz, com presets por workspace (api/web/shared).
- Prettier sem prettier-eslint plugin (Prettier roda separado, ESLint só lint).
- Husky:
  - `pre-commit` → lint-staged (lint + prettier nos arquivos staged).
  - `commit-msg` → commitlint (Conventional Commits).
- TS strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.
- `.editorconfig`, `.nvmrc` (22), `.npmrc` (`shared-workspace-lockfile=true`).

---

## 11. Docker & dev local

- `Dockerfile.api`: multi-stage (deps → builder → runner com `node:22-alpine` non-root, `USER node`). Health check `wget --spider /healthz`.
- `Dockerfile.web`: multi-stage (builder Vite → nginx:alpine servindo `dist`, com fallback SPA).
- `docker-compose.yml`:
  - `postgres` (16-alpine, volume nomeado, healthcheck).
  - `api` (depende de postgres, roda migrations no entrypoint).
  - `web` (servida pelo nginx em container, host:5173 → container:80; mantém URL local consistente com o modo dev).
  - `adminer` (opcional, porta 8080) — facilita inspeção em entrevista.
- `docker-compose.dev.yml`: override com bind mounts pra hot reload.

---

## 12. CI (GitHub Actions)

Workflow `ci.yml` em push e PR:

```
jobs:
  lint        → pnpm install --frozen-lockfile + pnpm lint (turbo)
  typecheck   → pnpm typecheck (turbo)
  test-unit   → matriz api/web, sobe postgres:16 como service, roda vitest
  test-e2e    → docker compose up -d; playwright test; logs em artifact
  build       → pnpm build (turbo); cache de dist
```

- Cache: pnpm store + turbo remote (opcional) + Playwright browsers.
- Badge no README.
- Dependabot semanal pra npm e GitHub Actions.
- CodeQL pra security scanning.

---

## 13. Documentação

### README.md (estrutura)

1. Title + tagline + badges (CI, coverage, license, Node version).
2. Screenshot/GIF do produto (dark mode).
3. "Por que esse projeto existe" (1 parágrafo honesto).
4. Stack visual (tabela ou ícones).
5. Como rodar (`docker compose up`, abrir `http://localhost:5173`).
6. Como rodar em dev local (sem Docker).
7. Estrutura do monorepo (árvore resumida).
8. Decisões técnicas (lista linkando ADRs).
9. Roadmap honesto (o que falta, o que ficaria de fase 2).
10. Licença.

### ADRs (em `docs/adr/`)

Formato Michael Nygard simplificado (Context, Decision, Consequences). 5 ADRs iniciais:

1. Monorepo com pnpm + Turborepo.
2. JWT com refresh rotativo (vs sessions, vs Better-Auth).
3. Prisma (vs TypeORM, Drizzle).
4. Fastify (vs Express, NestJS).
5. Zod shared schemas (vs duplicar tipos).

### `docs/architecture.md`

Diagrama Mermaid (containers, fluxo de request, fluxo de auth) + texto curto explicando cada camada.

---

## 14. Roadmap de implementação (fases)

A ordem garante que cada fase termina com o repo **verde** (lint + typecheck + testes existentes passando).

1. **Fase 0 — Limpar terreno**
   Mover `workshop-aws-main/workshop-aws-main/*` pra raiz, apagar wrapper, criar `.gitignore` decente, init `pnpm`/`git`.
2. **Fase 1 — Monorepo esqueleto**
   `pnpm-workspace.yaml`, `turbo.json`, ESLint + Prettier + tsconfig base, Husky + commitlint, `.editorconfig`, `.nvmrc`, LICENSE.
3. **Fase 2 — `packages/shared`**
   Schemas Zod de User, Auth, Task, Category, Comment.
4. **Fase 3 — Backend base (`apps/api`)**
   Fastify + plugins (logger, error-handler, swagger), env validation, Prisma + Postgres + migrations + seed, healthz/readyz. Vitest configurado.
5. **Fase 4 — Auth no backend**
   Signup, login, refresh, logout, `/me`. JWT lib, password lib, rate limit. Testes unit + integration.
6. **Fase 5 — Tasks/Categories/Comments no backend**
   CRUD completo com autorização por user. Testes integration. Swagger refletindo.
7. **Fase 6 — Frontend base (`apps/web`)**
   Vite + Tailwind + shadcn/ui + TanStack Query + roteamento. Layout + dark mode.
8. **Fase 7 — Auth no frontend**
   Telas login/signup, interceptor refresh, hook `useAuth`, rota protegida.
9. **Fase 8 — Kanban no frontend**
   Listagem, criação, edição, exclusão, drag-and-drop, comentários. Optimistic updates.
10. **Fase 9 — Testes frontend**
    Vitest + RTL pros hooks/components críticos.
11. **Fase 10 — Docker & docker-compose**
    Dockerfiles, compose com volumes e healthchecks.
12. **Fase 11 — E2E Playwright**
    Cenários definidos. Roda contra compose.
13. **Fase 12 — CI GitHub Actions**
    Workflow + badges no README.
14. **Fase 13 — Documentação final**
    README profissional com GIF, ADRs, `docs/architecture.md`.

---

## 15. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Escopo grande, sessão acaba antes do fim | Cada fase deixa repo verde; pode retomar sem retrabalho. |
| GIF/screenshot exige UI pronta | Última fase é a documentação visual. |
| Playwright em CI é flaky | Healthcheck robusto no compose + retry 2x + screenshots em falha. |
| `pnpm` + Docker pode complicar lockfile | Usar `--frozen-lockfile` em CI e no Dockerfile. |
| `shadcn/ui` requer Tailwind 4 com novo plugin Vite | Verificar versões compatíveis na fase 6. |

---

## 16. Out of scope explícito

- Internacionalização full (vai ser PT-BR no UI, EN no código/DB).
- Notificações em tempo real (WebSocket).
- Compartilhamento de tarefas entre users.
- Upload de anexos.
- Deploy live (vai ficar como fase futura no roadmap do README).
- Mobile app.
- Migração de dados do SQLite antigo (banco novo do zero).

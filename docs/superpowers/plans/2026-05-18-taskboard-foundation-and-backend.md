# TaskBoard — Plan 1: Foundation + Backend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levantar o monorepo TypeScript (pnpm + Turborepo), o pacote shared de schemas Zod, e o backend Fastify/Prisma/Postgres completo com auth (JWT + refresh rotativo) e CRUD de tasks/categories/comments. Ao final, `docker compose up` sobe Postgres e API; Swagger em `/docs`; todos os testes verdes.

**Architecture:** Monorepo pnpm com `apps/api`, `packages/shared` (schemas Zod) e Turborepo orquestrando lint/typecheck/test/build. Backend em camadas (routes → service → repository), Prisma encapsulando Postgres, validação Zod nas rotas, plugins Fastify para auth/error-handler/logger/swagger. Testes Vitest unit + integration usando `fastify.inject()` contra Postgres de teste isolado.

**Tech Stack:** Node 22, pnpm 9, Turborepo 2, TypeScript 5.6, Fastify 5, Prisma 6, Postgres 16, Zod 3, bcrypt, jsonwebtoken, pino, Vitest, ESLint flat config, Prettier, Husky, commitlint.

**Reference spec:** `docs/superpowers/specs/2026-05-18-taskboard-portfolio-design.md`

---

## File map

Arquivos criados/modificados ao longo deste plano (ordem de aparição):

**Raiz**
- `.gitignore`, `.editorconfig`, `.nvmrc`, `.npmrc`, `LICENSE`, `README.md`
- `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`
- `commitlint.config.cjs`, `.husky/pre-commit`, `.husky/commit-msg`
- `.env.example`, `docker-compose.yml`, `Dockerfile.api`

**packages/shared**
- `packages/shared/package.json`, `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/schemas/{user,auth,category,task,comment,pagination,error}.ts`
- `packages/shared/src/schemas/__tests__/*.test.ts`

**apps/api**
- `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/vitest.config.ts`
- `apps/api/.env.example`
- `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts`
- `apps/api/src/{app,server,env,prisma}.ts`
- `apps/api/src/lib/{jwt,password,errors,hash}.ts`
- `apps/api/src/plugins/{logger,error-handler,auth,swagger,rate-limit}.ts`
- `apps/api/src/modules/health/health.routes.ts`
- `apps/api/src/modules/auth/{auth.routes,auth.service,auth.repository}.ts`
- `apps/api/src/modules/users/{users.routes,users.service,users.repository}.ts`
- `apps/api/src/modules/categories/{categories.routes,categories.service,categories.repository}.ts`
- `apps/api/src/modules/tasks/{tasks.routes,tasks.service,tasks.repository}.ts`
- `apps/api/src/modules/comments/{comments.routes,comments.service,comments.repository}.ts`
- `apps/api/test/{setup,helpers,db-utils}.ts`
- `apps/api/src/modules/**/__tests__/*.test.ts` (unit + integration)

**Tooling**
- `.github/dependabot.yml` (CI vem no Plan 3)

---

# Phase 0 — Limpar terreno

## Task 1: Reorganizar arquivos do workshop pra raiz

**Files:**
- Modify: `/mnt/armazenamento/home/tiozinho-gamer/domains/task-manager/` (estrutura inteira)
- Delete: `workshop-aws-main/` (wrapper duplo)

- [ ] **Step 1: Verificar estado atual**

Run: `ls /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager/`
Expected: ver `.claude` e `workshop-aws-main/` no nível raiz.

Run: `ls /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager/workshop-aws-main/workshop-aws-main/`
Expected: ver `backend/`, `frontend/`, `start.sh`, `.gitignore`.

- [ ] **Step 2: Mover conteúdo do segundo nível pra raiz (preservando .claude e docs)**

```bash
cd /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager
mv workshop-aws-main/workshop-aws-main/backend ./backend_legacy
mv workshop-aws-main/workshop-aws-main/frontend ./frontend_legacy
mv workshop-aws-main/workshop-aws-main/start.sh ./start_legacy.sh
rm -rf workshop-aws-main
```

Renomeamos com sufixo `_legacy` porque vamos substituir esses diretórios por `apps/api` e `apps/web` no monorepo, e queremos preservar o código original como referência até confirmarmos paridade.

- [ ] **Step 3: Verificar resultado**

Run: `ls /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager/`
Expected: `.claude/  backend_legacy/  docs/  frontend_legacy/  start_legacy.sh`

## Task 2: Criar .gitignore monorepo-ready

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Escrever .gitignore**

Create `/mnt/armazenamento/home/tiozinho-gamer/domains/task-manager/.gitignore`:

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
.turbo/
*.tsbuildinfo

# Test outputs
coverage/
.nyc_output/
playwright-report/
test-results/

# Env
.env
.env.local
.env.*.local
!.env.example

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Editor / OS
.DS_Store
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
*.swp

# Database
*.db
*.db-shm
*.db-wal
postgres-data/

# Legacy (será removido depois)
backend_legacy/
frontend_legacy/
start_legacy.sh
```

## Task 3: Inicializar git e fazer commit inicial

**Files:** N/A (operação git)

- [ ] **Step 1: Init git**

```bash
cd /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager
git init
git branch -M main
```

- [ ] **Step 2: Commit do estado inicial (com legacy ignorado)**

```bash
git add .gitignore docs/
git status
```

Expected: apenas `.gitignore` e `docs/` aparecem como adicionados; `*_legacy` não aparecem.

```bash
git commit -m "chore: initialize repo with spec and plan"
```

---

# Phase 1 — Monorepo tooling

## Task 4: Criar pnpm-workspace.yaml

**Files:**
- Create: `pnpm-workspace.yaml`

- [ ] **Step 1: Escrever pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## Task 5: Criar package.json raiz

**Files:**
- Create: `package.json`

- [ ] **Step 1: Escrever package.json raiz**

```json
{
  "name": "taskboard",
  "version": "0.1.0",
  "private": true,
  "description": "Portfolio-grade Kanban task manager — monorepo with API and web app",
  "license": "MIT",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "test:integration": "turbo run test:integration",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.6.0",
    "@commitlint/config-conventional": "^19.6.0",
    "@types/node": "^22.10.0",
    "eslint": "^9.16.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.2.10",
    "prettier": "^3.4.0",
    "turbo": "^2.3.0",
    "typescript": "^5.6.3",
    "typescript-eslint": "^8.18.0",
    "@eslint/js": "^9.16.0",
    "eslint-config-prettier": "^9.1.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

- [ ] **Step 2: Instalar pnpm globalmente se ausente**

Run: `pnpm --version`
Expected: 9.x. Se faltar, instalar: `npm install -g pnpm@9`.

- [ ] **Step 3: Instalar dependências raiz**

```bash
cd /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager
pnpm install
```

Expected: cria `pnpm-lock.yaml` e `node_modules/`. Sem erros.

## Task 6: Criar turbo.json

**Files:**
- Create: `turbo.json`

- [ ] **Step 1: Escrever turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["tsconfig.base.json", ".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:unit": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## Task 7: Criar tsconfig.base.json

**Files:**
- Create: `tsconfig.base.json`

- [ ] **Step 1: Escrever tsconfig.base.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "verbatimModuleSyntax": true
  }
}
```

## Task 8: Configurar ESLint flat config

**Files:**
- Create: `eslint.config.js`

- [ ] **Step 1: Escrever eslint.config.js**

```js
// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "backend_legacy/**",
      "frontend_legacy/**",
      "**/*.config.{js,ts,cjs,mjs}",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  prettier,
);
```

## Task 9: Configurar Prettier

**Files:**
- Create: `.prettierrc`, `.prettierignore`

- [ ] **Step 1: Escrever .prettierrc**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 2: Escrever .prettierignore**

```
node_modules
dist
build
.turbo
.next
coverage
pnpm-lock.yaml
backend_legacy
frontend_legacy
*.md
```

## Task 10: Criar .editorconfig e .nvmrc

**Files:**
- Create: `.editorconfig`, `.nvmrc`, `.npmrc`

- [ ] **Step 1: .editorconfig**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 2: .nvmrc**

```
22
```

- [ ] **Step 3: .npmrc**

```
shared-workspace-lockfile=true
strict-peer-dependencies=false
auto-install-peers=true
```

## Task 11: Adicionar LICENSE MIT

**Files:**
- Create: `LICENSE`

- [ ] **Step 1: Escrever LICENSE**

```
MIT License

Copyright (c) 2026 Ricardo Galvao

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Task 12: Configurar commitlint

**Files:**
- Create: `commitlint.config.cjs`

- [ ] **Step 1: Escrever commitlint.config.cjs**

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    "subject-case": [0],
  },
};
```

## Task 13: Configurar Husky

**Files:**
- Create: `.husky/pre-commit`, `.husky/commit-msg`

- [ ] **Step 1: Inicializar husky**

```bash
cd /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager
pnpm exec husky init
```

Expected: cria `.husky/pre-commit` com conteúdo default.

- [ ] **Step 2: Sobrescrever .husky/pre-commit**

```sh
pnpm exec lint-staged
```

- [ ] **Step 3: Criar .husky/commit-msg**

```sh
pnpm exec commitlint --edit "$1"
```

Run: `chmod +x .husky/commit-msg`

## Task 14: Verificar setup do monorepo

- [ ] **Step 1: Lint roda (sem arquivos pra lintar ainda, mas sem erro de config)**

Run: `pnpm lint`
Expected: turbo executa, sem packages com lint definido ainda. Sem erro.

- [ ] **Step 2: Prettier check**

Run: `pnpm format:check`
Expected: PASS (todos os arquivos formatados).

- [ ] **Step 3: Commit do tooling**

```bash
git add .
git status
```

Verifique que `node_modules/` NÃO aparece.

```bash
git commit -m "chore: setup monorepo tooling (pnpm, turbo, eslint, prettier, husky)"
```

---

# Phase 2 — Pacote shared (schemas Zod)

## Task 15: Estrutura do packages/shared

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`

- [ ] **Step 1: Criar diretórios**

```bash
mkdir -p packages/shared/src/schemas/__tests__
mkdir -p packages/shared/src/types
```

- [ ] **Step 2: packages/shared/package.json**

```json
{
  "name": "@taskboard/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./schemas": "./src/schemas/index.ts"
  },
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:unit": "vitest run"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 3: packages/shared/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "composite": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Instalar deps**

```bash
cd /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager
pnpm install
```

Expected: zod e vitest instalados em `packages/shared/node_modules/`.

## Task 16: Schema de User (TDD)

**Files:**
- Create: `packages/shared/src/schemas/user.ts`
- Test: `packages/shared/src/schemas/__tests__/user.test.ts`

- [ ] **Step 1: Escrever teste primeiro**

Create `packages/shared/src/schemas/__tests__/user.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { userSchema, publicUserSchema } from "../user";

describe("userSchema", () => {
  it("aceita user válido", () => {
    const result = userSchema.safeParse({
      id: "clx123abc",
      email: "user@example.com",
      name: "Ricardo",
      passwordHash: "$2b$12$abc",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("rejeita email inválido", () => {
    const result = userSchema.safeParse({
      id: "clx123abc",
      email: "not-an-email",
      name: "Ricardo",
      passwordHash: "$2b$12$abc",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita name vazio", () => {
    const result = userSchema.safeParse({
      id: "clx123abc",
      email: "user@example.com",
      name: "",
      passwordHash: "$2b$12$abc",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });
});

describe("publicUserSchema", () => {
  it("não expõe passwordHash", () => {
    const result = publicUserSchema.parse({
      id: "clx123abc",
      email: "user@example.com",
      name: "Ricardo",
      passwordHash: "$2b$12$abc",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).toMatchObject({
      id: "clx123abc",
      email: "user@example.com",
      name: "Ricardo",
    });
  });
});
```

- [ ] **Step 2: Rodar teste e ver falhar**

```bash
cd packages/shared
pnpm test
```

Expected: FAIL — `Cannot find module '../user'`.

- [ ] **Step 3: Implementar schema**

Create `packages/shared/src/schemas/user.ts`:

```ts
import { z } from "zod";

export const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  passwordHash: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const publicUserSchema = userSchema.omit({ passwordHash: true });
export type PublicUser = z.infer<typeof publicUserSchema>;
```

- [ ] **Step 4: Rodar teste e ver passar**

Run: `pnpm test`
Expected: PASS (4 testes).

## Task 17: Schema de Auth (signup, login, refresh) — TDD

**Files:**
- Create: `packages/shared/src/schemas/auth.ts`
- Test: `packages/shared/src/schemas/__tests__/auth.test.ts`

- [ ] **Step 1: Escrever teste**

Create `packages/shared/src/schemas/__tests__/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { signupSchema, loginSchema, refreshSchema, authResponseSchema } from "../auth";

describe("signupSchema", () => {
  it("aceita signup válido", () => {
    expect(
      signupSchema.safeParse({
        email: "user@example.com",
        password: "SuperSenha123!",
        name: "Ricardo",
      }).success,
    ).toBe(true);
  });

  it("rejeita senha curta (< 8)", () => {
    expect(
      signupSchema.safeParse({
        email: "user@example.com",
        password: "abc",
        name: "Ricardo",
      }).success,
    ).toBe(false);
  });

  it("rejeita senha sem letra maiúscula", () => {
    expect(
      signupSchema.safeParse({
        email: "user@example.com",
        password: "abcabcabc",
        name: "Ricardo",
      }).success,
    ).toBe(false);
  });

  it("rejeita senha sem número", () => {
    expect(
      signupSchema.safeParse({
        email: "user@example.com",
        password: "SuperSenha",
        name: "Ricardo",
      }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("aceita login válido", () => {
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "qualquer" }).success,
    ).toBe(true);
  });
});

describe("refreshSchema", () => {
  it("aceita refresh token", () => {
    expect(refreshSchema.safeParse({ refreshToken: "abc.def.ghi" }).success).toBe(true);
  });

  it("rejeita refresh token vazio", () => {
    expect(refreshSchema.safeParse({ refreshToken: "" }).success).toBe(false);
  });
});

describe("authResponseSchema", () => {
  it("valida resposta completa", () => {
    expect(
      authResponseSchema.safeParse({
        user: {
          id: "clx1",
          email: "a@b.com",
          name: "A",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: "a",
        refreshToken: "r",
      }).success,
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar schema**

Create `packages/shared/src/schemas/auth.ts`:

```ts
import { z } from "zod";
import { publicUserSchema } from "./user";

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter ao menos 8 caracteres")
  .max(128, "Senha muito longa")
  .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula")
  .regex(/[0-9]/, "Senha deve conter ao menos um número");

export const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: passwordSchema,
  name: z.string().min(1, "Nome obrigatório").max(100),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token obrigatório"),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const authResponseSchema = z.object({
  user: publicUserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test`
Expected: PASS.

## Task 18: Schema de Category (TDD)

**Files:**
- Create: `packages/shared/src/schemas/category.ts`
- Test: `packages/shared/src/schemas/__tests__/category.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it } from "vitest";
import { categorySchema, createCategorySchema } from "../category";

describe("categorySchema", () => {
  it("aceita categoria válida", () => {
    expect(
      categorySchema.safeParse({ id: "c1", name: "Desenvolvimento", icon: "code" }).success,
    ).toBe(true);
  });

  it("rejeita name vazio", () => {
    expect(categorySchema.safeParse({ id: "c1", name: "", icon: "code" }).success).toBe(false);
  });

  it("rejeita icon com caracteres especiais", () => {
    expect(
      categorySchema.safeParse({ id: "c1", name: "X", icon: "code!@#" }).success,
    ).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("não exige id", () => {
    expect(createCategorySchema.safeParse({ name: "Marketing", icon: "megaphone" }).success).toBe(
      true,
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test`

- [ ] **Step 3: Implementar**

```ts
import { z } from "zod";

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  icon: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Icon deve usar kebab-case (apenas a-z, 0-9, -)"),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategorySchema = categorySchema.omit({ id: true });
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test`
Expected: PASS.

## Task 19: Schema de Task (TDD)

**Files:**
- Create: `packages/shared/src/schemas/task.ts`
- Test: `packages/shared/src/schemas/__tests__/task.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it } from "vitest";
import {
  taskPrioritySchema,
  taskStatusSchema,
  taskSchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  PRIORITY_LABELS_PT,
  STATUS_LABELS_PT,
} from "../task";

describe("taskPrioritySchema", () => {
  it("aceita LOW/MEDIUM/HIGH", () => {
    expect(taskPrioritySchema.safeParse("LOW").success).toBe(true);
    expect(taskPrioritySchema.safeParse("MEDIUM").success).toBe(true);
    expect(taskPrioritySchema.safeParse("HIGH").success).toBe(true);
  });
  it("rejeita outros", () => {
    expect(taskPrioritySchema.safeParse("URGENT").success).toBe(false);
  });
});

describe("taskStatusSchema", () => {
  it("aceita TODO/IN_PROGRESS/DONE", () => {
    expect(taskStatusSchema.safeParse("TODO").success).toBe(true);
    expect(taskStatusSchema.safeParse("IN_PROGRESS").success).toBe(true);
    expect(taskStatusSchema.safeParse("DONE").success).toBe(true);
  });
});

describe("createTaskSchema", () => {
  it("aceita input mínimo", () => {
    expect(
      createTaskSchema.safeParse({
        title: "Implementar feature X",
        priority: "HIGH",
        categoryId: "c1",
      }).success,
    ).toBe(true);
  });

  it("rejeita title vazio", () => {
    expect(
      createTaskSchema.safeParse({ title: "", priority: "HIGH", categoryId: "c1" }).success,
    ).toBe(false);
  });

  it("aceita dueDate como ISO string", () => {
    const parsed = createTaskSchema.safeParse({
      title: "X",
      priority: "LOW",
      categoryId: "c1",
      dueDate: "2026-12-31T00:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejeita dueDate inválida", () => {
    expect(
      createTaskSchema.safeParse({
        title: "X",
        priority: "LOW",
        categoryId: "c1",
        dueDate: "not-a-date",
      }).success,
    ).toBe(false);
  });
});

describe("updateTaskStatusSchema", () => {
  it("aceita status válido", () => {
    expect(updateTaskStatusSchema.safeParse({ status: "DONE" }).success).toBe(true);
  });
});

describe("taskSchema", () => {
  it("aceita task completa", () => {
    expect(
      taskSchema.safeParse({
        id: "t1",
        title: "Implementar X",
        description: "Detalhes",
        priority: "HIGH",
        status: "IN_PROGRESS",
        dueDate: new Date(),
        userId: "u1",
        categoryId: "c1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).success,
    ).toBe(true);
  });
});

describe("updateTaskSchema (partial)", () => {
  it("aceita apenas alguns campos", () => {
    expect(updateTaskSchema.safeParse({ title: "Novo título" }).success).toBe(true);
  });
});

describe("labels pt-BR", () => {
  it("traduz prioridade", () => {
    expect(PRIORITY_LABELS_PT.HIGH).toBe("Alta");
    expect(PRIORITY_LABELS_PT.MEDIUM).toBe("Média");
    expect(PRIORITY_LABELS_PT.LOW).toBe("Baixa");
  });
  it("traduz status", () => {
    expect(STATUS_LABELS_PT.TODO).toBe("A Fazer");
    expect(STATUS_LABELS_PT.IN_PROGRESS).toBe("Em Progresso");
    expect(STATUS_LABELS_PT.DONE).toBe("Concluída");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test`

- [ ] **Step 3: Implementar**

```ts
import { z } from "zod";

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  dueDate: z.date().nullable().optional(),
  userId: z.string().min(1),
  categoryId: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Task = z.infer<typeof taskSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(200),
  description: z.string().max(2000).optional(),
  priority: taskPrioritySchema,
  categoryId: z.string().min(1, "Categoria obrigatória"),
  dueDate: z
    .string()
    .datetime({ message: "dueDate deve ser ISO 8601" })
    .optional()
    .nullable(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: taskStatusSchema.optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
});
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export const PRIORITY_LABELS_PT: Record<TaskPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

export const STATUS_LABELS_PT: Record<TaskStatus, string> = {
  TODO: "A Fazer",
  IN_PROGRESS: "Em Progresso",
  DONE: "Concluída",
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test`
Expected: PASS.

## Task 20: Schema de Comment (TDD)

**Files:**
- Create: `packages/shared/src/schemas/comment.ts`
- Test: `packages/shared/src/schemas/__tests__/comment.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it } from "vitest";
import { commentSchema, createCommentSchema } from "../comment";

describe("commentSchema", () => {
  it("aceita comentário válido", () => {
    expect(
      commentSchema.safeParse({
        id: "cm1",
        taskId: "t1",
        content: "Olha só",
        author: "Ricardo",
        createdAt: new Date(),
      }).success,
    ).toBe(true);
  });
});

describe("createCommentSchema", () => {
  it("aceita conteúdo válido", () => {
    expect(createCommentSchema.safeParse({ content: "Comentário" }).success).toBe(true);
  });
  it("rejeita vazio", () => {
    expect(createCommentSchema.safeParse({ content: "" }).success).toBe(false);
  });
  it("rejeita > 1000 chars", () => {
    expect(createCommentSchema.safeParse({ content: "a".repeat(1001) }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test`

- [ ] **Step 3: Implementar**

```ts
import { z } from "zod";

export const commentSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  content: z.string().min(1).max(1000),
  author: z.string().min(1),
  createdAt: z.date(),
});
export type Comment = z.infer<typeof commentSchema>;

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comentário não pode ser vazio").max(1000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test`

## Task 21: Schema de erro padrão

**Files:**
- Create: `packages/shared/src/schemas/error.ts`
- Test: `packages/shared/src/schemas/__tests__/error.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it } from "vitest";
import { apiErrorSchema, ErrorCode } from "../error";

describe("apiErrorSchema", () => {
  it("aceita erro simples", () => {
    expect(
      apiErrorSchema.safeParse({
        error: { code: "VALIDATION_ERROR", message: "Campo inválido" },
      }).success,
    ).toBe(true);
  });

  it("aceita erro com details", () => {
    expect(
      apiErrorSchema.safeParse({
        error: {
          code: "VALIDATION_ERROR",
          message: "X",
          details: [{ path: "email", message: "Email inválido" }],
        },
      }).success,
    ).toBe(true);
  });

  it("ErrorCode tem códigos esperados", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCode.CONFLICT).toBe("CONFLICT");
    expect(ErrorCode.INTERNAL).toBe("INTERNAL");
    expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test`

- [ ] **Step 3: Implementar**

```ts
import { z } from "zod";

export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL: "INTERNAL",
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm test`

## Task 22: Index barrels

**Files:**
- Create: `packages/shared/src/schemas/index.ts`, `packages/shared/src/index.ts`

- [ ] **Step 1: packages/shared/src/schemas/index.ts**

```ts
export * from "./user";
export * from "./auth";
export * from "./category";
export * from "./task";
export * from "./comment";
export * from "./error";
```

- [ ] **Step 2: packages/shared/src/index.ts**

```ts
export * from "./schemas/index";
```

- [ ] **Step 3: Verificar typecheck**

```bash
cd packages/shared
pnpm typecheck
```

Expected: PASS sem erros.

- [ ] **Step 4: Verificar todos os testes**

Run: `pnpm test`
Expected: todos passando.

- [ ] **Step 5: Commit**

```bash
cd /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager
git add packages/
git commit -m "feat(shared): add zod schemas for user, auth, category, task, comment, error"
```

---

# Phase 3 — Backend skeleton (apps/api)

## Task 23: Estrutura do apps/api

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/.env.example`

- [ ] **Step 1: Criar diretórios**

```bash
mkdir -p apps/api/src/{lib,plugins,modules,modules/health,modules/auth,modules/users,modules/categories,modules/tasks,modules/comments}
mkdir -p apps/api/test
mkdir -p apps/api/prisma
```

- [ ] **Step 2: apps/api/package.json**

```json
{
  "name": "@taskboard/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src test",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:unit": "vitest run --dir src",
    "test:integration": "vitest run --dir src/modules --reporter=verbose",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "tsx prisma/seed.ts",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.1",
    "@fastify/helmet": "^12.0.1",
    "@fastify/jwt": "^9.0.1",
    "@fastify/rate-limit": "^10.1.1",
    "@fastify/swagger": "^9.4.0",
    "@fastify/swagger-ui": "^5.2.0",
    "@prisma/client": "^6.0.0",
    "@taskboard/shared": "workspace:*",
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.7",
    "fastify": "^5.2.0",
    "fastify-type-provider-zod": "^4.0.2",
    "pino": "^9.5.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "pino-pretty": "^13.0.0",
    "prisma": "^6.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3",
    "vitest": "^2.1.8"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 3: apps/api/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": ".",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["node"]
  },
  "include": ["src/**/*", "test/**/*", "prisma/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 4: apps/api/.env.example**

```dotenv
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://taskboard:taskboard@localhost:5432/taskboard?schema=public

# Auth
JWT_SECRET=change-me-to-a-long-random-string-of-at-least-32-chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Step 5: Instalar deps**

```bash
cd /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager
pnpm install
```

## Task 24: Postgres local via docker-compose

**Files:**
- Create: `docker-compose.yml` (raiz), `.env.example` (raiz)

- [ ] **Step 1: docker-compose.yml inicial (só postgres por enquanto)**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: taskboard-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: taskboard
      POSTGRES_PASSWORD: taskboard
      POSTGRES_DB: taskboard
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskboard -d taskboard"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres-data:
```

- [ ] **Step 2: .env.example raiz**

```dotenv
# Copie pra .env e ajuste se necessário.
# Mesmas variáveis usadas pelo apps/api em desenvolvimento.
DATABASE_URL=postgresql://taskboard:taskboard@localhost:5432/taskboard?schema=public
JWT_SECRET=change-me-to-a-long-random-string-of-at-least-32-chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Step 3: Subir Postgres**

```bash
cd /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager
docker compose up -d postgres
docker compose ps
```

Expected: `taskboard-postgres` com status `healthy` (aguardar ~10s).

- [ ] **Step 4: Verificar conexão**

```bash
docker exec -it taskboard-postgres psql -U taskboard -d taskboard -c "SELECT version();"
```

Expected: versão do Postgres 16.

## Task 25: Schema Prisma + primeira migration

**Files:**
- Create: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String
  name          String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  tasks         Task[]
  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String    @unique
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
  @@map("refresh_tokens")
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  icon  String
  tasks Task[]

  @@map("categories")
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String    @default("")
  priority    Priority
  status      Status    @default(TODO)
  dueDate     DateTime?
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id])
  comments    Comment[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId, status])
  @@map("tasks")
}

model Comment {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  content   String
  author    String
  createdAt DateTime @default(now())

  @@index([taskId])
  @@map("comments")
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum Status {
  TODO
  IN_PROGRESS
  DONE
}
```

- [ ] **Step 2: Criar .env de dev (não commitado)**

```bash
cd apps/api
cp .env.example .env
```

- [ ] **Step 3: Rodar primeira migration**

```bash
cd apps/api
pnpm prisma:migrate
```

Quando perguntar o nome da migration: `init`.

Expected: cria `apps/api/prisma/migrations/<timestamp>_init/migration.sql` e aplica no Postgres local.

- [ ] **Step 4: Verificar tabelas criadas**

```bash
docker exec -it taskboard-postgres psql -U taskboard -d taskboard -c "\dt"
```

Expected: `users`, `refresh_tokens`, `categories`, `tasks`, `comments`, `_prisma_migrations`.

## Task 26: Seed de categorias

**Files:**
- Create: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Escrever seed.ts**

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Desenvolvimento", icon: "code" },
    { name: "Design", icon: "palette" },
    { name: "Marketing", icon: "megaphone" },
    { name: "Reunião", icon: "calendar" },
    { name: "Documentação", icon: "file-text" },
    { name: "Infraestrutura", icon: "server" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  console.log(`Seeded ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Rodar seed**

```bash
cd apps/api
pnpm prisma:seed
```

Expected: `Seeded 6 categories`.

- [ ] **Step 3: Verificar no Postgres**

```bash
docker exec -it taskboard-postgres psql -U taskboard -d taskboard -c "SELECT name, icon FROM categories;"
```

Expected: 6 linhas.

## Task 27: Env validation com Zod

**Files:**
- Create: `apps/api/src/env.ts`
- Test: `apps/api/src/__tests__/env.test.ts`

- [ ] **Step 1: Teste**

Create `apps/api/src/__tests__/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { envSchema } from "../env";

describe("envSchema", () => {
  it("aceita env válido", () => {
    const result = envSchema.safeParse({
      NODE_ENV: "development",
      PORT: "3001",
      HOST: "0.0.0.0",
      LOG_LEVEL: "info",
      DATABASE_URL: "postgresql://u:p@localhost:5432/db",
      JWT_SECRET: "a".repeat(32),
      JWT_ACCESS_TTL: "15m",
      JWT_REFRESH_TTL: "7d",
      CORS_ORIGIN: "http://localhost:5173",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3001);
    }
  });

  it("rejeita JWT_SECRET curto", () => {
    const result = envSchema.safeParse({
      NODE_ENV: "development",
      PORT: "3001",
      HOST: "0.0.0.0",
      LOG_LEVEL: "info",
      DATABASE_URL: "postgresql://u:p@localhost:5432/db",
      JWT_SECRET: "short",
      JWT_ACCESS_TTL: "15m",
      JWT_REFRESH_TTL: "7d",
      CORS_ORIGIN: "http://localhost:5173",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita DATABASE_URL inválida", () => {
    const result = envSchema.safeParse({
      NODE_ENV: "development",
      PORT: "3001",
      HOST: "0.0.0.0",
      LOG_LEVEL: "info",
      DATABASE_URL: "not-a-url",
      JWT_SECRET: "a".repeat(32),
      JWT_ACCESS_TTL: "15m",
      JWT_REFRESH_TTL: "7d",
      CORS_ORIGIN: "http://localhost:5173",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Implementar env.ts**

```ts
import { z } from "zod";
import "dotenv/config";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.string().url().refine((u) => u.startsWith("postgresql://") || u.startsWith("postgres://"), {
    message: "DATABASE_URL deve ser postgresql://...",
  }),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter ao menos 32 chars"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Env inválido:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env: Env = loadEnv();
```

- [ ] **Step 3: Configurar Vitest**

Create `apps/api/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 15_000,
  },
});
```

Create `apps/api/test/setup.ts` (stub mínimo):

```ts
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-chars-long";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://taskboard:taskboard@localhost:5432/taskboard_test?schema=public";
process.env.CORS_ORIGIN = "http://localhost:5173";
```

- [ ] **Step 4: Rodar testes**

```bash
cd apps/api
pnpm test src/__tests__/env.test.ts
```

Expected: PASS.

## Task 28: Cliente Prisma singleton

**Files:**
- Create: `apps/api/src/prisma.ts`

- [ ] **Step 1: Escrever prisma.ts**

```ts
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? [{ emit: "event", level: "query" }, "warn", "error"]
        : ["warn", "error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

## Task 29: Lib de erros (AppError)

**Files:**
- Create: `apps/api/src/lib/errors.ts`
- Test: `apps/api/src/lib/__tests__/errors.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it } from "vitest";
import { AppError, NotFoundError, UnauthorizedError, ConflictError, ForbiddenError } from "../errors";

describe("AppError", () => {
  it("guarda code, statusCode e message", () => {
    const e = new AppError("CUSTOM", "msg", 418);
    expect(e.code).toBe("CUSTOM");
    expect(e.statusCode).toBe(418);
    expect(e.message).toBe("msg");
  });

  it("NotFoundError → 404", () => {
    const e = new NotFoundError("Recurso");
    expect(e.statusCode).toBe(404);
    expect(e.code).toBe("NOT_FOUND");
    expect(e.message).toContain("Recurso");
  });

  it("UnauthorizedError → 401", () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
  });

  it("ConflictError → 409", () => {
    expect(new ConflictError("dup").statusCode).toBe(409);
  });

  it("ForbiddenError → 403", () => {
    expect(new ForbiddenError().statusCode).toBe(403);
  });
});
```

- [ ] **Step 2: Implementar**

```ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} não encontrado`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super("FORBIDDEN", message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
  }
}
```

- [ ] **Step 3: Rodar teste**

Run: `cd apps/api && pnpm test src/lib/__tests__/errors.test.ts`
Expected: PASS.

## Task 30: Lib de password (bcrypt)

**Files:**
- Create: `apps/api/src/lib/password.ts`
- Test: `apps/api/src/lib/__tests__/password.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("password", () => {
  it("hash produz string diferente da senha", async () => {
    const hash = await hashPassword("MinhaSenha123");
    expect(hash).not.toBe("MinhaSenha123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verify com senha correta retorna true", async () => {
    const hash = await hashPassword("MinhaSenha123");
    expect(await verifyPassword("MinhaSenha123", hash)).toBe(true);
  });

  it("verify com senha errada retorna false", async () => {
    const hash = await hashPassword("MinhaSenha123");
    expect(await verifyPassword("Errada", hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Implementar**

```ts
import bcrypt from "bcrypt";

const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 3: Rodar teste**

Run: `cd apps/api && pnpm test src/lib/__tests__/password.test.ts`
Expected: PASS (pode demorar 2-5s pelo cost 12).

## Task 31: Lib de hash SHA-256 (refresh tokens)

**Files:**
- Create: `apps/api/src/lib/hash.ts`
- Test: `apps/api/src/lib/__tests__/hash.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it } from "vitest";
import { sha256 } from "../hash";

describe("sha256", () => {
  it("produz hex de 64 chars", () => {
    expect(sha256("abc").length).toBe(64);
  });

  it("é determinístico", () => {
    expect(sha256("xyz")).toBe(sha256("xyz"));
  });

  it("muda com input diferente", () => {
    expect(sha256("a")).not.toBe(sha256("b"));
  });
});
```

- [ ] **Step 2: Implementar**

```ts
import { createHash } from "node:crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
```

- [ ] **Step 3: Rodar teste**

Run: `pnpm test src/lib/__tests__/hash.test.ts`
Expected: PASS.

## Task 32: Lib JWT (sign/verify)

**Files:**
- Create: `apps/api/src/lib/jwt.ts`
- Test: `apps/api/src/lib/__tests__/jwt.test.ts`

- [ ] **Step 1: Adicionar dep jsonwebtoken**

```bash
cd apps/api
pnpm add jsonwebtoken
pnpm add -D @types/jsonwebtoken
```

- [ ] **Step 2: Teste**

```ts
import { describe, expect, it } from "vitest";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "../jwt";

describe("jwt", () => {
  it("access token roundtrip", () => {
    const token = signAccessToken({ userId: "u1" });
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe("u1");
    expect(decoded.type).toBe("access");
  });

  it("refresh token roundtrip", () => {
    const token = signRefreshToken({ userId: "u1", tokenId: "t1" });
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe("u1");
    expect(decoded.tokenId).toBe("t1");
    expect(decoded.type).toBe("refresh");
  });

  it("verifyAccess rejeita refresh", () => {
    const refresh = signRefreshToken({ userId: "u1", tokenId: "t1" });
    expect(() => verifyAccessToken(refresh)).toThrow();
  });

  it("verifyRefresh rejeita access", () => {
    const access = signAccessToken({ userId: "u1" });
    expect(() => verifyRefreshToken(access)).toThrow();
  });
});
```

- [ ] **Step 3: Implementar**

```ts
import jwt from "jsonwebtoken";
import { env } from "../env.js";
import { UnauthorizedError } from "./errors.js";

export interface AccessPayload {
  userId: string;
  type: "access";
}

export interface RefreshPayload {
  userId: string;
  tokenId: string;
  type: "refresh";
}

export function signAccessToken(input: { userId: string }): string {
  const payload: AccessPayload = { userId: input.userId, type: "access" };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_TTL } as jwt.SignOptions);
}

export function signRefreshToken(input: { userId: string; tokenId: string }): string {
  const payload: RefreshPayload = {
    userId: input.userId,
    tokenId: input.tokenId,
    type: "refresh",
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_TTL } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & AccessPayload;
    if (decoded.type !== "access") throw new UnauthorizedError("Token inválido");
    return { userId: decoded.userId, type: "access" };
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado");
  }
}

export function verifyRefreshToken(token: string): RefreshPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & RefreshPayload;
    if (decoded.type !== "refresh") throw new UnauthorizedError("Refresh token inválido");
    return { userId: decoded.userId, tokenId: decoded.tokenId, type: "refresh" };
  } catch {
    throw new UnauthorizedError("Refresh token inválido ou expirado");
  }
}
```

- [ ] **Step 4: Rodar teste**

Run: `pnpm test src/lib/__tests__/jwt.test.ts`
Expected: PASS.

## Task 33: Plugin de logger (pino)

**Files:**
- Create: `apps/api/src/plugins/logger.ts`

- [ ] **Step 1: Implementar**

```ts
import { env } from "../env.js";
import type { LoggerOptions } from "pino";

export const loggerConfig: LoggerOptions = {
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.body.password',
      'req.body.passwordHash',
      'req.body.refreshToken',
      'res.headers["set-cookie"]',
    ],
    censor: "[REDACTED]",
  },
  ...(env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss.l" },
    },
  }),
};
```

## Task 34: Plugin de error handler

**Files:**
- Create: `apps/api/src/plugins/error-handler.ts`

- [ ] **Step 1: Implementar**

```ts
import type { FastifyInstance, FastifyError } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
        },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.status(409).send({
          error: { code: "CONFLICT", message: "Recurso já existe", details: error.meta },
        });
      }
      if (error.code === "P2025") {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Recurso não encontrado" },
        });
      }
    }

    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.validation,
        },
      });
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: { code: "RATE_LIMITED", message: "Muitas requisições, tente em alguns segundos" },
      });
    }

    req.log.error({ err: error }, "Unhandled error");
    return reply.status(500).send({
      error: { code: "INTERNAL", message: "Erro interno do servidor" },
    });
  });
}
```

## Task 35: Plugin de auth (decorator authenticate)

**Files:**
- Create: `apps/api/src/plugins/auth.ts`

- [ ] **Step 1: Implementar**

```ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { verifyAccessToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../lib/errors.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => void;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest("userId", "");
  app.decorate("authenticate", (req: FastifyRequest) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authorization header ausente ou malformado");
    }
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
  });
});
```

- [ ] **Step 2: Adicionar fastify-plugin**

```bash
cd apps/api
pnpm add fastify-plugin
```

## Task 36: Plugin de swagger

**Files:**
- Create: `apps/api/src/plugins/swagger.ts`

- [ ] **Step 1: Implementar**

```ts
import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "TaskBoard API",
        description: "Portfolio-grade Kanban API",
        version: "0.1.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: true },
  });
}
```

## Task 37: Health routes

**Files:**
- Create: `apps/api/src/modules/health/health.routes.ts`

- [ ] **Step 1: Implementar**

```ts
import type { FastifyInstance } from "fastify";
import { prisma } from "../../prisma.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/healthz", { schema: { tags: ["health"] } }, async () => ({ status: "ok" }));

  app.get("/readyz", { schema: { tags: ["health"] } }, async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ready" };
  });
}
```

## Task 38: app.ts — Fastify factory

**Files:**
- Create: `apps/api/src/app.ts`

- [ ] **Step 1: Implementar**

```ts
import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { env } from "./env.js";
import { loggerConfig } from "./plugins/logger.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { authPlugin } from "./plugins/auth.js";
import { registerSwagger } from "./plugins/swagger.js";
import { healthRoutes } from "./modules/health/health.routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: loggerConfig, disableRequestLogging: false });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(authPlugin);
  await registerSwagger(app);

  registerErrorHandler(app);

  await app.register(healthRoutes);

  return app;
}
```

## Task 39: server.ts — entrypoint

**Files:**
- Create: `apps/api/src/server.ts`

- [ ] **Step 1: Implementar**

```ts
import { buildApp } from "./app.js";
import { env } from "./env.js";

async function main(): Promise<void> {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info({ docs: `http://localhost:${env.PORT}/docs` }, "API ready");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

await main();
```

## Task 40: Subir API e validar /healthz, /readyz, /docs

- [ ] **Step 1: Rodar dev server**

```bash
cd apps/api
pnpm dev
```

Expected: log do pino-pretty mostrando "API ready" e URL docs.

- [ ] **Step 2: Em outro terminal, testar /healthz**

```bash
curl -s http://localhost:3001/healthz
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Testar /readyz**

```bash
curl -s http://localhost:3001/readyz
```

Expected: `{"status":"ready"}`

- [ ] **Step 4: Verificar /docs no browser**

Abrir `http://localhost:3001/docs` em browser. Expected: Swagger UI carrega, lista `/healthz` e `/readyz`.

- [ ] **Step 5: Encerrar dev server** (Ctrl+C)

- [ ] **Step 6: Commit**

```bash
cd /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager
git add .
git commit -m "feat(api): bootstrap fastify with prisma, swagger, healthchecks, auth plugin"
```

## Task 41: Test helpers (build app + DB de teste)

**Files:**
- Modify: `apps/api/test/setup.ts`
- Create: `apps/api/test/helpers.ts`, `apps/api/test/db-utils.ts`

- [ ] **Step 1: db-utils.ts**

```ts
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const TEST_DB_URL =
  process.env.DATABASE_URL ??
  "postgresql://taskboard:taskboard@localhost:5432/taskboard_test?schema=public";

export const testPrisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

export function migrateTestDb(): void {
  execSync("pnpm prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: "inherit",
  });
}

export async function resetTestDb(): Promise<void> {
  await testPrisma.$transaction([
    testPrisma.comment.deleteMany(),
    testPrisma.task.deleteMany(),
    testPrisma.refreshToken.deleteMany(),
    testPrisma.user.deleteMany(),
  ]);
}

export async function seedTestCategories(): Promise<void> {
  const cats = [
    { name: "Desenvolvimento", icon: "code" },
    { name: "Design", icon: "palette" },
  ];
  for (const c of cats) {
    await testPrisma.category.upsert({ where: { name: c.name }, update: {}, create: c });
  }
}
```

- [ ] **Step 2: Atualizar test/setup.ts**

```ts
import { beforeAll, afterAll } from "vitest";
import { migrateTestDb, testPrisma, resetTestDb, seedTestCategories } from "./db-utils";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-chars-long";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://taskboard:taskboard@localhost:5432/taskboard_test?schema=public";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.LOG_LEVEL = "warn";

beforeAll(async () => {
  migrateTestDb();
  await resetTestDb();
  await seedTestCategories();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
```

- [ ] **Step 3: helpers.ts (build app pra testes)**

```ts
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app";

export async function buildTestApp(): Promise<FastifyInstance> {
  return buildApp();
}

export function authHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}
```

- [ ] **Step 4: Criar DB de teste**

```bash
docker exec -it taskboard-postgres psql -U taskboard -d postgres -c "CREATE DATABASE taskboard_test;"
```

(Se já existir: ignorar erro de "database already exists".)

- [ ] **Step 5: Rodar suite atual pra ver que setup funciona**

```bash
cd apps/api
pnpm test
```

Expected: testes existentes (env, errors, password, hash, jwt) passam. Migration rodada no DB de teste.

---

# Phase 4 — Auth backend

## Task 42: Auth repository (TDD)

**Files:**
- Create: `apps/api/src/modules/auth/auth.repository.ts`
- Test: `apps/api/src/modules/auth/__tests__/auth.repository.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { authRepository } from "../auth.repository";
import { testPrisma, resetTestDb } from "../../../../test/db-utils";

describe("authRepository", () => {
  beforeEach(async () => {
    await resetTestDb();
    await testPrisma.category.upsert({
      where: { name: "Desenvolvimento" },
      update: {},
      create: { name: "Desenvolvimento", icon: "code" },
    });
  });

  it("createUser persiste e retorna user sem passwordHash", async () => {
    const user = await authRepository.createUser({
      email: "a@b.com",
      name: "A",
      passwordHash: "hashed",
    });
    expect(user.email).toBe("a@b.com");
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("findByEmail retorna user com hash", async () => {
    await authRepository.createUser({ email: "a@b.com", name: "A", passwordHash: "h" });
    const user = await authRepository.findByEmailWithHash("a@b.com");
    expect(user?.passwordHash).toBe("h");
  });

  it("createRefreshToken e findRefreshTokenByHash", async () => {
    const user = await authRepository.createUser({ email: "a@b.com", name: "A", passwordHash: "h" });
    const expires = new Date(Date.now() + 60_000);
    const rt = await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "thash",
      expiresAt: expires,
    });
    expect(rt.tokenHash).toBe("thash");
    const found = await authRepository.findRefreshTokenByHash("thash");
    expect(found?.id).toBe(rt.id);
  });

  it("revokeRefreshToken marca revokedAt", async () => {
    const user = await authRepository.createUser({ email: "a@b.com", name: "A", passwordHash: "h" });
    const rt = await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "thash",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await authRepository.revokeRefreshToken(rt.id);
    const found = await authRepository.findRefreshTokenByHash("thash");
    expect(found?.revokedAt).toBeInstanceOf(Date);
  });

  it("revokeAllUserRefreshTokens revoga todos do user", async () => {
    const user = await authRepository.createUser({ email: "a@b.com", name: "A", passwordHash: "h" });
    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "h1",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "h2",
      expiresAt: new Date(Date.now() + 60_000),
    });
    const count = await authRepository.revokeAllUserRefreshTokens(user.id);
    expect(count).toBe(2);
  });
});
```

- [ ] **Step 2: Implementar**

```ts
import { prisma } from "../../prisma.js";

export const authRepository = {
  async createUser(input: { email: string; name: string; passwordHash: string }) {
    return prisma.user.create({
      data: input,
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
  },

  async findByEmailWithHash(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
  },

  async createRefreshToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data: input });
  },

  async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  },

  async revokeAllUserRefreshTokens(userId: string): Promise<number> {
    const result = await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  },
};
```

- [ ] **Step 3: Rodar testes**

```bash
cd apps/api
pnpm test src/modules/auth
```

Expected: PASS.

## Task 43: Auth service (signup, login, refresh, logout) — TDD

**Files:**
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Test: `apps/api/src/modules/auth/__tests__/auth.service.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { authService } from "../auth.service";
import { resetTestDb } from "../../../../test/db-utils";
import { UnauthorizedError, ConflictError } from "../../../lib/errors";

describe("authService", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  describe("signup", () => {
    it("cria user e retorna tokens", async () => {
      const r = await authService.signup({
        email: "a@b.com",
        password: "Senha12345",
        name: "Ricardo",
      });
      expect(r.user.email).toBe("a@b.com");
      expect(r.accessToken).toBeTruthy();
      expect(r.refreshToken).toBeTruthy();
    });

    it("rejeita email duplicado", async () => {
      await authService.signup({ email: "a@b.com", password: "Senha12345", name: "A" });
      await expect(
        authService.signup({ email: "a@b.com", password: "Senha12345", name: "B" }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("login", () => {
    it("retorna tokens com credenciais corretas", async () => {
      await authService.signup({ email: "a@b.com", password: "Senha12345", name: "A" });
      const r = await authService.login({ email: "a@b.com", password: "Senha12345" });
      expect(r.accessToken).toBeTruthy();
    });

    it("rejeita senha errada", async () => {
      await authService.signup({ email: "a@b.com", password: "Senha12345", name: "A" });
      await expect(
        authService.login({ email: "a@b.com", password: "Errada123" }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("rejeita email inexistente", async () => {
      await expect(
        authService.login({ email: "ninguem@x.com", password: "Qualquer1" }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("refresh", () => {
    it("rotaciona token: emite novo e revoga antigo", async () => {
      const initial = await authService.signup({
        email: "a@b.com",
        password: "Senha12345",
        name: "A",
      });
      const refreshed = await authService.refresh(initial.refreshToken);
      expect(refreshed.refreshToken).not.toBe(initial.refreshToken);
      expect(refreshed.accessToken).toBeTruthy();
      await expect(authService.refresh(initial.refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });

    it("detecta reuso: revoga todos do user", async () => {
      const initial = await authService.signup({
        email: "a@b.com",
        password: "Senha12345",
        name: "A",
      });
      const rotated = await authService.refresh(initial.refreshToken);
      // tentar usar o antigo de novo
      await expect(authService.refresh(initial.refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
      // o novo também deve ter sido revogado (proteção contra reuso)
      await expect(authService.refresh(rotated.refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });
  });

  describe("logout", () => {
    it("revoga refresh token corrente", async () => {
      const initial = await authService.signup({
        email: "a@b.com",
        password: "Senha12345",
        name: "A",
      });
      await authService.logout(initial.refreshToken);
      await expect(authService.refresh(initial.refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });
  });
});
```

- [ ] **Step 2: Implementar**

```ts
import { randomUUID } from "node:crypto";
import { authRepository } from "./auth.repository.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { sha256 } from "../../lib/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";
import { ConflictError, UnauthorizedError } from "../../lib/errors.js";
import { env } from "../../env.js";
import type { AuthResponse, LoginInput, SignupInput } from "@taskboard/shared";

function parseDurationToMs(s: string): number {
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) throw new Error(`Duração inválida: ${s}`);
  const n = Number(m[1]);
  const unit = m[2];
  const mult = unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return n * mult;
}

async function issueTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenId = randomUUID();
  const refreshToken = signRefreshToken({ userId, tokenId });
  const tokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL));
  await authRepository.createRefreshToken({ userId, tokenHash, expiresAt });
  const accessToken = signAccessToken({ userId });
  return { accessToken, refreshToken };
}

export const authService = {
  async signup(input: SignupInput): Promise<AuthResponse> {
    const existing = await authRepository.findByEmailWithHash(input.email);
    if (existing) throw new ConflictError("Email já cadastrado");

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    const tokens = await issueTokens(user.id);
    return { user, ...tokens };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await authRepository.findByEmailWithHash(input.email);
    if (!user) throw new UnauthorizedError("Credenciais inválidas");

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Credenciais inválidas");

    const tokens = await issueTokens(user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ...tokens,
    };
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = sha256(refreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored) {
      throw new UnauthorizedError("Refresh token inválido");
    }

    if (stored.revokedAt) {
      // reuso detectado — revoga todos os tokens do user
      await authRepository.revokeAllUserRefreshTokens(payload.userId);
      throw new UnauthorizedError("Refresh token reutilizado, sessão revogada");
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token expirado");
    }

    await authRepository.revokeRefreshToken(stored.id);

    const user = await authRepository.findById(payload.userId);
    if (!user) throw new UnauthorizedError("Usuário não encontrado");

    const tokens = await issueTokens(user.id);
    return { user, ...tokens };
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = sha256(refreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);
    if (stored && !stored.revokedAt) {
      await authRepository.revokeRefreshToken(stored.id);
    }
  },
};
```

- [ ] **Step 3: Rodar testes**

```bash
pnpm test src/modules/auth
```

Expected: PASS.

## Task 44: Auth routes + integration tests

**Files:**
- Create: `apps/api/src/modules/auth/auth.routes.ts`
- Test: `apps/api/src/modules/auth/__tests__/auth.routes.test.ts`
- Modify: `apps/api/src/app.ts` (registrar rotas)

- [ ] **Step 1: Teste de integração**

```ts
import { describe, expect, it, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../../../../test/helpers";
import { resetTestDb } from "../../../../test/db-utils";

let app: FastifyInstance;

beforeEach(async () => {
  await resetTestDb();
  if (!app) app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

describe("POST /api/v1/auth/signup", () => {
  it("201 com dados válidos", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "Ricardo" },
    });
    expect(r.statusCode).toBe(201);
    const body = r.json();
    expect(body.user.email).toBe("a@b.com");
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });

  it("400 com email inválido", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "x", password: "Senha12345", name: "A" },
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("409 com email duplicado", async () => {
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "A" },
    });
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "B" },
    });
    expect(r.statusCode).toBe(409);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("200 com credenciais corretas", async () => {
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "A" },
    });
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "a@b.com", password: "Senha12345" },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().accessToken).toBeTruthy();
  });

  it("401 com senha errada", async () => {
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "A" },
    });
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "a@b.com", password: "Errada123" },
    });
    expect(r.statusCode).toBe(401);
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("200 com refresh válido", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "A" },
    });
    const { refreshToken } = signup.json();
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      payload: { refreshToken },
    });
    expect(r.statusCode).toBe(200);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("204 e revoga refresh", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "A" },
    });
    const { refreshToken } = signup.json();
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      payload: { refreshToken },
    });
    expect(r.statusCode).toBe(204);
  });
});
```

- [ ] **Step 2: Implementar rotas**

```ts
import type { FastifyInstance } from "fastify";
import { signupSchema, loginSchema, refreshSchema } from "@taskboard/shared";
import { authService } from "./auth.service.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/signup",
    { schema: { tags: ["auth"], body: signupSchema } },
    async (req, reply) => {
      const input = signupSchema.parse(req.body);
      const result = await authService.signup(input);
      return reply.status(201).send(result);
    },
  );

  app.post(
    "/login",
    { schema: { tags: ["auth"], body: loginSchema } },
    async (req) => {
      const input = loginSchema.parse(req.body);
      return authService.login(input);
    },
  );

  app.post(
    "/refresh",
    { schema: { tags: ["auth"], body: refreshSchema } },
    async (req) => {
      const { refreshToken } = refreshSchema.parse(req.body);
      return authService.refresh(refreshToken);
    },
  );

  app.post(
    "/logout",
    { schema: { tags: ["auth"], body: refreshSchema } },
    async (req, reply) => {
      const { refreshToken } = refreshSchema.parse(req.body);
      await authService.logout(refreshToken);
      return reply.status(204).send();
    },
  );
}
```

- [ ] **Step 3: Registrar em app.ts**

Modify `apps/api/src/app.ts`. Adicionar import e registro:

```ts
// junto com outros imports
import { authRoutes } from "./modules/auth/auth.routes.js";
```

E logo após `await app.register(healthRoutes);`:

```ts
await app.register(authRoutes, { prefix: "/api/v1/auth" });
```

- [ ] **Step 4: Rodar testes integration**

```bash
pnpm test src/modules/auth/__tests__/auth.routes.test.ts
```

Expected: PASS.

## Task 45: Users module (/me)

**Files:**
- Create: `apps/api/src/modules/users/users.routes.ts`, `apps/api/src/modules/users/users.service.ts`
- Test: `apps/api/src/modules/users/__tests__/users.routes.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../../../../test/helpers";
import { resetTestDb } from "../../../../test/db-utils";

let app: FastifyInstance;

beforeEach(async () => {
  await resetTestDb();
  if (!app) app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

async function signupAndGetToken() {
  const r = await app.inject({
    method: "POST",
    url: "/api/v1/auth/signup",
    payload: { email: "a@b.com", password: "Senha12345", name: "Ricardo" },
  });
  return r.json();
}

describe("GET /api/v1/me", () => {
  it("200 com user logado", async () => {
    const { accessToken } = await signupAndGetToken();
    const r = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().email).toBe("a@b.com");
  });

  it("401 sem token", async () => {
    const r = await app.inject({ method: "GET", url: "/api/v1/me" });
    expect(r.statusCode).toBe(401);
  });

  it("401 com token inválido", async () => {
    const r = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { authorization: "Bearer invalid" },
    });
    expect(r.statusCode).toBe(401);
  });
});
```

- [ ] **Step 2: users.service.ts**

```ts
import { authRepository } from "../auth/auth.repository.js";
import { NotFoundError } from "../../lib/errors.js";

export const usersService = {
  async getById(id: string) {
    const user = await authRepository.findById(id);
    if (!user) throw new NotFoundError("Usuário");
    return user;
  },
};
```

- [ ] **Step 3: users.routes.ts**

```ts
import type { FastifyInstance } from "fastify";
import { usersService } from "./users.service.js";

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/me",
    { preHandler: [app.authenticate], schema: { tags: ["users"], security: [{ bearerAuth: [] }] } },
    async (req) => {
      return usersService.getById(req.userId);
    },
  );
}
```

- [ ] **Step 4: Registrar em app.ts**

```ts
import { usersRoutes } from "./modules/users/users.routes.js";
// ...
await app.register(usersRoutes, { prefix: "/api/v1" });
```

- [ ] **Step 5: Rodar testes**

Run: `pnpm test src/modules/users`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(api): auth (signup/login/refresh/logout) + /me"
```

---

# Phase 5 — Tasks, Categories, Comments

## Task 46: Categories repository + service + routes

**Files:**
- Create: `apps/api/src/modules/categories/{categories.repository,categories.service,categories.routes}.ts`
- Test: `apps/api/src/modules/categories/__tests__/categories.routes.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../../../../test/helpers";
import { resetTestDb, seedTestCategories } from "../../../../test/db-utils";

let app: FastifyInstance;

beforeEach(async () => {
  await resetTestDb();
  await seedTestCategories();
  if (!app) app = await buildTestApp();
});
afterAll(async () => { await app.close(); });

async function tokenize() {
  const r = await app.inject({
    method: "POST",
    url: "/api/v1/auth/signup",
    payload: { email: "a@b.com", password: "Senha12345", name: "A" },
  });
  return r.json().accessToken as string;
}

describe("GET /api/v1/categories", () => {
  it("401 sem auth", async () => {
    const r = await app.inject({ method: "GET", url: "/api/v1/categories" });
    expect(r.statusCode).toBe(401);
  });

  it("200 com lista de categorias seedadas", async () => {
    const token = await tokenize();
    const r = await app.inject({
      method: "GET",
      url: "/api/v1/categories",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(200);
    const list = r.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0]).toHaveProperty("name");
    expect(list[0]).toHaveProperty("icon");
  });
});
```

- [ ] **Step 2: categories.repository.ts**

```ts
import { prisma } from "../../prisma.js";

export const categoriesRepository = {
  async list() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },
  async findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },
};
```

- [ ] **Step 3: categories.service.ts**

```ts
import { categoriesRepository } from "./categories.repository.js";

export const categoriesService = {
  async list() {
    return categoriesRepository.list();
  },
};
```

- [ ] **Step 4: categories.routes.ts**

```ts
import type { FastifyInstance } from "fastify";
import { categoriesService } from "./categories.service.js";

export async function categoriesRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/categories",
    { preHandler: [app.authenticate], schema: { tags: ["categories"], security: [{ bearerAuth: [] }] } },
    async () => categoriesService.list(),
  );
}
```

- [ ] **Step 5: Registrar em app.ts**

```ts
import { categoriesRoutes } from "./modules/categories/categories.routes.js";
// ...
await app.register(categoriesRoutes, { prefix: "/api/v1" });
```

- [ ] **Step 6: Rodar testes**

Run: `pnpm test src/modules/categories`
Expected: PASS.

## Task 47: Tasks repository (TDD)

**Files:**
- Create: `apps/api/src/modules/tasks/tasks.repository.ts`
- Test: `apps/api/src/modules/tasks/__tests__/tasks.repository.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { tasksRepository } from "../tasks.repository";
import { testPrisma, resetTestDb, seedTestCategories } from "../../../../test/db-utils";

async function makeUser(suffix = "") {
  return testPrisma.user.create({
    data: { email: `u${suffix}@x.com`, name: "U", passwordHash: "x" },
  });
}

async function makeCategory() {
  return testPrisma.category.findFirstOrThrow();
}

describe("tasksRepository", () => {
  beforeEach(async () => {
    await resetTestDb();
    await seedTestCategories();
  });

  it("create + listByUser", async () => {
    const user = await makeUser();
    const cat = await makeCategory();
    await tasksRepository.create({
      userId: user.id,
      title: "T1",
      description: "",
      priority: "HIGH",
      categoryId: cat.id,
      dueDate: null,
    });
    const list = await tasksRepository.listByUser(user.id);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("T1");
  });

  it("listByUser isola entre users", async () => {
    const u1 = await makeUser("1");
    const u2 = await makeUser("2");
    const cat = await makeCategory();
    await tasksRepository.create({
      userId: u1.id, title: "A", description: "", priority: "LOW", categoryId: cat.id, dueDate: null,
    });
    await tasksRepository.create({
      userId: u2.id, title: "B", description: "", priority: "LOW", categoryId: cat.id, dueDate: null,
    });
    expect(await tasksRepository.listByUser(u1.id)).toHaveLength(1);
  });

  it("findByIdForUser retorna null se for de outro user", async () => {
    const u1 = await makeUser("1");
    const u2 = await makeUser("2");
    const cat = await makeCategory();
    const t = await tasksRepository.create({
      userId: u1.id, title: "X", description: "", priority: "LOW", categoryId: cat.id, dueDate: null,
    });
    expect(await tasksRepository.findByIdForUser(t.id, u2.id)).toBeNull();
    expect(await tasksRepository.findByIdForUser(t.id, u1.id)).not.toBeNull();
  });

  it("update e updateStatus", async () => {
    const u = await makeUser();
    const cat = await makeCategory();
    const t = await tasksRepository.create({
      userId: u.id, title: "X", description: "", priority: "LOW", categoryId: cat.id, dueDate: null,
    });
    const upd = await tasksRepository.update(t.id, { title: "Y" });
    expect(upd.title).toBe("Y");
    const s = await tasksRepository.updateStatus(t.id, "DONE");
    expect(s.status).toBe("DONE");
  });

  it("delete remove", async () => {
    const u = await makeUser();
    const cat = await makeCategory();
    const t = await tasksRepository.create({
      userId: u.id, title: "X", description: "", priority: "LOW", categoryId: cat.id, dueDate: null,
    });
    await tasksRepository.delete(t.id);
    expect(await tasksRepository.findByIdForUser(t.id, u.id)).toBeNull();
  });
});
```

- [ ] **Step 2: Implementar**

```ts
import { prisma } from "../../prisma.js";
import type { Prisma, Status } from "@prisma/client";

export const tasksRepository = {
  async create(input: {
    userId: string;
    title: string;
    description: string;
    priority: Prisma.TaskCreateInput["priority"];
    categoryId: string;
    dueDate: Date | null;
  }) {
    return prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate,
        user: { connect: { id: input.userId } },
        category: { connect: { id: input.categoryId } },
      },
      include: { category: true },
    });
  },

  async listByUser(
    userId: string,
    filters: { status?: Status; priority?: Prisma.TaskCreateInput["priority"]; categoryId?: string } = {},
  ) {
    return prisma.task.findMany({
      where: { userId, ...filters },
      include: { category: true },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  },

  async findByIdForUser(id: string, userId: string) {
    return prisma.task.findFirst({
      where: { id, userId },
      include: { category: true, comments: { orderBy: { createdAt: "asc" } } },
    });
  },

  async update(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({ where: { id }, data, include: { category: true } });
  },

  async updateStatus(id: string, status: Status) {
    return prisma.task.update({ where: { id }, data: { status }, include: { category: true } });
  },

  async delete(id: string) {
    await prisma.task.delete({ where: { id } });
  },
};
```

- [ ] **Step 3: Rodar testes**

Run: `pnpm test src/modules/tasks/__tests__/tasks.repository.test.ts`
Expected: PASS.

## Task 48: Tasks service

**Files:**
- Create: `apps/api/src/modules/tasks/tasks.service.ts`
- Test: `apps/api/src/modules/tasks/__tests__/tasks.service.test.ts`

- [ ] **Step 1: Teste**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { tasksService } from "../tasks.service";
import { testPrisma, resetTestDb, seedTestCategories } from "../../../../test/db-utils";
import { NotFoundError } from "../../../lib/errors";

async function mkUser(s = "") {
  return testPrisma.user.create({ data: { email: `u${s}@x.com`, name: "U", passwordHash: "x" } });
}

describe("tasksService", () => {
  beforeEach(async () => {
    await resetTestDb();
    await seedTestCategories();
  });

  it("create exige categoria existente", async () => {
    const u = await mkUser();
    await expect(
      tasksService.create(u.id, {
        title: "X",
        priority: "HIGH",
        categoryId: "nope",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("update rejeita task de outro user", async () => {
    const u1 = await mkUser("1");
    const u2 = await mkUser("2");
    const cat = await testPrisma.category.findFirstOrThrow();
    const t = await tasksService.create(u1.id, {
      title: "X",
      priority: "LOW",
      categoryId: cat.id,
    });
    await expect(
      tasksService.update(u2.id, t.id, { title: "Hack" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
```

- [ ] **Step 2: Implementar**

```ts
import { tasksRepository } from "./tasks.repository.js";
import { categoriesRepository } from "../categories/categories.repository.js";
import { NotFoundError } from "../../lib/errors.js";
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from "@taskboard/shared";

function toDate(s?: string | null): Date | null {
  return s ? new Date(s) : null;
}

export const tasksService = {
  async list(userId: string, filters: { status?: TaskStatus; priority?: string; categoryId?: string }) {
    return tasksRepository.listByUser(userId, filters as never);
  },

  async getById(userId: string, id: string) {
    const task = await tasksRepository.findByIdForUser(id, userId);
    if (!task) throw new NotFoundError("Tarefa");
    return task;
  },

  async create(userId: string, input: CreateTaskInput) {
    const cat = await categoriesRepository.findById(input.categoryId);
    if (!cat) throw new NotFoundError("Categoria");
    return tasksRepository.create({
      userId,
      title: input.title,
      description: input.description ?? "",
      priority: input.priority,
      categoryId: input.categoryId,
      dueDate: toDate(input.dueDate),
    });
  },

  async update(userId: string, id: string, input: UpdateTaskInput) {
    const existing = await tasksRepository.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError("Tarefa");

    if (input.categoryId && input.categoryId !== existing.categoryId) {
      const cat = await categoriesRepository.findById(input.categoryId);
      if (!cat) throw new NotFoundError("Categoria");
    }

    return tasksRepository.update(id, {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.categoryId !== undefined && { category: { connect: { id: input.categoryId } } }),
      ...(input.dueDate !== undefined && { dueDate: toDate(input.dueDate) }),
      ...(input.status !== undefined && { status: input.status }),
    });
  },

  async updateStatus(userId: string, id: string, status: TaskStatus) {
    const existing = await tasksRepository.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError("Tarefa");
    return tasksRepository.updateStatus(id, status);
  },

  async delete(userId: string, id: string) {
    const existing = await tasksRepository.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundError("Tarefa");
    await tasksRepository.delete(id);
  },
};
```

- [ ] **Step 3: Rodar testes**

Run: `pnpm test src/modules/tasks/__tests__/tasks.service.test.ts`
Expected: PASS.

## Task 49: Tasks routes + integration tests

**Files:**
- Create: `apps/api/src/modules/tasks/tasks.routes.ts`
- Test: `apps/api/src/modules/tasks/__tests__/tasks.routes.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Teste integration**

```ts
import { describe, expect, it, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../../../../test/helpers";
import { resetTestDb, seedTestCategories, testPrisma } from "../../../../test/db-utils";

let app: FastifyInstance;
let token: string;
let categoryId: string;

beforeEach(async () => {
  await resetTestDb();
  await seedTestCategories();
  if (!app) app = await buildTestApp();
  const r = await app.inject({
    method: "POST",
    url: "/api/v1/auth/signup",
    payload: { email: "a@b.com", password: "Senha12345", name: "A" },
  });
  token = r.json().accessToken;
  const cat = await testPrisma.category.findFirstOrThrow();
  categoryId = cat.id;
});
afterAll(async () => { await app.close(); });

const auth = () => ({ authorization: `Bearer ${token}` });

describe("tasks routes", () => {
  it("POST /tasks → 201", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "Nova", priority: "HIGH", categoryId },
    });
    expect(r.statusCode).toBe(201);
    expect(r.json().title).toBe("Nova");
  });

  it("POST /tasks → 400 quando título vazio", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "", priority: "HIGH", categoryId },
    });
    expect(r.statusCode).toBe(400);
  });

  it("GET /tasks lista só do user", async () => {
    await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "Minha", priority: "LOW", categoryId },
    });
    const r = await app.inject({ method: "GET", url: "/api/v1/tasks", headers: auth() });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toHaveLength(1);
  });

  it("PATCH /tasks/:id/status muda status", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "X", priority: "LOW", categoryId },
    });
    const id = created.json().id;
    const r = await app.inject({
      method: "PATCH",
      url: `/api/v1/tasks/${id}/status`,
      headers: auth(),
      payload: { status: "DONE" },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json().status).toBe("DONE");
  });

  it("DELETE /tasks/:id 204", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "X", priority: "LOW", categoryId },
    });
    const id = created.json().id;
    const r = await app.inject({
      method: "DELETE",
      url: `/api/v1/tasks/${id}`,
      headers: auth(),
    });
    expect(r.statusCode).toBe(204);
  });

  it("não acessa task de outro user", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "X", priority: "LOW", categoryId },
    });
    const id = created.json().id;
    const other = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "other@x.com", password: "Senha12345", name: "Other" },
    });
    const otherToken = other.json().accessToken;
    const r = await app.inject({
      method: "GET",
      url: `/api/v1/tasks/${id}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(r.statusCode).toBe(404);
  });
});
```

- [ ] **Step 2: Implementar rotas**

```ts
import type { FastifyInstance } from "fastify";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskStatusSchema,
  taskPrioritySchema,
} from "@taskboard/shared";
import { z } from "zod";
import { tasksService } from "./tasks.service.js";

const listQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  categoryId: z.string().optional(),
});

const idParamsSchema = z.object({ id: z.string().min(1) });

export async function tasksRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get(
    "/",
    { schema: { tags: ["tasks"], security: [{ bearerAuth: [] }], querystring: listQuerySchema } },
    async (req) => tasksService.list(req.userId, listQuerySchema.parse(req.query)),
  );

  app.get(
    "/:id",
    { schema: { tags: ["tasks"], security: [{ bearerAuth: [] }], params: idParamsSchema } },
    async (req) => {
      const { id } = idParamsSchema.parse(req.params);
      return tasksService.getById(req.userId, id);
    },
  );

  app.post(
    "/",
    { schema: { tags: ["tasks"], security: [{ bearerAuth: [] }], body: createTaskSchema } },
    async (req, reply) => {
      const input = createTaskSchema.parse(req.body);
      const created = await tasksService.create(req.userId, input);
      return reply.status(201).send(created);
    },
  );

  app.put(
    "/:id",
    { schema: { tags: ["tasks"], security: [{ bearerAuth: [] }], params: idParamsSchema, body: updateTaskSchema } },
    async (req) => {
      const { id } = idParamsSchema.parse(req.params);
      const input = updateTaskSchema.parse(req.body);
      return tasksService.update(req.userId, id, input);
    },
  );

  app.patch(
    "/:id/status",
    { schema: { tags: ["tasks"], security: [{ bearerAuth: [] }], params: idParamsSchema, body: updateTaskStatusSchema } },
    async (req) => {
      const { id } = idParamsSchema.parse(req.params);
      const { status } = updateTaskStatusSchema.parse(req.body);
      return tasksService.updateStatus(req.userId, id, status);
    },
  );

  app.delete(
    "/:id",
    { schema: { tags: ["tasks"], security: [{ bearerAuth: [] }], params: idParamsSchema } },
    async (req, reply) => {
      const { id } = idParamsSchema.parse(req.params);
      await tasksService.delete(req.userId, id);
      return reply.status(204).send();
    },
  );
}
```

- [ ] **Step 3: Registrar em app.ts**

```ts
import { tasksRoutes } from "./modules/tasks/tasks.routes.js";
// ...
await app.register(tasksRoutes, { prefix: "/api/v1/tasks" });
```

- [ ] **Step 4: Rodar**

Run: `pnpm test src/modules/tasks/__tests__/tasks.routes.test.ts`
Expected: PASS.

## Task 50: Comments module completo

**Files:**
- Create: `apps/api/src/modules/comments/{comments.repository,comments.service,comments.routes}.ts`
- Test: `apps/api/src/modules/comments/__tests__/comments.routes.test.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: comments.repository.ts**

```ts
import { prisma } from "../../prisma.js";

export const commentsRepository = {
  listByTask(taskId: string) {
    return prisma.comment.findMany({ where: { taskId }, orderBy: { createdAt: "asc" } });
  },
  create(input: { taskId: string; content: string; author: string }) {
    return prisma.comment.create({ data: input });
  },
  findById(id: string) {
    return prisma.comment.findUnique({ where: { id } });
  },
  delete(id: string) {
    return prisma.comment.delete({ where: { id } });
  },
};
```

- [ ] **Step 2: comments.service.ts**

```ts
import { commentsRepository } from "./comments.repository.js";
import { tasksRepository } from "../tasks/tasks.repository.js";
import { authRepository } from "../auth/auth.repository.js";
import { NotFoundError, ForbiddenError } from "../../lib/errors.js";

export const commentsService = {
  async listByTask(userId: string, taskId: string) {
    const task = await tasksRepository.findByIdForUser(taskId, userId);
    if (!task) throw new NotFoundError("Tarefa");
    return commentsRepository.listByTask(taskId);
  },

  async create(userId: string, taskId: string, content: string) {
    const task = await tasksRepository.findByIdForUser(taskId, userId);
    if (!task) throw new NotFoundError("Tarefa");
    const user = await authRepository.findById(userId);
    if (!user) throw new NotFoundError("Usuário");
    return commentsRepository.create({ taskId, content, author: user.name });
  },

  async delete(userId: string, commentId: string) {
    const c = await commentsRepository.findById(commentId);
    if (!c) throw new NotFoundError("Comentário");
    const task = await tasksRepository.findByIdForUser(c.taskId, userId);
    if (!task) throw new ForbiddenError();
    await commentsRepository.delete(commentId);
  },
};
```

- [ ] **Step 3: comments.routes.ts**

```ts
import type { FastifyInstance } from "fastify";
import { createCommentSchema } from "@taskboard/shared";
import { z } from "zod";
import { commentsService } from "./comments.service.js";

const idParams = z.object({ id: z.string().min(1) });

export async function commentsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get(
    "/tasks/:id/comments",
    { schema: { tags: ["comments"], security: [{ bearerAuth: [] }], params: idParams } },
    async (req) => {
      const { id } = idParams.parse(req.params);
      return commentsService.listByTask(req.userId, id);
    },
  );

  app.post(
    "/tasks/:id/comments",
    { schema: { tags: ["comments"], security: [{ bearerAuth: [] }], params: idParams, body: createCommentSchema } },
    async (req, reply) => {
      const { id } = idParams.parse(req.params);
      const { content } = createCommentSchema.parse(req.body);
      const c = await commentsService.create(req.userId, id, content);
      return reply.status(201).send(c);
    },
  );

  app.delete(
    "/comments/:id",
    { schema: { tags: ["comments"], security: [{ bearerAuth: [] }], params: idParams } },
    async (req, reply) => {
      const { id } = idParams.parse(req.params);
      await commentsService.delete(req.userId, id);
      return reply.status(204).send();
    },
  );
}
```

- [ ] **Step 4: Teste integration**

```ts
import { describe, expect, it, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../../../../test/helpers";
import { resetTestDb, seedTestCategories, testPrisma } from "../../../../test/db-utils";

let app: FastifyInstance;
let token: string;
let taskId: string;

beforeEach(async () => {
  await resetTestDb();
  await seedTestCategories();
  if (!app) app = await buildTestApp();
  const r = await app.inject({
    method: "POST",
    url: "/api/v1/auth/signup",
    payload: { email: "a@b.com", password: "Senha12345", name: "Ricardo" },
  });
  token = r.json().accessToken;
  const cat = await testPrisma.category.findFirstOrThrow();
  const t = await app.inject({
    method: "POST",
    url: "/api/v1/tasks",
    headers: { authorization: `Bearer ${token}` },
    payload: { title: "X", priority: "LOW", categoryId: cat.id },
  });
  taskId = t.json().id;
});
afterAll(async () => { await app.close(); });

const auth = () => ({ authorization: `Bearer ${token}` });

describe("comments", () => {
  it("POST → GET", async () => {
    const c = await app.inject({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/comments`,
      headers: auth(),
      payload: { content: "primeiro comentário" },
    });
    expect(c.statusCode).toBe(201);
    expect(c.json().author).toBe("Ricardo");

    const list = await app.inject({
      method: "GET",
      url: `/api/v1/tasks/${taskId}/comments`,
      headers: auth(),
    });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toHaveLength(1);
  });

  it("DELETE comentário", async () => {
    const c = await app.inject({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/comments`,
      headers: auth(),
      payload: { content: "x" },
    });
    const id = c.json().id;
    const del = await app.inject({
      method: "DELETE",
      url: `/api/v1/comments/${id}`,
      headers: auth(),
    });
    expect(del.statusCode).toBe(204);
  });

  it("não comenta em task de outro user", async () => {
    const other = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "x@y.com", password: "Senha12345", name: "Other" },
    });
    const otherToken = other.json().accessToken;
    const r = await app.inject({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/comments`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: { content: "hack" },
    });
    expect(r.statusCode).toBe(404);
  });
});
```

- [ ] **Step 5: Registrar em app.ts**

```ts
import { commentsRoutes } from "./modules/comments/comments.routes.js";
// ...
await app.register(commentsRoutes, { prefix: "/api/v1" });
```

- [ ] **Step 6: Rodar testes**

Run: `pnpm test src/modules/comments`
Expected: PASS.

## Task 51: Rate limit em /auth/*

**Files:**
- Modify: `apps/api/src/modules/auth/auth.routes.ts`

- [ ] **Step 1: Adicionar rate limit nas rotas auth**

Em `auth.routes.ts`, no início da função:

```ts
export async function authRoutes(app: FastifyInstance): Promise<void> {
  // rate limit específico mais agressivo
  await app.register(async (instance) => {
    instance.post(
      "/signup",
      {
        config: { rateLimit: { max: 10, timeWindow: "10 minutes" } },
        schema: { tags: ["auth"], body: signupSchema },
      },
      async (req, reply) => {
        const input = signupSchema.parse(req.body);
        const result = await authService.signup(input);
        return reply.status(201).send(result);
      },
    );

    instance.post(
      "/login",
      {
        config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
        schema: { tags: ["auth"], body: loginSchema },
      },
      async (req) => authService.login(loginSchema.parse(req.body)),
    );

    instance.post(
      "/refresh",
      { schema: { tags: ["auth"], body: refreshSchema } },
      async (req) => {
        const { refreshToken } = refreshSchema.parse(req.body);
        return authService.refresh(refreshToken);
      },
    );

    instance.post(
      "/logout",
      { schema: { tags: ["auth"], body: refreshSchema } },
      async (req, reply) => {
        const { refreshToken } = refreshSchema.parse(req.body);
        await authService.logout(refreshToken);
        return reply.status(204).send();
      },
    );
  });
}
```

- [ ] **Step 2: Rodar todos os testes auth**

Run: `pnpm test src/modules/auth`
Expected: PASS.

## Task 52: Smoke test end-to-end manual via curl

- [ ] **Step 1: Subir API**

```bash
cd apps/api
pnpm dev
```

- [ ] **Step 2: Signup**

```bash
curl -s -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@x.com","password":"Senha12345","name":"Smoke"}' | jq
```

Expected: JSON com `user`, `accessToken`, `refreshToken`. Anote o `accessToken` como `$TK`.

- [ ] **Step 3: Listar categorias**

```bash
curl -s -H "Authorization: Bearer $TK" http://localhost:3001/api/v1/categories | jq
```

Expected: array com 6 categorias seedadas.

- [ ] **Step 4: Criar task**

```bash
CATID=$(curl -s -H "Authorization: Bearer $TK" http://localhost:3001/api/v1/categories | jq -r '.[0].id')
curl -s -X POST http://localhost:3001/api/v1/tasks \
  -H "Authorization: Bearer $TK" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Smoke task\",\"priority\":\"HIGH\",\"categoryId\":\"$CATID\"}" | jq
```

Expected: task criada com `id`, `status: "TODO"`.

- [ ] **Step 5: Encerrar dev server**

Ctrl+C.

## Task 53: Verificação final do plano

- [ ] **Step 1: Rodar suite completa**

```bash
cd /mnt/armazenamento/home/tiozinho-gamer/domains/task-manager
pnpm test
```

Expected: TODOS verdes em `@taskboard/shared` e `@taskboard/api`.

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: PASS sem warnings.

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: PASS, gera `dist/` em api e shared.

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "feat(api): tasks, categories, comments CRUD with multi-user isolation"
```

- [ ] **Step 6: Atualizar README com status do Plan 1**

Edit (or create) `/mnt/armazenamento/home/tiozinho-gamer/domains/task-manager/README.md`:

```markdown
# TaskBoard

> Portfolio-grade Kanban task manager. Trabalho em progresso.

## Status

- [x] Plan 1 — Foundation + Backend completo (Fastify + Prisma + Postgres, auth JWT com refresh rotativo, CRUD multi-user, Swagger em `/docs`, 100% testes passando)
- [ ] Plan 2 — Frontend (React 19 + Tailwind + TanStack Query + dnd-kit)
- [ ] Plan 3 — Docker + E2E Playwright + CI GitHub Actions + README profissional

## Stack atual (backend)

Node 22, Fastify 5, Prisma 6, Postgres 16, Zod, JWT, Vitest, pnpm + Turborepo.

## Como rodar agora

```bash
pnpm install
docker compose up -d postgres
cd apps/api
cp .env.example .env
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

Swagger UI: <http://localhost:3001/docs>
```

```bash
git add README.md
git commit -m "docs: add README with Plan 1 status"
```

---

# Self-review (executado durante a escrita)

**Cobertura do spec (seções 1-16):**
- 1 Objetivo: tasks 1-53 endereçam a transformação.
- 2 Stack: aplicada em tasks 5, 23 (deps), 25 (Prisma), 30-44 (libs/plugins).
- 3 Arquitetura: tasks 38 (app.ts), 33-37 (plugins), 42-50 (camadas modules).
- 4 Estrutura de pastas: task 23 + tasks por módulo.
- 5 Modelo de dados: task 25.
- 6 API REST: tasks 37, 44, 45, 46, 49, 50, 51. **Plan 1 cobre tudo do backend.**
- 7 Frontend: **out of scope deste plano — Plan 2.**
- 8 Segurança: tasks 30 (bcrypt), 32 (JWT), 35 (auth plugin), 43 (refresh rotativo + reuse detection), 51 (rate limit), 33 (pino redact), 38 (helmet/cors).
- 9 Testes: tasks com sufixo `__tests__` (unit + integration), task 53 (suite completa). **E2E é Plan 3.**
- 10 DevX: tasks 8-14.
- 11 Docker: task 24 (postgres apenas). **API Dockerfile + compose final é Plan 3.**
- 12 CI: **Plan 3.**
- 13 Documentação: README inicial em task 53 step 6; ADRs e docs finais em Plan 3.
- 14 Roadmap: este plano implementa fases 0-5.
- 15-16 Riscos e out-of-scope: respeitados.

**Placeholders:** nenhum TBD/TODO no plano. Códigos completos.

**Consistência de tipos:** `tasksService.create` retorna o tipo do Prisma `task.create` com `include: { category: true }` — coerente entre repository, service e teste. `AppError` usado consistentemente. Schemas Zod do shared importados nas rotas.

**Ambiguidades:** nenhuma identificada.

---

## Execution Handoff

**Plano salvo em `docs/superpowers/plans/2026-05-18-taskboard-foundation-and-backend.md`.**

Duas opções de execução:

1. **Subagent-Driven (recomendado)** — dispara um subagente fresco por task, revisão entre tasks, iteração mais rápida e contexto preservado.
2. **Inline Execution** — executa tasks na sessão atual, batch com checkpoints pra você revisar.

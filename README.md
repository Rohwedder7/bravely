# Brev.ly (bravely)

Encurtador de links — backend (Fastify + Drizzle + PostgreSQL) e frontend (React + Vite). Compatível com banco PostgreSQL do Supabase.

---

## Para o avaliador (checklist rápido)

1. **Clone o repositório** e entre na pasta do projeto.
2. **Crie o arquivo `.env`** na raiz (copie de `.env.example`). Preencha `DATABASE_URL` com uma connection string PostgreSQL (ex.: Supabase — Connection pooler, modo Transaction, porta 6543).
3. **Instale dependências e rode as migrações:**
   ```bash
   pnpm install
   pnpm db:migrate
   ```
4. **Build e execução com Docker:**
   ```bash
   docker build -t brevly .
   docker run -p 3333:3333 --env-file .env brevly
   ```
5. **Acesse:** http://localhost:3333

**Alternativa sem Docker:** após o passo 3, use `pnpm build` e `pnpm start` (a API serve o frontend na mesma porta).

---

## Rodar localmente (sem Docker)

**Monorepo (pnpm):** raiz só orquestra; pacotes `server` e `web`.

```bash
pnpm install          # instala dependências de server e web
pnpm build            # build do frontend e do backend
pnpm dev:server       # sobe só a API (porta 3333)
pnpm dev:web          # sobe só o Vite (frontend)
pnpm start            # sobe a API após build (em produção serve também o SPA)
```

---

## Build e execução no Docker

A imagem Docker builda o frontend (Vite) e o backend (Fastify) e serve a aplicação completa em um único container: API na porta 3333 e SPA estático na mesma origem.

### Pré-requisitos

- Docker instalado (Docker Desktop no Mac/Windows ou Docker Engine no Linux)
- Arquivo `.env` na raiz do projeto com pelo menos `DATABASE_URL` (veja abaixo)

### 1. Configurar o `.env`

Crie ou edite o arquivo `.env` na **raiz do projeto** (mesma pasta do `Dockerfile`). Use **uma única linha** para cada variável, sem quebrar a URL.

**Supabase (recomendado):** use a connection string do **Connection pooler** (modo Transaction), não a conexão direta:

1. No [Supabase](https://supabase.com/dashboard): **Project Settings** → **Database**
2. Em **Connection string**, selecione **URI** e o modo **Transaction** (ou **Session**)
3. Copie a URL (host deve ser `*.pooler.supabase.com`, porta **6543** no Transaction)
4. Cole no `.env` em uma linha:

```env
DATABASE_URL=postgresql://postgres.SEU_PROJECT_REF:SUA_SENHA@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

> **Importante:** não use a conexão direta (`db.xxx.supabase.co:5432`) no Docker — ela costuma usar apenas IPv6 e gera erro `ENETUNREACH`. O pooler usa IPv4 e funciona dentro do container.

**Variáveis opcionais:** `PORT` (padrão 3333), `CLOUDFLARE_*` (para CSV em R2). Veja `.env.example`.

### 2. Rodar as migrações do banco (primeira vez)

Antes do primeiro uso, crie as tabelas no banco. Na **raiz do projeto**, com o `.env` já configurado:

```bash
pnpm install
pnpm db:migrate
```

(Se preferir só npm: `cd server && npm install && npm run db:migrate`.)

### 3. Build da imagem

Na pasta raiz do projeto:

```bash
docker build -t brevly .
```

O build compila o frontend (Vite) e o backend (TypeScript) e gera a imagem `brevly`.

### 4. Executar o container

```bash
docker run -p 3333:3333 --env-file .env brevly
```

- `-p 3333:3333` — expõe a porta 3333 do container no host
- `--env-file .env` — carrega as variáveis do `.env` (rode a partir da pasta do projeto para o caminho estar correto)

### 5. Acessar a aplicação

Abra no navegador: **http://localhost:3333**

A interface (SPA) e a API rodam na mesma origem; a listagem de links e as ações usam a API automaticamente.

### Acessar pelo celular (mesma rede Wi‑Fi)

Com o app rodando no computador (Docker ou `pnpm start` / `pnpm dev:server` + `pnpm dev:web`), você pode abrir no celular:

1. **Celular e computador na mesma rede Wi‑Fi.**
2. **Descubra o IP do seu computador na rede:**
   - **Mac:** Ajustes do Sistema → Rede → Wi‑Fi → Detalhes, ou no Terminal: `ipconfig getifaddr en0`
   - **Windows:** `ipconfig` e veja o “Endereço IPv4” do adaptador Wi‑Fi
   - Exemplo: `192.168.1.10`
3. **No celular,** abra o navegador e acesse:
   ```text
   http://IP_DO_SEU_COMPUTADOR:3333
   ```
   Exemplo: `http://192.168.1.10:3333`

O servidor já escuta em todas as interfaces (`0.0.0.0`), então aceita conexões da rede local. Se não abrir, verifique se o firewall do computador permite conexões na porta 3333.

### 6. Verificar os logs

Para ver se a conexão com o banco está OK:

```bash
docker logs <CONTAINER_ID_OU_NOME>
```

Exemplo de saída esperada:

```
Database host: aws-0-us-east-1.pooler.supabase.com
Database: conexão OK
Server is running on http://localhost:3333
```

Se aparecer `Database: falha na conexão`, confira o `.env` (URL do pooler, uma linha só) e se o container foi iniciado com `--env-file .env`.

### Comandos úteis

| Ação | Comando |
|------|--------|
| Listar containers em execução | `docker ps` |
| Parar o container | `docker stop <CONTAINER_ID>` |
| Ver logs em tempo real | `docker logs -f <CONTAINER_ID>` |
| Rodar em segundo plano | `docker run -d -p 3333:3333 --env-file .env --name brevly-app brevly` |

---

## Requisitos atendidos

**BACKEND**

- [x] Deve ser possível criar um link
  - [x] Não deve ser possível criar um link com URL encurtada mal formatada
  - [x] Não deve ser possível criar um link com URL encurtada já existente
- [x] Deve ser possível deletar um link
- [x] Deve ser possível obter a URL original por meio de uma URL encurtada
- [x] Deve ser possível listar todas as URL's cadastradas
- [x] Deve ser possível incrementar a quantidade de acessos de um link
- [x] Deve ser possível exportar os links criados em um CSV
  - [x] Deve ser possível acessar o CSV por meio de uma CDN (Amazon S3, Cloudflare R2, etc)
  - [x] Deve ser gerado um nome aleatório e único para o arquivo
  - [x] Deve ser possível realizar a listagem de forma performática
  - [x] O CSV deve ter campos como URL original, URL encurtada, contagem de acessos e data de criação

**FRONTEND**

- [x] Deve ser possível criar um link
  - [x] Não deve ser possível criar um link com encurtamento mal formatado
  - [x] Não deve ser possível criar um link com encurtamento já existente
- [x] Deve ser possível deletar um link
- [x] Deve ser possível obter a URL original por meio do encurtamento
- [x] Deve ser possível listar todas as URL's cadastradas
- [x] Deve ser possível incrementar a quantidade de acessos de um link
- [x] Deve ser possível baixar um CSV com o relatório dos links criados

Regras do front-end:

- [x] Aplicação React SPA com Vite
- [x] Layout alinhado ao Figma; boa UX (empty state, loading, estados de ação)
- [x] Responsivo (desktop e mobile)

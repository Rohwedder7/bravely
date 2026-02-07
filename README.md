# Brev.ly (bravely)

Encurtador de links — backend (Fastify + Drizzle + PostgreSQL) e frontend (React + Vite). Compatível com banco PostgreSQL do Supabase (IPv6).

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

# 🌱 Sementes — Ministério Infantil

Next.js 16 + Supabase (Auth, Postgres com RLS, Storage). Acesso somente por convite.

## Banco de dados (Supabase → SQL Editor, nesta ordem)
1. `supabase/01_schema.sql` — tabelas (clique em **Run and enable RLS**)
2. `supabase/02_auth_rls.sql` — login, perfis automáticos e permissões
3. `supabase/03_funcionalidades.sql` — contadores de estrelas, permissão por turma, fotos/arquivos (Storage)
4. Seu usuário: Authentication → Users → Add user (Auto Confirm) e depois
   `UPDATE public.users SET role='admin' WHERE email='seu@email.com';`

## Vercel (Settings → Environment Variables) — veja `.env.example`
Obrigatórias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
Lembretes: `CRON_SECRET` (e `RESEND_API_KEY` + `EMAIL_FROM` para e-mails). Depois de salvar, faça **Redeploy**.

## Supabase → Authentication → URL Configuration
Site URL = URL do Vercel; Redirect URLs = `https://SEU-SITE/**`.

## Permissões por turma
Para um professor registrar presença/atividades/fotos de uma turma, ele precisa ser membro de uma equipe com o **mesmo nome da turma** (Baby, 4 a 7, 8 a 11) — Administração → Equipes.

## Rodar local
```
npm install
npm run dev
```

# 🌱 Sementes — Ministério Infantil

Next.js 16 + Supabase (Auth + Postgres + RLS). Acesso somente por convite.

## Configurar (uma vez)
1. **Supabase → SQL Editor:** rode `supabase/01_schema.sql` e depois `supabase/02_auth_rls.sql`.
2. **Supabase → Authentication → Users:** crie seu usuário (Add user, com senha, "Auto Confirm").
3. Torne-se admin (SQL Editor): `UPDATE public.users SET role='admin' WHERE email='seu@email.com';`
4. **Supabase → Authentication → URL Configuration:** Site URL = URL do Vercel; adicione `https://SEU-SITE/auth/callback` em Redirect URLs.
5. **Variáveis de ambiente** (local `.env.local` e Vercel → Settings → Environment Variables), conforme `.env.example`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
   Depois de salvar no Vercel, faça **Redeploy**.

## Rodar
```
npm install
npm run dev
```

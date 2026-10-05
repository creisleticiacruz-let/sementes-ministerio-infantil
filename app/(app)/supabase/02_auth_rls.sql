-- ============================================================
-- SEMENTES — AUTENTICAÇÃO + SEGURANÇA (RLS)
-- Rode DEPOIS de 01_schema.sql, no SQL Editor do Supabase.
-- ============================================================

-- 1) users.id passa a ser o mesmo id do Supabase Auth
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_auth_fkey;
ALTER TABLE public.users
  ADD CONSTRAINT users_id_auth_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

-- 2) Cria o perfil automaticamente quando alguém é convidado/cadastrado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3) Cria perfil para quem JÁ existe no Auth (ex.: usuário que não conseguia logar)
INSERT INTO public.users (id, name, email)
SELECT a.id, COALESCE(NULLIF(a.raw_user_meta_data->>'name', ''), split_part(a.email, '@', 1)), a.email
FROM auth.users a
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = a.id)
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.email = a.email);

-- 4) Funções auxiliares
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT role FROM public.users WHERE id = auth.uid() AND is_active $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT COALESCE(public.my_role() = 'admin', false) $$;

CREATE OR REPLACE FUNCTION public.is_staff()      -- admin ou professor
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT COALESCE(public.my_role() IN ('admin','professor'), false) $$;

CREATE OR REPLACE FUNCTION public.is_team()       -- admin, professor ou voluntário (não responsável)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT COALESCE(public.my_role() IN ('admin','professor','voluntario'), false) $$;

CREATE OR REPLACE FUNCTION public.is_guardian_of(p_child UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM public.children_responsaveis
                  WHERE child_id = p_child AND user_id = auth.uid()) $$;

-- 5) Liga RLS em tudo e dá acesso total ao admin
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','user_notification_preferences','turmas','children','children_responsaveis',
    'teams','team_members','scales','scale_assignments','activities','activity_comments',
    'songs','presence_records','rewards','reward_redemptions','notifications','photos',
    'special_dates','calendar_events','snack_suggestions','offering_settings','user_sessions']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS admin_all ON public.%I', t);
    EXECUTE format('CREATE POLICY admin_all ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t);
  END LOOP;
END $$;

-- 6) Leitura geral (qualquer usuário logado)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['turmas','special_dates','calendar_events','rewards','offering_settings','snack_suggestions','songs']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS read_all ON public.%I', t);
    EXECUTE format('CREATE POLICY read_all ON public.%I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- 7) Leitura só da equipe (não responsáveis)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['teams','team_members','scales','scale_assignments','activities','activity_comments']
  LOOP
    IF true THEN
      EXECUTE format('DROP POLICY IF EXISTS read_team ON public.%I', t);
      EXECUTE format('CREATE POLICY read_team ON public.%I FOR SELECT TO authenticated USING (public.is_team())', t);
    END IF;
  END LOOP;
END $$;

-- 8) Políticas específicas
-- users
DROP POLICY IF EXISTS users_read ON public.users;
CREATE POLICY users_read ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_team());
DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = public.my_role());

-- preferências e notificações (próprias)
DROP POLICY IF EXISTS prefs_own ON public.user_notification_preferences;
CREATE POLICY prefs_own ON public.user_notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS notif_own_read ON public.notifications;
CREATE POLICY notif_own_read ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS notif_own_update ON public.notifications;
CREATE POLICY notif_own_update ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS sessions_own ON public.user_sessions;
CREATE POLICY sessions_own ON public.user_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- crianças
DROP POLICY IF EXISTS children_read ON public.children;
CREATE POLICY children_read ON public.children FOR SELECT TO authenticated
  USING (public.is_team() OR public.is_guardian_of(id));
DROP POLICY IF EXISTS cr_read ON public.children_responsaveis;
CREATE POLICY cr_read ON public.children_responsaveis FOR SELECT TO authenticated
  USING (public.is_team() OR user_id = auth.uid());

-- presença e estrelas
DROP POLICY IF EXISTS presence_read ON public.presence_records;
CREATE POLICY presence_read ON public.presence_records FOR SELECT TO authenticated
  USING (public.is_team() OR public.is_guardian_of(child_id));
DROP POLICY IF EXISTS presence_write ON public.presence_records;
CREATE POLICY presence_write ON public.presence_records FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS redemptions_read ON public.reward_redemptions;
CREATE POLICY redemptions_read ON public.reward_redemptions FOR SELECT TO authenticated
  USING (public.is_team() OR public.is_guardian_of(child_id));
DROP POLICY IF EXISTS redemptions_write ON public.reward_redemptions;
CREATE POLICY redemptions_write ON public.reward_redemptions FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

-- comentários e músicas (equipe escreve)
DROP POLICY IF EXISTS comments_insert ON public.activity_comments;
CREATE POLICY comments_insert ON public.activity_comments FOR INSERT TO authenticated
  WITH CHECK (public.is_team() AND user_id = auth.uid());
DROP POLICY IF EXISTS songs_insert ON public.songs;
CREATE POLICY songs_insert ON public.songs FOR INSERT TO authenticated
  WITH CHECK (public.is_team() AND added_by = auth.uid());
DROP POLICY IF EXISTS songs_update ON public.songs;
CREATE POLICY songs_update ON public.songs FOR UPDATE TO authenticated
  USING (public.is_team()) WITH CHECK (public.is_team());

-- fotos: equipe vê tudo; responsável vê as visíveis
DROP POLICY IF EXISTS photos_read ON public.photos;
CREATE POLICY photos_read ON public.photos FOR SELECT TO authenticated
  USING (public.is_team() OR is_visible);

-- ============================================================
-- PRIMEIRO ADMIN (troque pelo seu e-mail e rode):
-- UPDATE public.users SET role = 'admin' WHERE email = 'seu@email.com';
-- ============================================================

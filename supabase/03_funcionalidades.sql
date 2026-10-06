-- ============================================================
-- SEMENTES — FUNCIONALIDADES EXTRAS (rode DEPOIS do 02)
-- Contadores de estrelas, permissão por turma, fotos/arquivos (Storage)
-- ============================================================

-- 1) Foto do usuário e observações das músicas
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2) Estrelas de Bíblia e Versículo passam a ser contadores (0, 1, 2...)
ALTER TABLE public.presence_records ADD COLUMN IF NOT EXISTS bible_stars INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.presence_records ADD COLUMN IF NOT EXISTS verse_stars INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='presence_records' AND column_name='bible_star') THEN
    UPDATE public.presence_records
       SET bible_stars = CASE WHEN bible_star THEN 1 ELSE 0 END,
           verse_stars = CASE WHEN verse_star THEN 1 ELSE 0 END;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_presence_stars()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_stars :=
      CASE WHEN NEW.is_present THEN 1 ELSE 0 END
    + COALESCE(NEW.bible_stars, 0)
    + COALESCE(NEW.verse_stars, 0)
    + COALESCE(NEW.attitude_stars, 0)
    + COALESCE(NEW.extra_stars, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.presence_records DROP COLUMN IF EXISTS bible_star;
ALTER TABLE public.presence_records DROP COLUMN IF EXISTS verse_star;

-- recalcula totais já existentes
UPDATE public.presence_records SET updated_at = NOW();

-- 3) Um registro por criança por dia (permite "Salvar Aula" com upsert)
DELETE FROM public.presence_records a
 USING public.presence_records b
 WHERE a.child_id = b.child_id AND a.date = b.date
   AND (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id));
CREATE UNIQUE INDEX IF NOT EXISTS presence_child_date_uq ON public.presence_records (child_id, date);

-- 4) Permissão por turma: professor/voluntário só mexe nas turmas da sua equipe
--    (a equipe precisa ter o mesmo nome da turma: Baby, 4 a 7, 8 a 11)
CREATE OR REPLACE FUNCTION public.can_manage_turma(p_turma UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.is_admin(), false) OR (
    public.my_role() IN ('professor','voluntario') AND EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.teams t   ON t.id = tm.team_id
      JOIN public.turmas tu ON tu.name = t.name
      WHERE tm.user_id = auth.uid() AND tu.id = p_turma))
$$;

CREATE OR REPLACE FUNCTION public.can_manage_child(p_child UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.children c WHERE c.id = p_child AND public.can_manage_turma(c.turma_id))
$$;

DROP POLICY IF EXISTS presence_write ON public.presence_records;
CREATE POLICY presence_write ON public.presence_records FOR ALL TO authenticated
  USING (public.can_manage_child(child_id)) WITH CHECK (public.can_manage_child(child_id));

DROP POLICY IF EXISTS activities_write ON public.activities;
CREATE POLICY activities_write ON public.activities FOR ALL TO authenticated
  USING (public.can_manage_turma(turma_id)) WITH CHECK (public.can_manage_turma(turma_id));

-- responsáveis também veem o tema das aulas (Calendário)
DROP POLICY IF EXISTS activities_read_all ON public.activities;
CREATE POLICY activities_read_all ON public.activities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS photos_insert ON public.photos;
CREATE POLICY photos_insert ON public.photos FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND turma_id IS NOT NULL AND public.can_manage_turma(turma_id));

-- 5) Equipes e quem participa delas (todos os logados veem as próprias equipes)
DROP POLICY IF EXISTS team_members_self ON public.team_members;
CREATE POLICY team_members_self ON public.team_members FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 6) Armazenamento de fotos e arquivos (bucket "sementes")
INSERT INTO storage.buckets (id, name, public)
VALUES ('sementes', 'sementes', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS sementes_insert_team ON storage.objects;
CREATE POLICY sementes_insert_team ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sementes' AND public.is_team());
DROP POLICY IF EXISTS sementes_insert_avatar ON storage.objects;
CREATE POLICY sementes_insert_avatar ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sementes' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS sementes_delete_admin ON storage.objects;
CREATE POLICY sementes_delete_admin ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sementes' AND public.is_admin());

-- 7) Fotos: responsável só vê fotos visíveis das turmas dos seus filhos
CREATE OR REPLACE FUNCTION public.is_guardian_in_turma(p_turma UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.children_responsaveis cr
                 JOIN public.children c ON c.id = cr.child_id
                 WHERE cr.user_id = auth.uid() AND c.turma_id = p_turma)
$$;
DROP POLICY IF EXISTS photos_read ON public.photos;
CREATE POLICY photos_read ON public.photos FOR SELECT TO authenticated
  USING (public.is_team() OR (is_visible AND (turma_id IS NULL OR public.is_guardian_in_turma(turma_id))));

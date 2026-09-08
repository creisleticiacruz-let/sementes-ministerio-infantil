```sql
-- ============================================================
-- SEMENTES — MINISTÉRIO INFANTIL
-- Banco: PostgreSQL
-- ============================================================


-- ============================================================
-- 1. EXTENSÕES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 2. ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'admin',
    'professor',
    'responsavel',
    'voluntario'
);

CREATE TYPE team_role AS ENUM (
    'professor',
    'auxiliar',
    'servo',
    'monitor',
    'voz',
    'violao',
    'cajon',
    'percussao',
    'teclado',
    'responsavel_lanche',
    'voluntario'
);

CREATE TYPE notification_channel AS ENUM (
    'app',
    'email'
);

CREATE TYPE reward_status AS ENUM (
    'available',
    'redeemed',
    'inactive'
);


-- ============================================================
-- 3. USUÁRIOS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    email TEXT NOT NULL UNIQUE,

    role user_role NOT NULL DEFAULT 'voluntario',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 4. PREFERÊNCIAS DOS USUÁRIOS
-- ============================================================

CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    app_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    monday_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    friday_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    saturday_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notification_preferences_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 5. TURMAS
-- ============================================================

CREATE TABLE turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    description TEXT,

    age_range TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 6. CRIANÇAS
-- ============================================================

CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    birth_date DATE,

    photo_url TEXT,

    turma_id UUID NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_children_turma
        FOREIGN KEY (turma_id)
        REFERENCES turmas(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 7. RESPONSÁVEIS DAS CRIANÇAS
-- ============================================================

CREATE TABLE children_responsaveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    child_id UUID NOT NULL,

    user_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_child_responsavel_child
        FOREIGN KEY (child_id)
        REFERENCES children(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_child_responsavel_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_child_responsavel
        UNIQUE (child_id, user_id)
);


-- ============================================================
-- 8. EQUIPES
-- ============================================================

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. MEMBROS DAS EQUIPES
-- ============================================================

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    team_id UUID NOT NULL,

    user_id UUID NOT NULL,

    role team_role NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_team_member_team
        FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_team_member_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_team_member_role
        UNIQUE (team_id, user_id, role)
);


-- ============================================================
-- 10. ESCALAS
-- ============================================================

CREATE TABLE scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    date DATE NOT NULL,

    team_id UUID NOT NULL,

    description TEXT,

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_scale_team
        FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_scale_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 11. ATRIBUIÇÕES DA ESCALA
-- ============================================================

CREATE TABLE scale_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    scale_id UUID NOT NULL,

    user_id UUID NOT NULL,

    function TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_assignment_scale
        FOREIGN KEY (scale_id)
        REFERENCES scales(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_scale_user_function
        UNIQUE (scale_id, user_id, function)
);


-- ============================================================
-- 12. AULAS / ATIVIDADES
-- ============================================================

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    turma_id UUID NOT NULL,

    date DATE NOT NULL,

    title TEXT NOT NULL,

    description TEXT,

    material_link TEXT,

    bible_verse TEXT,

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_activity_turma
        FOREIGN KEY (turma_id)
        REFERENCES turmas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_activity_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 13. COMENTÁRIOS DAS AULAS
-- ============================================================

CREATE TABLE activity_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    activity_id UUID NOT NULL,

    user_id UUID NOT NULL,

    comment TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_activity_comment_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_activity_comment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 14. MÚSICAS / PLAYLIST
-- ============================================================

CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,

    artist TEXT,

    link TEXT NOT NULL,

    tone TEXT,

    added_by UUID,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_song_added_by
        FOREIGN KEY (added_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 15. PRESENÇA E ESTRELAS
-- ============================================================

CREATE TABLE presence_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    child_id UUID NOT NULL,

    activity_id UUID,

    date DATE NOT NULL,

    is_present BOOLEAN NOT NULL DEFAULT FALSE,

    bible_star BOOLEAN NOT NULL DEFAULT FALSE,

    verse_star BOOLEAN NOT NULL DEFAULT FALSE,

    attitude_stars INTEGER NOT NULL DEFAULT 0,

    extra_stars INTEGER NOT NULL DEFAULT 0,

    total_stars INTEGER NOT NULL DEFAULT 0,

    recorded_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_presence_child
        FOREIGN KEY (child_id)
        REFERENCES children(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_presence_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_presence_recorder
        FOREIGN KEY (recorded_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT unique_child_activity_presence
        UNIQUE (child_id, activity_id)
);


-- ============================================================
-- 16. RECOMPENSAS
-- ============================================================

CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    description TEXT,

    points_required INTEGER NOT NULL,

    image_url TEXT,

    status reward_status NOT NULL DEFAULT 'available',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT check_reward_points
        CHECK (points_required >= 0)
);


-- ============================================================
-- 17. RESGATE DE RECOMPENSAS
-- ============================================================

CREATE TABLE reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    child_id UUID NOT NULL,

    reward_id UUID NOT NULL,

    approved_by UUID,

    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    notes TEXT,

    CONSTRAINT fk_redemption_child
        FOREIGN KEY (child_id)
        REFERENCES children(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_redemption_reward
        FOREIGN KEY (reward_id)
        REFERENCES rewards(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_redemption_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 18. NOTIFICAÇÕES
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    message TEXT NOT NULL,

    link TEXT,

    channel notification_channel NOT NULL DEFAULT 'app',

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 19. FOTOS
-- ============================================================

CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT,

    description TEXT,

    photo_url TEXT NOT NULL,

    activity_id UUID,

    turma_id UUID,

    uploaded_by UUID,

    is_visible BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_photo_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_photo_turma
        FOREIGN KEY (turma_id)
        REFERENCES turmas(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_photo_uploader
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 20. DATAS ESPECIAIS
-- ============================================================

CREATE TABLE special_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    date DATE NOT NULL,

    title TEXT NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_special_date_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 21. CONFIGURAÇÃO DO CALENDÁRIO / TEMAS
-- ============================================================

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    date DATE NOT NULL,

    turma_id UUID,

    title TEXT NOT NULL,

    description TEXT,

    activity_id UUID,

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_calendar_turma
        FOREIGN KEY (turma_id)
        REFERENCES turmas(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_calendar_activity
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_calendar_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 22. SUGESTÕES DE LANCHE
-- ============================================================

CREATE TABLE snack_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_snack_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 23. CONFIGURAÇÃO DO PIX / OFERTAS
-- ============================================================

CREATE TABLE offering_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    church_name TEXT,

    pix_key TEXT NOT NULL,

    pix_qr_code_url TEXT,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    updated_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_offering_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 24. LOG DE ACESSOS / SESSÕES
-- ============================================================

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    device_name TEXT,

    user_agent TEXT,

    ip_address INET,

    remember_login BOOLEAN NOT NULL DEFAULT FALSE,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    last_activity_at TIMESTAMPTZ,

    CONSTRAINT fk_session_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 25. ÍNDICES
-- ============================================================

CREATE INDEX idx_users_email
    ON users(email);

CREATE INDEX idx_children_turma
    ON children(turma_id);

CREATE INDEX idx_children_birth_date
    ON children(birth_date);

CREATE INDEX idx_children_responsaveis_child
    ON children_responsaveis(child_id);

CREATE INDEX idx_children_responsaveis_user
    ON children_responsaveis(user_id);

CREATE INDEX idx_team_members_team
    ON team_members(team_id);

CREATE INDEX idx_team_members_user
    ON team_members(user_id);

CREATE INDEX idx_scales_date
    ON scales(date);

CREATE INDEX idx_scales_team
    ON scales(team_id);

CREATE INDEX idx_scale_assignments_scale
    ON scale_assignments(scale_id);

CREATE INDEX idx_scale_assignments_user
    ON scale_assignments(user_id);

CREATE INDEX idx_activities_date
    ON activities(date);

CREATE INDEX idx_activities_turma
    ON activities(turma_id);

CREATE INDEX idx_activity_comments_activity
    ON activity_comments(activity_id);

CREATE INDEX idx_songs_title
    ON songs(title);

CREATE INDEX idx_presence_child
    ON presence_records(child_id);

CREATE INDEX idx_presence_date
    ON presence_records(date);

CREATE INDEX idx_presence_activity
    ON presence_records(activity_id);

CREATE INDEX idx_notifications_user
    ON notifications(user_id);

CREATE INDEX idx_notifications_unread
    ON notifications(user_id, is_read);

CREATE INDEX idx_photos_activity
    ON photos(activity_id);

CREATE INDEX idx_photos_turma
    ON photos(turma_id);

CREATE INDEX idx_special_dates_date
    ON special_dates(date);

CREATE INDEX idx_calendar_events_date
    ON calendar_events(date);

CREATE INDEX idx_calendar_events_turma
    ON calendar_events(turma_id);

CREATE INDEX idx_sessions_user
    ON user_sessions(user_id);


-- ============================================================
-- 26. FUNÇÃO PARA CALCULAR TOTAL DE ESTRELAS
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_presence_stars()
RETURNS TRIGGER AS $$
BEGIN

    NEW.total_stars :=
        CASE
            WHEN NEW.is_present THEN 1
            ELSE 0
        END
        +
        CASE
            WHEN NEW.bible_star THEN 1
            ELSE 0
        END
        +
        CASE
            WHEN NEW.verse_star THEN 1
            ELSE 0
        END
        +
        COALESCE(NEW.attitude_stars, 0)
        +
        COALESCE(NEW.extra_stars, 0);

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_calculate_presence_stars
BEFORE INSERT OR UPDATE
ON presence_records
FOR EACH ROW
EXECUTE FUNCTION calculate_presence_stars();


-- ============================================================
-- 27. FUNÇÃO PARA updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 28. TRIGGERS DE updated_at
-- ============================================================

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_turmas_updated_at
BEFORE UPDATE ON turmas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_children_updated_at
BEFORE UPDATE ON children
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_scales_updated_at
BEFORE UPDATE ON scales
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_activity_comments_updated_at
BEFORE UPDATE ON activity_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_songs_updated_at
BEFORE UPDATE ON songs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_presence_updated_at
BEFORE UPDATE ON presence_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_rewards_updated_at
BEFORE UPDATE ON rewards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_special_dates_updated_at
BEFORE UPDATE ON special_dates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_calendar_events_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_snack_suggestions_updated_at
BEFORE UPDATE ON snack_suggestions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_offering_settings_updated_at
BEFORE UPDATE ON offering_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_notification_preferences_updated_at
BEFORE UPDATE ON user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 29. DADOS INICIAIS — TURMAS
-- ============================================================

INSERT INTO turmas (name, description, age_range)
VALUES
    ('Baby', 'Turma Baby do Ministério Infantil', 'Baby'),
    ('4 a 7', 'Crianças de 4 a 7 anos', '4-7 anos'),
    ('8 a 11', 'Crianças de 8 a 11 anos', '8-11 anos');


-- ============================================================
-- 30. DADOS INICIAIS — EQUIPES
-- ============================================================

INSERT INTO teams (name, description)
VALUES
    ('Lanche', 'Equipe responsável pelo lanche'),
    ('4 a 7', 'Equipe de professores da turma de 4 a 7 anos'),
    ('8 a 11', 'Equipe de professores da turma de 8 a 11 anos'),
    ('Baby', 'Equipe de professores e auxiliares da turma Baby'),
    ('Direção', 'Equipe de direção do Ministério Infantil'),
    ('Louvor', 'Equipe de louvor infantil');


-- ============================================================
-- 31. DADOS INICIAIS — SUGESTÕES DE LANCHE
-- ============================================================

INSERT INTO snack_suggestions (name)
VALUES
    ('Bisnaguinha com presunto e queijo'),
    ('Bolo'),
    ('Macarrão'),
    ('Bolachas'),
    ('Pão de forma com presunto e queijo'),
    ('Salgadinhos'),
    ('Tortas'),
    ('Outros');
```


USERS
 │
 ├── TEAM_MEMBERS ──────── TEAMS
 │                          │
 │                          └── SCALES
 │                               │
 │                               └── SCALE_ASSIGNMENTS ─── USERS
 │
 ├── CHILDREN_RESPONSAVEIS ─── CHILDREN
 │                                  │
 │                                  ├── TURMAS
 │                                  │
 │                                  └── PRESENCE_RECORDS
 │                                         │
 │                                         └── ACTIVITIES
 │
 ├── NOTIFICATIONS
 │
 ├── ACTIVITY_COMMENTS ─── ACTIVITIES
 │
 └── PHOTOS


TURMAS
 │
 ├── CHILDREN
 │
 ├── ACTIVITIES
 │
 └── CALENDAR_EVENTS


ACTIVITIES
 │
 ├── ACTIVITY_COMMENTS
 │
 ├── PRESENCE_RECORDS
 │
 └── PHOTOS


CHILDREN
 │
 ├── PRESENCE_RECORDS
 │
 ├── REWARD_REDEMPTIONS
 │
 └── CHILDREN_RESPONSAVEIS


REWARDS
 │
 └── REWARD_REDEMPTIONS


SELECT
    c.id,
    c.name,
    c.photo_url,
    t.name AS turma,
    SUM(pr.total_stars) AS total_stars
FROM children c
JOIN turmas t
    ON t.id = c.turma_id
JOIN presence_records pr
    ON pr.child_id = c.id
WHERE pr.date >= '2026-09-01'
  AND pr.date < '2026-10-01'
GROUP BY
    c.id,
    c.name,
    c.photo_url,
    t.name
ORDER BY total_stars DESC;
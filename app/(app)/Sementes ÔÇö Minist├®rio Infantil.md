# Sementes — Ministério Infantil

## Objetivo

Plataforma web para centralizar a organização do Ministério Infantil Sementes, incluindo escalas, equipes, atividades, presença, pontuação, fotos, calendário e comunicação com voluntários e responsáveis.

## Telas

### Autenticação

**Rota:** `/`

**Objetivo:** Autenticar usuário ou criar conta (apenas convite).

**Componentes:**

- **Input Email**
- **Input Senha**
- **Botão Entrar**: Autentica o usuário e redireciona para o dashboard
- **Link Esqueci Senha**: Redireciona para a tela de recuperação de senha
- **Checkbox Salvar Login**: Salva o token de login no dispositivo

### Painel Inicial

**Rota:** `/dashboard`

**Objetivo:** Exibir informações personalizadas do usuário, como próxima escala, notificações e links rápidos.

**Componentes:**

- **Saudação Personalizada**
- **Próxima Escala**: Navega para a tela de escala
- **Notificações**: Navega para a tela de notificações
- **Calendário Resumido**: Navega para o calendário completo
- **Acesso Rápido às Funcionalidades**: Abre cada funcionalidade correspondente

### Minha Escala

**Rota:** `/minha-escala`

**Objetivo:** Exibir as escalas futuras e passadas do usuário, com detalhes de equipe e função.

**Componentes:**

- **Próxima Escala**: Mostra detalhes da escala
- **Próximas Escalas**: Navega para o calendário completo
- **Calendário Completo**: Exibe calendário com todas as escalas

### Equipes

**Rota:** `/equipes`

**Objetivo:** Listar as equipes do ministério e permitir visualizar escalas e membros.

**Componentes:**

- **Lista de Equipes**: Seleciona equipe e exibe detalhes
- **Escala da Equipe**: Navega para a escala detalhada
- **Membros da Equipe**: Exibe membros da equipe

### Atividades

**Rota:** `/atividades`

**Objetivo:** Disponibilizar materiais, links e observações das aulas para cada turma.

**Componentes:**

- **Turma**: Seleciona turma
- **Lista de Atividades**
- **Link para Material**: Abre material em nova aba
- **Comentários da Aula**: Adiciona comentário à aula

### Playlist

**Rota:** `/playlist`

**Objetivo:** Gerenciar as músicas do louvor infantil, com links e tons.

**Componentes:**

- **Lista de Músicas**
- **Botão Adicionar Música**: Abre formulário para adicionar música
- **Link da Música**: Abre link da música em nova aba
- **Tom da Música**: Permite alterar tom

### Crianças

**Rota:** `/criancas`

**Objetivo:** Gerenciar presença, estrelas, ranking e recompensas das crianças.

**Componentes:**

- **Turma**: Seleciona turma
- **Lista de Crianças**
- **Presença (estrelas)**: Marca presença e atribui estrelas
- **Bíblia, Versículo, Boas Atitudes**: Atribui estrelas extras
- **Ranking Mensal**: Abre ranking mensal
- **Recompensas**: Abre recompensas

### Calendário Sementes

**Rota:** `/calendario`

**Objetivo:** Mostrar o calendário mensal com datas especiais e temas das aulas.

**Componentes:**

- **Mês Atual**
- **Domingos com Tema**: Navega para detalhes da aula
- **Datas Especiais**: Exibe informações de data especial

### Aniversários do Mês

**Rota:** `/aniversarios`

**Objetivo:** Exibir os aniversariantes do mês com foto e data.

**Componentes:**

- **Lista de Aniversariantes**
- **Foto da Criança**
- **Nome e Data**

### Espaço dos Responsáveis

**Rota:** `/espaco-responsaveis`

**Objetivo:** Área exclusiva para responsáveis acompanharem seus filhos.

**Componentes:**

- **Minha Semente**: Navega para detalhes da criança
- **Fotos**: Abre galeria de fotos
- **Playlist**: Abre playlist dos filhos
- **Quero Ofertar**: Abre área de ofertas com PIX

### Configurações

**Rota:** `/configuracoes`

**Objetivo:** Permitir que o usuário edite seu perfil e preferências.

**Componentes:**

- **Meu Perfil**: Edita nome e email
- **Notificações**: Ativa/desativa notificações
- **Sair**: Encerra sessão

### Painel Administrativo

**Rota:** `/admin`

**Objetivo:** Gerenciar todos os dados do sistema: usuários, crianças, escalas, equipes, conteúdos.

**Componentes:**

- **Gerenciar Usuários**: Abre formulário de cadastro/edição de usuário
- **Gerenciar Crianças**: Abre formulário de cadastro/edição de criança
- **Gerenciar Escalas**: Abre editor de escalas
- **Gerenciar Equipes**: Abre gerenciamento de equipes
- **Gerenciar Conteúdos**: Abre gerenciamento de atividades, músicas, etc.
- **Gerenciar Recompensas**: Abre gerenciamento de recompensas

## Personas

### Leticia

liderança

## Banco de Dados

### users

Usuários da plataforma (voluntários, lideranças, responsáveis).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| name | text | - |
| email | text | - |
| role | text | - |

### turmas

Turmas de crianças do ministério (agrupamentos por faixa etária).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| name | text | - |
| description | text | - |
| age_range | text | - |

### children

Crianças cadastradas no ministério.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| name | text | - |
| birth_date | text | - |
| photo_url | text | - |
| turma_id | fk | - |

### children_responsaveis

Associação entre crianças e seus responsáveis (usuários).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| child_id | fk | - |
| user_id | fk | - |

### teams

Equipes de voluntários do ministério.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| name | text | - |
| description | text | - |

### team_members

Membros de cada equipe, com função específica.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| team_id | fk | - |
| user_id | fk | - |
| role | text | - |

### scales

Escalas de serviço (datas em que equipes atuam).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| date | text | - |
| team_id | fk | - |
| description | text | - |

### scale_assignments

Atribuição de voluntários a uma escala com função.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| scale_id | fk | - |
| user_id | fk | - |
| function | text | - |

### activities

Atividades/aulas de cada turma, com materiais e observações.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| turma_id | fk | - |
| date | text | - |
| title | text | - |
| description | text | - |
| material_link | text | - |
| bible_verse | text | - |

### activity_comments

Comentários feitos por usuários em atividades.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| activity_id | fk | - |
| user_id | fk | - |
| comment | text | - |

### songs

Músicas do louvor infantil, com links e tom.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| title | text | - |
| artist | text | - |
| link | text | - |
| tone | text | - |
| added_by | fk | - |

### presence_records

Registro de presença e estrelas (Bíblia, versículo, boas atitudes) de cada criança por data.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| child_id | fk | - |
| date | text | - |
| is_present | boolean | - |
| bible_star | boolean | - |
| verse_star | boolean | - |
| attitude_star | boolean | - |
| total_stars | number | - |

### rewards

Recompensas disponíveis para troca por estrelas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| name | text | - |
| description | text | - |
| points_required | number | - |
| image_url | text | - |

### reward_redemptions

Histórico de resgates de recompensas por crianças.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| child_id | fk | - |
| reward_id | fk | - |
| approved_by | fk | - |

### notifications

Notificações enviadas aos usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | - |
| user_id | fk | - |
| message | text | - |
| link | text | - |
| is_read | boolean | - |


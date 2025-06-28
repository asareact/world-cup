# 🗄️ Esquema de Base de Datos - FutsalPro

## 📋 Tablas del Sistema

### 1. **profiles** - Perfiles de Usuario
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);
```

### 2. **tournaments** - Torneos
```sql
CREATE TABLE tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('draft', 'active', 'completed', 'paused')) DEFAULT 'draft',
  format TEXT CHECK (format IN ('single_elimination', 'double_elimination', 'round_robin', 'groups')) NOT NULL,
  max_teams INTEGER NOT NULL DEFAULT 16,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  rules TEXT,
  prize_description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. **teams** - Equipos
```sql
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  captain_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. **players** - Jugadores (máximo 12 por equipo)
```sql
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
  birth_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, jersey_number)
);
```

### 5. **tournament_teams** - Equipos en Torneos
```sql
CREATE TABLE tournament_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('registered', 'confirmed', 'withdrawn')) DEFAULT 'registered',
  group_name TEXT, -- Para torneos por grupos
  UNIQUE(tournament_id, team_id)
);
```

### 6. **matches** - Partidos
```sql
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  scheduled_at TIMESTAMPTZ,
  venue TEXT,
  round_name TEXT, -- "Cuartos de Final", "Semifinal", etc.
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  winner_team_id UUID REFERENCES teams(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. **match_events** - Eventos del Partido
```sql
CREATE TABLE match_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  team_id UUID REFERENCES teams(id),
  event_type TEXT CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution')) NOT NULL,
  minute INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. **player_stats** - Estadísticas de Jugadores
```sql
CREATE TABLE player_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  UNIQUE(player_id, tournament_id)
);
```

## 🔐 Políticas de Seguridad (RLS)

### Row Level Security habilitado en todas las tablas
```sql
-- Los usuarios pueden ver torneos públicos y los suyos propios
-- Los usuarios pueden crear y gestionar sus propios torneos
-- Los usuarios pueden ver equipos de torneos en los que participan
-- Solo el creador del equipo puede modificarlo
```

## 📊 Características Especiales

### ✅ **Equipos de Futsal (máximo 12 jugadores)**
- Constraint en tabla players para máximo 12 por equipo
- Posiciones específicas de futsal
- Números de camiseta únicos por equipo

### ✅ **Formatos de Torneo**
- Eliminación simple/doble
- Todos contra todos (round-robin)
- Fase de grupos + eliminatorias

### ✅ **Estadísticas en Tiempo Real**
- Goles, asistencias, tarjetas
- Minutos jugados
- Actualizaciones automáticas

### ✅ **Gestión Completa**
- Estados del torneo (borrador → activo → finalizado)
- Programación de partidos
- Resultados y clasificaciones

---

**¡Listo para crear en Supabase!** 🚀
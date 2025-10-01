# 🚨 Sistema de Detección de Posibles Sanciones

## Descripción

Este sistema permite detectar y mostrar jugadores que podrían estar en riesgo de recibir sanciones en partidos próximos, basándose en su historial de tarjetas amarillas y rojas según las reglas establecidas del torneo.

## Características

### ✅ Optimización de Rendimiento
- Solo analiza partidos del día actual por defecto
- Sistema de caché de 5 minutos para evitar consultas repetidas
- Análisis por partido individual para minimizar carga

### 🎯 Tipos de Riesgo Detectados
1. **Amarillas Consecutivas**: Jugadores que recibieron amarilla en el último partido
2. **Acumulación de Amarillas**: Jugadores con 2 o más amarillas acumuladas
3. **Historial de Rojas**: Jugadores con historial de tarjetas rojas

### 📊 Niveles de Riesgo
- **Alto**: ⚠️ Riesgo significativo de sanción
- **Medio**: ⚠️ Posible sanción
- **Bajo**: ℹ️ Historial previo de sanciones

## Implementación Técnica

### Servicio Principal
```typescript
// src/lib/suspensions/potential-suspensions-service.ts
class PotentialSuspensionsService {
  async detectPotentialSuspensions(
    tournamentId: string,
    options?: {
      matchId?: string;     // Partido específico
      date?: Date;          // Fecha específica (por defecto hoy)
      allUpcoming?: boolean; // Todos los próximos partidos
    }
  ): Promise<PotentialSuspension[]>
}
```

### Hook de React
```typescript
// src/lib/hooks/use-potential-suspensions.ts
function usePotentialSuspensions(
  tournamentId: string,
  options?: UsePotentialSuspensionsOptions
)
```

### Componente de UI
```tsx
// src/components/tournaments/potential-suspension-warning.tsx
<MatchPotentialSuspensions 
  tournamentId={tournamentId} 
  matchId={matchId} 
/>
```

### API Endpoint
```
GET /api/tournaments/[id]/potential-suspensions
Query Parameters:
- matchId: string (opcional)
- date: string (opcional, formato ISO)
- allUpcoming: boolean (opcional)
```

## Uso en la Aplicación

### En Tarjetas de Partido (Calendario)
```tsx
// Solo se muestra para partidos programados individuales
{match.status === 'scheduled' && tournamentId && match.id && (
  <MatchPotentialSuspensions 
    tournamentId={tournamentId} 
    matchId={match.id} 
  />
)}
```

### En Panel de Administración
```tsx
// Muestra análisis completo para todos los partidos próximos
<AdminSuspensionsDashboard tournamentId={tournamentId} />
```

## Beneficios de Optimización

### 🚀 Rendimiento Mejorado
- **Reducción de solicitudes**: De ~50 peticiones a solo las necesarias por partido
- **Caché inteligente**: Resultados almacenados por 5 minutos
- **Filtrado por fecha**: Solo se analizan partidos del día actual

### 💰 Recursos Ahorrados
- Menos carga en la base de datos
- Menor consumo de ancho de banda
- Mejor experiencia de usuario

### 🛡️ Fiabilidad
- Manejo adecuado de errores
- Fallbacks para casos extremos
- Validación de permisos

## Reglas de Negocio Implementadas

1. **Doble Amarilla en el Mismo Partido** - 1 partido de sanción
2. **Dos Amarillas en Partidos Consecutivos Distintos** - 1 partido de sanción  
3. **Roja Directa** - 2 partidos de sanción
4. **Acumulación de Dos Amarillas que Resulta en Roja** - 2 partidos de sanción

## Personalización

Para modificar el comportamiento predeterminado:

```typescript
// Cambiar ventana de tiempo de análisis
const CUSTOM_WINDOW_HOURS = 24; // Horas

// Cambiar duración del caché
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos
```

## Solución de Problemas

### Errores Comunes

1. **"Too many requests"**: Verificar límites de API de Supabase
2. **Datos incompletos**: Asegurar que los eventos de partido estén registrados
3. **Sin resultados**: Verificar que haya partidos programados en la fecha

### Mejores Prácticas

- ✅ Usar análisis por partido individual en el calendario
- ✅ Usar análisis completo solo en paneles de administración
- ✅ Limpiar caché cuando se actualizan eventos de partido
- ✅ Manejar errores de red con reintentos apropiados

## Integración con Otros Sistemas

### Sistema de Sanciones Existentes
- Compatible con `player_suspensions` table
- Reutiliza lógica de `SuspensionLogicService`
- Mantiene consistencia con reglas existentes

### Sistema de Eventos de Partido
- Integra con `match_events` table
- Usa mismos campos de tarjetas amarillas/rojas
- Mantiene histórico de eventos

## Futuras Mejoras

### Propuestas
1. **Notificaciones push** para árbitros/admins
2. **Integración con emails** automáticos
3. **Exportación de reportes** en PDF/Excel
4. **Predicción avanzada** con machine learning

### Extensiones
- Alertas en tiempo real
- Integración con sistemas de mensajería
- Dashboards personalizados por equipo/liga
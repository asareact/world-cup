# ⚠️ Servicio de Detección de Posibles Sanciones

## Descripción

Este servicio permite detectar y mostrar jugadores que podrían estar en riesgo de recibir sanciones en partidos próximos, basándose en su historial de tarjetas amarillas y rojas según las reglas establecidas del torneo.

## Funcionalidades

### Detección de Riesgos

El sistema analiza automáticamente el historial de tarjetas de cada jugador para identificar posibles sanciones:

1. **Amarillas Consecutivas**: Jugadores que recibieron amarilla en el último partido
2. **Acumulación de Amarillas**: Jugadores con 2 o más amarillas acumuladas
3. **Historial de Rojas**: Jugadores con historial de tarjetas rojas

### Niveles de Riesgo

- **Alto**: ⚠️ Riesgo significativo de sanción
- **Medio**: ⚠️ Posible sanción
- **Bajo**: ℹ️ Historial previo de sanciones

## Reglas de Sanción Implementadas

1. **Doble Amarilla en el Mismo Partido** - 1 partido de sanción
2. **Dos Amarillas en Partidos Consecutivos Distintos** - 1 partido de sanción  
3. **Roja Directa** - 2 partidos de sanción
4. **Acumulación de Dos Amarillas que Resulta en Roja** - 2 partidos de sanción

## Integración

### Componentes

- `MatchPotentialSuspensions`: Muestra advertencias en tarjetas de partido
- `PlayerSuspensionWarning`: Indicador de riesgo para jugadores individuales

### API Endpoint

```
GET /api/tournaments/[id]/matches/[matchId]/potential-suspensions
```

Devuelve una lista de posibles sanciones para un partido específico.

## Uso

La funcionalidad se muestra automáticamente en la vista de calendario para partidos programados, mostrando advertencias visuales junto a los partidos donde haya jugadores en riesgo.

## Beneficios

- ✅ **Prevención Proactiva**: Alerta a árbitros y administradores sobre posibles sanciones
- ✅ **Transparencia**: Información clara para todos los involucrados
- ✅ **Cumplimiento Normativo**: Respeta las reglas oficiales del torneo
- ✅ **Actualización Automática**: Se actualiza en tiempo real con nuevos eventos

## Tecnología

- Servicio de detección implementado en TypeScript
- Integración con Supabase para acceso a datos
- Componentes React para visualización
- API RESTful para acceso programático
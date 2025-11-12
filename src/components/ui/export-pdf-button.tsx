'use client';

import { Download, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import { useState } from 'react';

interface ExportPDFButtonProps {
  targetElementId: string; // este será el tournamentId en lugar del ID del elemento
  fileName?: string;
  title?: string;
  className?: string;
  section?: 'calendar' | 'matches' | 'stats' | 'results' | 'standings'; // tipo de sección a exportar
  initialData?: any; // Datos directamente pasados al componente para evitar llamadas API
}

export function ExportPDFButton({ 
  targetElementId, 
  fileName = 'documento', 
  title = 'Exportar a PDF',
  className = '',
  section = 'calendar',
  initialData
}: ExportPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const exportToPDF = async () => {
    setIsLoading(true);
    
    try {
      // Usar los datos iniciales si están disponibles, de lo contrario intentar la API
      let data;
      let pdfTitle = '';
      let tournamentId = targetElementId;
      
      // Si se proporcionan datos iniciales, usarlos directamente
      if (initialData) {
        console.log('Usando datos iniciales:', initialData);
        data = initialData;
        switch(section) {
          case 'calendar':
          case 'results':
            pdfTitle = 'Calendario de Partidos';
            break;
          case 'stats':
            pdfTitle = 'Estadísticas del Torneo';
            break;
          case 'standings':
            pdfTitle = 'Tabla de Posiciones';
            break;
          default:
            pdfTitle = 'Datos del Torneo';
        }
      } else {
        // Determinar si el targetElementId es un tournamentId o un ID de elemento DOM
        // Si empieza con 'tournament-calendar-', 'tournament-results-', etc., extraer el ID
        if (targetElementId.startsWith('tournament-calendar-') || 
            targetElementId.startsWith('tournament-results-') || 
            targetElementId.startsWith('tournament-stats-') ||
            targetElementId.startsWith('tournament-top-scorers-')) {
          // Extraer el ID del torneo del prefijo
          // Buscar el último guión y obtener lo que sigue
          const lastDashIndex = targetElementId.lastIndexOf('-');
          if (lastDashIndex !== -1) {
            tournamentId = targetElementId.substring(lastDashIndex + 1);
          }
        }
        console.log('TargetElementId:', targetElementId, 'TournamentId:', tournamentId); // Línea de depuración
        
        // Obtener los datos directamente desde la API
        switch(section) {
          case 'calendar':
            try {
              console.log('Intentando obtener datos del torneo:', tournamentId);
              const response = await fetch(`/api/tournaments/${tournamentId}/matches`);
              console.log('Respuesta de la API:', response.status);
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Error de API:', response.status, errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
              }
              data = await response.json();
              console.log('Datos recibidos:', data.length, 'partidos');
              pdfTitle = 'Calendario de Partidos';
            } catch (error) {
              console.error('Error al obtener el calendario:', error);
              alert('No se pudieron obtener los datos del calendario. Detalles: ' + (error as Error).message);
              return;
            }
            break;
          case 'results':
            try {
              const response = await fetch(`/api/tournaments/${tournamentId}/matches`);
              if (!response.ok) throw new Error('Error al obtener los resultados');
              data = await response.json();
              pdfTitle = 'Resultados de Partidos';
            } catch (error) {
              console.error('Error al obtener los resultados:', error);
              alert('No se pudieron obtener los resultados. Detalles: ' + (error as Error).message);
              return;
            }
            break;
          case 'standings':
            try {
              // Obtener partidos y equipos para calcular la tabla de posiciones
              const [matchesResponse, teamsResponse] = await Promise.all([
                fetch(`/api/tournaments/${tournamentId}/matches`),
                fetch(`/api/tournaments/${tournamentId}/teams`)
              ]);
              
              if (!matchesResponse.ok) throw new Error('Error al obtener los partidos para la tabla de posiciones');
              if (!teamsResponse.ok) throw new Error('Error al obtener los equipos para la tabla de posiciones');
              
              const matches = await matchesResponse.json();
              const teams = await teamsResponse.json();
              
              // Calcular la tabla de posiciones (similar a la función calculateStandings en tournament-standings.tsx)
              const standingsMap: Record<string, any> = {};
              
              // Inicializar tabla para todos los equipos
              teams.forEach((team: any) => {
                if (!team?.id) return;
                
                standingsMap[team.id] = {
                  position: 0, // Se calculará más adelante
                  team,
                  played: 0,
                  wins: 0,
                  draws: 0,
                  losses: 0,
                  points: 0,
                  goalsFor: 0,
                  goalsAgainst: 0,
                  goalDifference: 0
                };
              });

              // Procesar partidos completados para actualizar estadísticas
              matches
                .filter((match: any) => match?.status === 'completed' && match?.home_score !== null && match?.away_score !== null)
                .forEach((match: any) => {
                  if (!match?.home_team || !match?.away_team) return;

                  const homeTeamId = match.home_team.id;
                  const awayTeamId = match.away_team.id;

                  // Asegurar que ambos equipos existan en la tabla
                  if (!standingsMap[homeTeamId]) {
                    const fullHomeTeam = teams.find((t: any) => t.id === match.home_team?.id);
                    standingsMap[homeTeamId] = {
                      position: 0,
                      team: fullHomeTeam || {
                        id: match.home_team?.id || '',
                        name: match.home_team?.name || 'Equipo desconocido',
                        logo_url: match.home_team?.logo_url || null,
                        description: null,
                        captain_id: null,
                        created_by: '',
                        contact_email: null,
                        contact_phone: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                      played: 0,
                      wins: 0,
                      draws: 0,
                      losses: 0,
                      points: 0,
                      goalsFor: 0,
                      goalsAgainst: 0,
                      goalDifference: 0
                    };
                  }

                  if (!standingsMap[awayTeamId]) {
                    const fullAwayTeam = teams.find((t: any) => t.id === match.away_team?.id);
                    standingsMap[awayTeamId] = {
                      position: 0,
                      team: fullAwayTeam || {
                        id: match.away_team?.id || '',
                        name: match.away_team?.name || 'Equipo desconocido',
                        logo_url: match.away_team?.logo_url || null,
                        description: null,
                        captain_id: null,
                        created_by: '',
                        contact_email: null,
                        contact_phone: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                      played: 0,
                      wins: 0,
                      draws: 0,
                      losses: 0,
                      points: 0,
                      goalsFor: 0,
                      goalsAgainst: 0,
                      goalDifference: 0
                    };
                  }

                  // Actualizar contadores de partidos
                  standingsMap[homeTeamId].played += 1;
                  standingsMap[awayTeamId].played += 1;

                  // Actualizar goles
                  const homeGoals = match.home_score || 0;
                  const awayGoals = match.away_score || 0;

                  standingsMap[homeTeamId].goalsFor += homeGoals;
                  standingsMap[homeTeamId].goalsAgainst += awayGoals;
                  standingsMap[homeTeamId].goalDifference = standingsMap[homeTeamId].goalsFor - standingsMap[homeTeamId].goalsAgainst;

                  standingsMap[awayTeamId].goalsFor += awayGoals;
                  standingsMap[awayTeamId].goalsAgainst += homeGoals;
                  standingsMap[awayTeamId].goalDifference = standingsMap[awayTeamId].goalsFor - standingsMap[awayTeamId].goalsAgainst;

                  // Actualizar puntos y resultados
                  if (homeGoals > awayGoals) {
                    standingsMap[homeTeamId].points += 3; // Victoria local
                    standingsMap[homeTeamId].wins += 1;
                    standingsMap[awayTeamId].losses += 1;
                  } else if (homeGoals < awayGoals) {
                    standingsMap[awayTeamId].points += 3; // Victoria visitante
                    standingsMap[awayTeamId].wins += 1;
                    standingsMap[homeTeamId].losses += 1;
                  } else {
                    standingsMap[homeTeamId].points += 1; // Empate
                    standingsMap[awayTeamId].points += 1; // Empate
                    standingsMap[homeTeamId].draws += 1;
                    standingsMap[awayTeamId].draws += 1;
                  }
                });

              // Convertir a array y ordenar por puntos, diferencia de goles y goles a favor
              const standingsArray = Object.values(standingsMap).filter((entry: any) => entry !== undefined);

              standingsArray.sort((a: any, b: any) => {
                if (b.points !== a.points) return b.points - a.points; // Más puntos primero
                if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference; // Diferencia mayor primero
                return b.goalsFor - a.goalsFor; // Más goles a favor primero
              });

              // Asignar posiciones
              standingsArray.forEach((entry: any, index: number) => {
                entry.position = index + 1;
              });

              data = standingsArray;
              pdfTitle = 'Tabla de Posiciones';
            } catch (error) {
              console.error('Error al obtener la tabla de posiciones:', error);
              alert('No se pudo obtener la tabla de posiciones. Detalles: ' + (error as Error).message);
              return;
            }
            break;
          case 'stats':
            try {
              // Intenta múltiples endpoints para estadísticas ya que pueden variar
              let statsResponse = await fetch(`/api/tournaments/${tournamentId}/stats`);
              if (!statsResponse.ok) {
                // Probamos con otro endpoint común para estadísticas
                statsResponse = await fetch(`/api/tournaments/${tournamentId}/stats-overview`);
              }
              if (!statsResponse.ok) throw new Error('Error al obtener las estadísticas');
              data = await statsResponse.json();
              pdfTitle = 'Estadísticas del Torneo';
            } catch (error) {
              console.error('Error al obtener las estadísticas:', error);
              alert('No se pudieron obtener las estadísticas. Detalles: ' + (error as Error).message);
              return;
            }
            break;
          default:
            // Por defecto, intentar obtener los partidos
            try {
              const response = await fetch(`/api/tournaments/${tournamentId}/matches`);
              if (!response.ok) throw new Error('Error al obtener los datos del calendario');
              data = await response.json();
              pdfTitle = 'Calendario de Partidos';
              section = 'calendar';
            } catch (error) {
              console.error('Error al obtener datos:', error);
              alert('No se pudieron obtener los datos. Detalles: ' + (error as Error).message);
              return;
            }
        }
      }

      // Crear PDF con los datos estructurados
      const pdf = createPDFFromData(data, pdfTitle, fileName);
      
      // Guardar el PDF
      pdf.save(`${fileName}.pdf`);
      
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Ocurrió un error al generar el PDF. Por favor, inténtalo de nuevo. Detalles: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para crear PDF desde datos estructurados
  const createPDFFromData = (data: any, title: string, fileName: string) => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Añadir título
    pdf.setFontSize(18);
    pdf.setTextColor(31, 41, 55);
    pdf.text(title, 148, 20, { align: 'center' });

    let yPosition = 35;

    // Procesar los datos según el tipo de sección
    if (section === 'calendar' || section === 'results') {
      // Agrupar partidos por jornada y luego por día
      const matchesByRound: Record<string, Record<string, any[]>> = {};
      if (data && Array.isArray(data)) {
        data.forEach(match => {
          const roundName = match.round_name || 'Sin jornada';
          if (!matchesByRound[roundName]) {
            matchesByRound[roundName] = {};
          }
          
          // Extraer la fecha del partido para agrupar por día
          if (match.scheduled_at) {
            const matchDate = new Date(match.scheduled_at);
            // Usar formato ISO para evitar problemas con fechas
            const dateStr = matchDate.toISOString().split('T')[0]; // Formato: YYYY-MM-DD
            if (!matchesByRound[roundName][dateStr]) {
              matchesByRound[roundName][dateStr] = [];
            }
            matchesByRound[roundName][dateStr].push(match);
          } else {
            // Si no hay fecha, agrupar en una categoría "Sin fecha"
            const noDateKey = 'Sin fecha';
            if (!matchesByRound[roundName][noDateKey]) {
              matchesByRound[roundName][noDateKey] = [];
            }
            matchesByRound[roundName][noDateKey].push(match);
          }
        });
      }

      // Mostrar cada jornada con sus días y partidos
      const rounds = Object.keys(matchesByRound).sort((a, b) => {
        // Intentar ordenar numéricamente si los nombres de jornada siguen el patrón "Jornada X"
        const aMatch = a.match(/Jornada\s+(\d+)/i);
        const bMatch = b.match(/Jornada\s+(\d+)/i);
        
        if (aMatch && bMatch) {
          return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
        }
        
        // Si no se puede parsear como jornada numerada, usar orden alfabético
        return a.localeCompare(b);
      });
      for (const roundName of rounds) {
        if (yPosition > 180) {
          pdf.addPage();
          yPosition = 20;
        }

        // Mostrar cada día dentro de la jornada con sus partidos
        const datesInRound = Object.keys(matchesByRound[roundName]).sort((a, b) => {
          // Si es 'Sin fecha', ponerlo al final
          if (a === 'Sin fecha') return 1;
          if (b === 'Sin fecha') return -1;
          
          // Para fechas en formato YYYY-MM-DD, ordenar cronológicamente
          return a.localeCompare(b);
        });
        for (const dateStr of datesInRound) {
          // Comprobar si hay una nueva página antes de mostrar la próxima jornada
          if (yPosition > 180) {
            pdf.addPage();
            yPosition = 20;
          }

          // Mostrar el nombre de la jornada
          pdf.setFontSize(14);
          pdf.setTextColor(31, 41, 55);
          pdf.text(roundName, 20, yPosition);
          yPosition += 8;
          if (yPosition > 180) {
            pdf.addPage();
            yPosition = 20;
          }

          // Encabezado de la jornada con fecha - Ubicado en la parte superior izquierda del bloque
          pdf.setFontSize(13);
          pdf.setTextColor(107, 114, 128); // gris suave
          let headerDate = '';
          if (dateStr !== 'Sin fecha') {
            // Convertir fecha de formato YYYY-MM-DD a DD/MM/YYYY y obtener día de la semana
            const dateParts = dateStr.split('-');
            const jsDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const dayName = dayNames[jsDate.getDay()];
            const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            headerDate = `${dayName}, ${formattedDate}`;
          } else {
            headerDate = 'Sin fecha asignada';
          }
          pdf.text(headerDate, 20, yPosition); // sin identificador adicional
          yPosition += 8;

          // Dibujar un rectángulo como contenedor general (fondo oscuro)
          if (matchesByRound[roundName][dateStr] && matchesByRound[roundName][dateStr].length > 0) {
            // Calcular altura estimada para el contenedor
            const containerHeight = matchesByRound[roundName][dateStr].length * 18 + 12; // 18px por partido + padding
            // Dibujar rectángulo con fondo oscuro
            pdf.setFillColor(15, 23, 42); // #0f172a
            pdf.rect(15, yPosition, 260, containerHeight, 'F'); // F para fill (rellenar)
            
            // Dibujar borde del contenedor
            pdf.setDrawColor(55, 65, 81); // Gris oscuro para el borde
            pdf.setLineWidth(0.5);
            pdf.rect(15, yPosition, 260, containerHeight);
            
            let matchYPosition = yPosition + 6; // Posición inicial dentro del contenedor (más compacta)
            const matchesForDate = matchesByRound[roundName][dateStr];
            
            for (const match of matchesForDate) {
              if (matchYPosition > 180) { // Umbral estándar más seguro
                pdf.addPage();
                yPosition = 20;
                matchYPosition = yPosition + 8;
              }

              // Dibujar cada partido como una "card"
              pdf.setFillColor(30, 41, 59); // Fondo ligeramente más claro que el contenedor
              pdf.rect(20, matchYPosition, 250, 16, 'F'); // Card del partido más compacto
              
              // Dibujar borde de la card
              pdf.setDrawColor(55, 65, 81);
              pdf.rect(20, matchYPosition, 250, 16);

              // Formatear la información del partido
              const matchDate = match.scheduled_at ? new Date(match.scheduled_at) : null;
              
              // Limpiar los nombres de equipos con doble limpieza para caracteres especiales
              let rawHomeTeam = match.home_team?.name || 'Local';
              let rawAwayTeam = match.away_team?.name || 'Visitante';
              
              // Primero, intentar limpiar caracteres especiales más agresivamente
              rawHomeTeam = rawHomeTeam.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
              rawAwayTeam = rawAwayTeam.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
              
              const cleanHomeTeam = cleanText(rawHomeTeam);
              const cleanAwayTeam = cleanText(rawAwayTeam);
              
              // Obtener hora
              let timeStr = 'Sin hora';
              if (matchDate) {
                timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              }
              
              // Formatear el resultado
              let resultStr = getStatusText(match.status);
              let scoreStr = '';
              if (match.status === 'completed' && match.home_score !== null && match.away_score !== null) {
                scoreStr = `${match.home_score} - ${match.away_score}`;
                resultStr = 'Finalizado';
              } else {
                scoreStr = '-'; // Marcador vacío para partidos no completados
              }

              // Estructura visual de cada partido (card de resultado)
              // EQUIPO LOCAL (izquierda)
              pdf.setFontSize(9); // Tamaño de fuente reducido
              pdf.setTextColor(255, 255, 255); // Blanco
              pdf.text(cleanHomeTeam, 25, matchYPosition + 4);

              // Hora (centrado)
              pdf.setTextColor(156, 163, 175); // Gris claro
              pdf.text(timeStr, 120, matchYPosition + 4);

              // Marcador (centrado, con color verde)
              pdf.setFontSize(10); // Tamaño de fuente reducido
              pdf.setTextColor(34, 197, 94); // Verde #22c55e
              pdf.text(scoreStr, 145, matchYPosition + 4);

              // EQUIPO VISITANTE (derecha)
              pdf.setFontSize(9); // Tamaño de fuente reducido
              pdf.setTextColor(255, 255, 255); // Blanco
              pdf.text(cleanAwayTeam, 170, matchYPosition + 4);

              // Estado del partido
              pdf.setFontSize(7); // Tamaño de fuente reducido
              pdf.setFillColor(34, 197, 94); // Verde para estado completado
              if (match.status !== 'completed') {
                pdf.setFillColor(203, 213, 225); // Gris claro para otros estados
              }
              pdf.setTextColor(255, 255, 255);
              pdf.setDrawColor(100, 116, 139);
              pdf.roundedRect(210, matchYPosition + 2, 35, 6, 1.5, 1.5, 'FD'); // Filled and outlined rectangle más pequeño
              pdf.text(resultStr.substring(0, 10), 212, matchYPosition + 5.5); // Limitar texto - centrado verticalmente en el recuadro

              matchYPosition += 18; // Espaciado entre partidos reducido
            }
            
            yPosition = matchYPosition + 28; // Margen inferior después del contenedor
          } else {
            // Si no hay partidos en esta fecha, mostrar mensaje
            pdf.setFontSize(10);
            pdf.setTextColor(156, 163, 175); // Gris claro
            pdf.text('No hay partidos programados para este día', 25, yPosition + 10);
            yPosition += 20;
          }
        }
      }

      if (rounds.length === 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(75, 85, 99);
        pdf.text('No hay datos de partidos disponibles para exportar.', 20, yPosition);
        yPosition += 10;
      }
    } else if (section === 'standings') {
      // Procesar tabla de posiciones
      pdf.setFontSize(14);
      pdf.setTextColor(31, 41, 55);

      if (data && Array.isArray(data) && data.length > 0) {
        // Dibujar encabezado de la tabla de posiciones
        if (yPosition > 180) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Encabezado de la tabla
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(15, 23, 42); // #0f172a - Fondo oscuro para encabezado
        pdf.rect(15, yPosition, 260, 10, 'F'); // Fondo del encabezado
        pdf.setDrawColor(55, 65, 81);
        pdf.rect(15, yPosition, 260, 10); // Borde del encabezado
        
        // Textos del encabezado
        pdf.text('Pos', 20, yPosition + 6.5); // Posición
        pdf.text('Equipo', 40, yPosition + 6.5); // Equipo
        pdf.text('Pts', 115, yPosition + 6.5); // Puntos
        pdf.text('PJ', 135, yPosition + 6.5); // Partidos Jugados
        pdf.text('G', 155, yPosition + 6.5); // Ganados
        pdf.text('E', 170, yPosition + 6.5); // Empatados
        pdf.text('P', 185, yPosition + 6.5); // Perdidos
        pdf.text('GF', 205, yPosition + 6.5); // Goles a favor
        pdf.text('GC', 225, yPosition + 6.5); // Goles en contra
        pdf.text('DG', 245, yPosition + 6.5); // Diferencia de goles
        
        yPosition += 12; // Espacio debajo del encabezado
        
        // Dibujar filas de la tabla de posiciones
        for (const entry of data) {
          if (yPosition > 180) { // Cambiar de página si es necesario
            pdf.addPage();
            yPosition = 20;
            
            // Volver a dibujar el encabezado en la nueva página
            pdf.setFontSize(10);
            pdf.setTextColor(255, 255, 255);
            pdf.setFillColor(15, 23, 42); // #0f172a - Fondo oscuro para encabezado
            pdf.rect(15, yPosition, 260, 10, 'F'); // Fondo del encabezado
            pdf.setDrawColor(55, 65, 81);
            pdf.rect(15, yPosition, 260, 10); // Borde del encabezado
            
            // Textos del encabezado
            pdf.text('Pos', 20, yPosition + 6.5); // Posición
            pdf.text('Equipo', 40, yPosition + 6.5); // Equipo
            pdf.text('Pts', 115, yPosition + 6.5); // Puntos
            pdf.text('PJ', 135, yPosition + 6.5); // Partidos Jugados
            pdf.text('G', 155, yPosition + 6.5); // Ganados
            pdf.text('E', 170, yPosition + 6.5); // Empatados
            pdf.text('P', 185, yPosition + 6.5); // Perdidos
            pdf.text('GF', 205, yPosition + 6.5); // Goles a favor
            pdf.text('GC', 225, yPosition + 6.5); // Goles en contra
            pdf.text('DG', 245, yPosition + 6.5); // Diferencia de goles
            
            yPosition += 12; // Espacio debajo del encabezado
          }
          
          // Determinar el color de fondo según la posición
          let bgColor = [30, 41, 59]; // Fondo por defecto
          if (entry.position <= 6) {
            bgColor = [34, 197, 94]; // Verde para clasificados directos (posición 1-6)
          } else if (entry.position <= 10) {
            bgColor = [234, 179, 8]; // Amarillo para repechaje (posición 7-10)
          } else if (entry.position >= data.length - 2) {
            bgColor = [239, 68, 68]; // Rojo para eliminados (últimas 3 posiciones)
          }
          
          // Dibujar fondo de la fila
          // @ts-ignore
            pdf.setFillColor(...bgColor);
          pdf.rect(15, yPosition, 260, 8, 'F'); // Fondo de la fila
          pdf.setDrawColor(55, 65, 81);
          pdf.rect(15, yPosition, 260, 8); // Borde de la fila
          
          // Colores de texto
          pdf.setFontSize(9);
          pdf.setTextColor(255, 255, 255); // Texto blanco
          
          // Dibujar datos de la fila
          pdf.text(entry.position.toString(), 20, yPosition + 5.5); // Posición
          
          // Nombre del equipo (limpiar caracteres especiales y limitar longitud si es necesario)
          let teamName = entry.team?.name ? cleanText(entry.team.name) : 'Equipo';
          if (teamName.length > 20) {
            teamName = teamName.substring(0, 17) + '...';
          }
          pdf.text(teamName, 40, yPosition + 5.5); // Equipo
          
          pdf.text(entry.points?.toString() || '0', 115, yPosition + 5.5); // Puntos
          pdf.text(entry.played?.toString() || '0', 135, yPosition + 5.5); // Partidos Jugados
          pdf.text(entry.wins?.toString() || '0', 155, yPosition + 5.5); // Ganados
          pdf.text(entry.draws?.toString() || '0', 170, yPosition + 5.5); // Empatados
          pdf.text(entry.losses?.toString() || '0', 185, yPosition + 5.5); // Perdidos
          pdf.text(entry.goalsFor?.toString() || '0', 205, yPosition + 5.5); // Goles a favor
          pdf.text(entry.goalsAgainst?.toString() || '0', 225, yPosition + 5.5); // Goles en contra
          
          // Diferencia de goles con signo
          const goalDiff = entry.goalDifference >= 0 ? `+${entry.goalDifference}` : entry.goalDifference.toString();
          pdf.text(goalDiff, 245, yPosition + 5.5); // Diferencia de goles
          
          yPosition += 9; // Espacio entre filas
        }
        
        // Añadir leyenda de clasificación
        if (yPosition > 170) { // Cambiar de página si no hay espacio suficiente
          pdf.addPage();
          yPosition = 20;
        }
        
        // Dibujar recuadro para la leyenda
        pdf.setFillColor(30, 41, 59); // Fondo similar al encabezado de la tabla
        pdf.rect(15, yPosition, 260, 25, 'F'); // Fondo del recuadro de leyenda
        pdf.setDrawColor(55, 65, 81);
        pdf.rect(15, yPosition, 260, 25); // Borde del recuadro de leyenda
        
        // Título de la leyenda
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Leyenda de Clasificación:', 20, yPosition + 5);
        
        // Clasificados directos (verde)
        pdf.setFillColor(34, 197, 94); // Verde
        pdf.rect(20, yPosition + 8, 5, 5, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.text('Clasificados directos (Posiciones 1-6)', 30, yPosition + 11.5);
        
        // Repechaje (amarillo)
        pdf.setFillColor(234, 179, 8); // Amarillo
        pdf.rect(20, yPosition + 14, 5, 5, 'F');
        pdf.text('Repechaje (Posiciones 7-10)', 30, yPosition + 17.5);
        
        // Eliminados (rojo)
        pdf.setFillColor(239, 68, 68); // Rojo
        pdf.rect(20, yPosition + 20, 5, 5, 'F');
        pdf.text('Eliminados ', 30, yPosition + 23.5);
        
        yPosition += 30; // Espacio después de la leyenda
      } else {
        pdf.setFontSize(12);
        pdf.setTextColor(75, 85, 99);
        pdf.text('No hay datos de posiciones disponibles para exportar.', 20, yPosition);
        yPosition += 10;
      }
    } else if (section === 'stats') {
      // Procesar estadísticas
      pdf.setFontSize(14);
      pdf.setTextColor(31, 41, 55);
      
      if (data) {
        // Mostrar diferentes tipos de estadísticas
        if (data.totalGoals !== undefined) {
          if (yPosition > 180) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`Goles totales: ${data.totalGoals}`, 20, yPosition);
          yPosition += 8;
        }
        
        if (data.topScorers && Array.isArray(data.topScorers) && data.topScorers.length > 0) {
          if (yPosition > 180) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setFontSize(13);
          pdf.setTextColor(31, 41, 55);
          pdf.text('Goleadores:', 20, yPosition);
          yPosition += 7;
          
          pdf.setFontSize(11);
          pdf.setTextColor(75, 85, 99);
          data.topScorers.slice(0, 10).forEach((scorer: any, idx: number) => {
            if (yPosition > 180) {
              pdf.addPage();
              yPosition = 20;
            }
            const playerName = scorer.player_name ? cleanText(scorer.player_name) : 'Jugador';
            const teamName = scorer.team_name ? cleanText(scorer.team_name) : 'Equipo';
            pdf.text(`${idx + 1}. ${playerName} (${teamName}): ${scorer.goals} goles`, 25, yPosition);
            yPosition += 6;
          });
          
          yPosition += 5;
        }
        
        if (data.topAssists && Array.isArray(data.topAssists) && data.topAssists.length > 0) {
          if (yPosition > 180) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setFontSize(13);
          pdf.setTextColor(31, 41, 55);
          pdf.text('Asistencias:', 20, yPosition);
          yPosition += 7;
          
          pdf.setFontSize(11);
          pdf.setTextColor(75, 85, 99);
          data.topAssists.slice(0, 10).forEach((assist: any, idx: number) => {
            if (yPosition > 180) {
              pdf.addPage();
              yPosition = 20;
            }
            const playerName = assist.player_name ? cleanText(assist.player_name) : 'Jugador';
            const teamName = assist.team_name ? cleanText(assist.team_name) : 'Equipo';
            pdf.text(`${idx + 1}. ${playerName} (${teamName}): ${assist.assists} asistencias`, 25, yPosition);
            yPosition += 6;
          });
          
          yPosition += 5;
        }
        
        if (data.totalCards !== undefined) {
          if (yPosition > 180) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`Tarjetas amarillas: ${data.totalCards.yellow || 0}`, 20, yPosition);
          yPosition += 6;
          pdf.text(`Tarjetas rojas: ${data.totalCards.red || 0}`, 20, yPosition);
          yPosition += 8;
        }
      } else {
        pdf.setFontSize(12);
        pdf.setTextColor(75, 85, 99);
        pdf.text('No hay estadísticas disponibles para exportar.', 20, yPosition);
        yPosition += 10;
      }
    }

    return pdf;
  };

  // Función auxiliar para limpiar texto de caracteres extraños
  const cleanText = (text: string): string => {
    if (!text) return '';
    // Remover todos los caracteres que no sean letras, números, espacios y caracteres latinos comunes
    return text
      .normalize('NFD') // Normalizar caracteres unicode
      .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas (acentos)
      .replace(/[^\w\s\u00C0-\u017F\-.,()]/g, '') // Permitir solo caracteres alfanuméricos, espacios y caracteres latinos básicos
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
      .trim();
  };

  // Función auxiliar para obtener texto del estado
  const getStatusText = (status: string) => {
    switch(status) {
      case 'scheduled': return 'Programado';
      case 'in_progress': return 'En curso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };



  return (
    <button
      onClick={exportToPDF}
      disabled={isLoading}
      className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 ${className}`}
      aria-label={title}
    >
      {isLoading ? (
        <>
          <Save className="h-4 w-4 mr-2 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {title}
        </>
      )}
    </button>
  );
}

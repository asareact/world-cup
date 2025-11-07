'use client';

import { Download, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import { useState } from 'react';

interface ExportPDFButtonProps {
  targetElementId: string; // este será el tournamentId en lugar del ID del elemento
  fileName?: string;
  title?: string;
  className?: string;
  section?: 'calendar' | 'matches' | 'stats' | 'results'; // tipo de sección a exportar
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
              pdf.text(resultStr.substring(0, 10), 212, matchYPosition + 4); // Limitar texto

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

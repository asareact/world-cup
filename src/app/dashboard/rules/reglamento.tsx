'use client'

import { useState } from 'react'

export default function ReglamentoTorneo() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const sections = [
    {
      id: 'convocatoria',
      title: 'Convocatoria 2025 - 2026 invierno',
      content: `
        Fecha de inicio del Torneo: -
        Lugar: UCI (Universidad de Ciencias Informáticas), canchas de futsal (jaulas grandes)
        Formato: Liga (con su particularidad)
      `
    },
    {
      id: 'articulo1',
      title: 'ARTÍCULO 1: EL TERRENO DE JUEGO (Depende de nuestro terreno que es el único que tenemos)',
      content: `
        Dimensiones: El terreno de juego será rectangular. Longitud (línea de banda): mínima 25m, máxima 42m. Anchura (línea de fondo): mínima 15m, máxima 25m. 
        Marcación: El campo estará delimitado por líneas. Las líneas de banda y meta pertenecen al terreno de juego. Se marcarán el círculo central, el área de meta, el área de penalti (a 10 metros) y el doble penalti (a 12 metros, desde el centro de la portería).
        Porterías: Medirán 3m de ancho por 2m de alto.
      `
    },
    {
      id: 'articulo2',
      title: 'ARTÍCULO 2: EL BALÓN (Depende de la pelota que se compre)',
      content: `
        Será esférico, de cuero o material similar, de talla 4 (circunferencia entre 62 y 64 cm, y un peso entre 400 y 440 gr al inicio del partido).
        Presión: Tendrá una presión de 0.6-0.9 atmósferas (600-900 gr/cm²).
      `
    },
    {
      id: 'articulo3',
      title: 'ARTÍCULO 3: NÚMERO DE JUGADORES',
      content: `
        Jugadores en Campo: Cada equipo se compone de 5 jugadores, uno de los cuales será el guardameta.
        Sustituciones: Ilimitadas y en cualquier momento del partido. Se realizarán por la zona habilitada para cambios y solo serán efectivas una vez que el jugador que sale haya abandonado completamente el campo.
        Mínimo de Jugadores: Un partido no podrá iniciarse si un equipo tiene menos de 4 jugadores (incluido el portero). Si durante el partido un equipo se queda con menos de 3 jugadores, el partido se dará por finalizado y el resultado se determinará según el comité de competición (generalmente, victoria del equipo contrario).
        Cantidad de jugadores por equipo: el equipo estará compuesto por 14 jugadores, 12 en la cancha y dos de reservas, en caso de surja cualquier inconveniente.
        Jugadores en cancha: se permiten 12 jugadores en la cancha, que antes de comenzar el partido el capitán o cualquier miembro del equipo será responsable de escribirlos y darlo a los árbitros o a algún organizador. 
        En caso de que en el momento del comienzo de un partido no cuente con todos los jugadores para llenar la plantilla, puede dejar los espacios en blanco, cuando se vayan incorporando, el equipo tiene la responsabilidad de mandarlo a que de su nombre a la plantilla de ese juego.
        El juego no puede comenzar si los árbitros u organizadores no tienen la plantilla de cada equipo para ese juego.
        En caso de que el un jugador no esté en la plantilla por llegar tarde y entre al terreno de juego sin anotarse en la lista de su equipo, se detiene el juego, se manda a ese jugador a abandonar la cancha para inscribirse y automáticamente se amonesta con una tarjeta amarilla.
        En caso de que un jugador entre en juego y no esté en la plantilla de los 14 del equipo, en cuanto se detecte la ilegalidad, ya sea por los árbitros, organizadores o equipo rival, se detiene el juego y el equipo infractor pierde ese encuentro por un resultado que en otro punto se explicará.
        Si un jugador comienza jugando el torneo con un equipo ya no puede cambiarse a otro, a no ser que exista una ventana de fichajes autorizada por los organizadores.
        Los equipos que logren avanzar en el torneo no tendrán la ventaja de reforzar su plantilla.
      `
    },
    {
      id: 'articulo4',
      title: 'ARTÍCULO 4: EQUIPACIÓN DE LOS JUGADORES',
      content: `
        Uniforme: Los jugadores de un mismo equipo se vestirán indumentaria de colores muy similares en su pullover (previamente acordado por cada equipo), salvo el guardameta, que deberá tener colores que lo diferencien claramente de ambos equipos y del árbitro. En caso que un jugador entre a la cancha con una vestimenta que no va acorde con su equipo y pueda traer confusión, se espera que termine la acción y se manda al jugador a que abandone la cancha, en caso de que el mismo jugador cometa la misma infracción en un mismo juego será amonestado con una tarjeta amarilla.
        Equipos con uniformes similares: En caso de que se enfrenten dos equipos con colores similares o el mismo color, si no llegan a un previo acuerdo, se procede a un sorteo a ver quién se queda con el color.
        Calzado: Solo se permiten zapatillas de deporte con suela de goma o material similar no marcante. Prohibido el uso de tacos (fútbol 11) o calzado no adecuado. El jugador que no tenga por algún motivo calzado, el árbitro puede tomar la decisión de dejarlo o no jugar. En el caso de que se detecte una ilegalidad con el calzado, se detiene el juego y ese jugador se retira de la cancha y es amonestado con una tarjeta amarilla.
        Protección: Está permitido el uso de espinilleras. Está prohibido el uso de objeto que pueda ser peligroso para el propio jugador o los demás (anillos, pulseras, collares, piercings, etc.). Al jugador que se detecte con algún objeto prohibido, se espera a que termine la acción y se manda a retirar de la cancha para que se lo quite y es amonestado con una tarjeta amarilla.
      `
    },
    {
      id: 'articulo5',
      title: 'ARTÍCULO 5: ÁRBITROS',
      content: `
        Los árbitros son los encargados de hacer cumplir el reglamento, además de sancionar cualquier infracción que ocurra, por lo que siempre deben estar atentos al partido. La persona que esté como árbitro en un juego y se detecte que no está atendiendo su función, el capitán o capitanes de los equipos podrán dirigirse respetuosamente al otro árbitro u organizador y plantear la situación, el árbitro infractor tendrá un llamado de atención y si continúa de esa forma, será suspendido del encuentro y no podrá pitar durante 3 partidos.
        El partido será dirigido por dos árbitros, uno de ellos será Árbitro Principal y otro auxiliar, cuya autoridad es absoluta de ambos y sus decisiones son inapelables.
        En el caso de que ocurra una situación de juego en que ellos no vean clara la jugada, pueden reunirse y tomar una decisión.
        Serán asistido por un Anotador/Cronometrador en mesa, quien controlará el tiempo de juego, las faltas acumulativas, el tiempo de castigo, las estadísticas y las sustituciones.
        En caso de que sea la hora de comienzo de un partido y no están los árbitros designados, se llega a un consenso de los capitanes si desean que su juego lo dirija otra pareja de árbitros o alguna persona que tenga minimo conocimiento, en caso contrario se suspende el partido y queda aplazado.
        En el caso de que sea hora de comienzo de un partido y esté un solo árbitro de los designados, se llega a un consenso entre los capitanes y ese arbitro a ver si quieren que pite el solo o se apoye con otra persona más que finja de segundo árbitro. Si no se llega a un consenso se suspende el juego y se aplaza el partido.
        Solo los capitanes están autorizados a reclamar a los árbitros de forma respetuosa. Cualquier jugador que no sea capitán y haga una reclamación que el árbitro considere en un tono ofensivo, puede ser que le llamen la atención o puede ser sancionado con una tarjeta amarilla o roja según la gravedad.
        El capitán o jugador que le falte el respeto a un árbitro o lo agreda, será suspendido del torneo, y no jugará durante 2 torneos más mientras sean los mismo organizadores.
      `
    },
    {
      id: 'articulo6',
      title: 'ARTÍCULO 6: DURACIÓN DEL PARTIDO',
      content: `
        El partido durará 50 minutos cronometrados, divididos en dos tiempos de 25 minutos cada uno.
        El juego se detendrá cuando el cronómetro llegue al minuto 25 de cada tiempo.
        Habrá un descanso de 5 minutos entre ambos periodos.
        El tiempo se detendrá únicamente en caso de lesiones o situaciones especiales que lo requieran, a decisión de los árbitros.
      `
    },
    {
      id: 'articulo7',
      title: 'ARTÍCULO 7: SAQUE DE CENTRO Y GOL VÁLIDO',
      content: `
        Inicio: El partido comienza con un saque de centro en el círculo central. Los jugadores rivales deben estar en su propio campo.
        Gol: Se marcará gol cuando el balón haya traspasado completamente la línea de meta entre los postes y por debajo del travesaño, siempre que no se haya cometido una infracción previamente o no haya finalizado el tiempo de juego (25 min cronometrados).
      `
    },
    {
      id: 'articulo8',
      title: 'ARTÍCULO 8: FALTAS E INCORRECCIONES (FALTAS ACUMULATIVAS)',
      content: `
        Se sancionará con tiro libre directo (se puede marcar gol directamente) las siguientes infracciones (se consideran faltas acumulativas): Dar o intentar dar una patada a un adversario, Poner una zancadilla, Saltar o cargar sobre un adversario, Golpear o intentar golpear a un adversario, Empujar a un adversario, Hacer una entrada temeraria o jugar de forma peligrosa, Sujetar a un adversario, Escupir a un adversario, Tocar el balón deliberadamente con la mano (excepto el portero en su área), "Barrida": Deslizarse para tacklear (solo se permite si es frontal y sin contacto; cualquier barrida con contacto o lateral/por detrás es falta).
        Faltas Acumulativas: A partir de la 5ta falta de equipo en un mismo tiempo, todas las faltas que se cometan se lanzarán desde el punto de doble penalti (12m), sin barrera. El portero debe estar a 5m de distancia.
        En caso de que a partir de la 5ta falta, se comentan faltas que están más cerca de la portería o con ventaja para el atacante, el cobrador decidirá si tirar desde ese punto o del punto de doble penal.
      `
    },
    {
      id: 'articulo9',
      title: 'ARTÍCULO 9: TIROS LIBRES',
      content: `
        Barrera: Los adversarios deben estar como mínimo a 5 metros del balón hasta que sea puesto en juego.
        Tiempo: Si el tiro libre no se ejecuta en menos de 4 segundos, se concederá un libre indirecto al equipo rival desde la misma posición.
      `
    },
    {
      id: 'articulo10',
      title: 'ARTÍCULO 10: PENALTI',
      content: `
        Se concede cuando se cometa una falta dentro del área que merezca tiro libre directo.
        Se lanza desde el punto marcado que está en el borde del área.
        Solo el lanzador y el portero rival pueden estar en el área. El portero debe estar sobre su línea de meta.
      `
    },
    {
      id: 'articulo11',
      title: 'ARTÍCULO 11: TIRO DE 10 METROS',
      content: `
        Se aplicará el "doble penal" si un equipo comete 6 o más faltas acumulativas en un mismo tiempo.
        Los tiros libres indirectos no entran en la acumulación de faltas.
        Los tiros libres se ejecutarán desde el lugar de la falta, y los jugadores del equipo defensor deberán estar a una distancia mínima de 5 metros como se explicó en el Artículo 9.
      `
    },
    {
      id: 'articulo12',
      title: 'ARTÍCULO 12: SAQUE DE BANDA',
      content: `
        Se concede cuando el balón cruza completamente la línea de banda.
        Forma de ejecución: Con el pie. El balón debe estar inmóvil sobre la línea. El jugador tiene 4 segundos para poner el balón en juego. Los adversarios deben estar a 5 metros de distancia.
        Se considera mal saque si: se demoran más de 4 segundos, si el balón está en movimiento.
        Si el cobrador pide distancia, tiene que esperar el silbato del árbitro para poder cobrar el saque de banda, en caso de que se adelante al cobro, recibirá una advertencia del árbitro, si vuelve a incurrir en la misma jugada el cobrador será amonestado con tarjeta amarilla.
        Ya sea tiro libre, saques de bandas o saques de esquinas los jugadores en fase defensiva están obligados a dar 1 metro de distancia, en caso de que el jugador saque y el defensor no esté a la distancia y toque el balón recibirá una tarjeta amarilla.
      `
    },
    {
      id: 'articulo13',
      title: 'ARTÍCULO 13: SAQUE DE META (SAQUE DE PORTERÍA)',
      content: `
        Se concede cuando el balón cruza completamente la línea de meta, habiendo sido tocado por último por un jugador atacante.
        Forma de ejecución: El guardameta del equipo defensor lanzará o dejará caer el balón con las manos desde dentro del área. El balón estará en juego en el momento en que se haya lanzado o soltado y se desplace con claridad.
        El saque deberá realizarse en un tiempo máximo de 4 segundos a contar desde el momento en el que el equipo en posesión del balón estuviera preparado para ejecutarlo o desde que el árbitro hubiera dado la señal para poner el balón en movimiento.
        Los adversarios deberán permanecer fuera del área hasta que el balón esté en juego.
        Si, una vez que el balón esté en juego, el guardameta que ejecutó el saque volviera a tocarlo antes de que lo toque otro jugador, se concederá un libre indirecto.
        Si el guardameta toca el balón por segunda vez en su propia área de mitad de campo sin que lo haya tocado un adversario o haya salido de banda o de meta, se concederá un tiro libre indirecto al equipo adversario. Para que esto no ocurra y el portero pueda jugar como el resto del equipo, debe pasar de la mitad del campo e incorporarse al ataque del equipo, lo que llaman salida de 5.
      `
    },
    {
      id: 'articulo14',
      title: 'ARTÍCULO 14: SAQUE DE ESQUINA',
      content: `
        El saque de esquina se realizará desde el punto de esquina más cercano al lugar donde se produjo la salida del balón.
        Se concede cuando el balón cruza completamente la línea de meta, habiendo sido tocado por último por un jugador defensor (incluido el portero).
        Se ejecuta con el pie desde el vértice más cercano. El jugador tiene 4 segundos. Los defensores deben estar a 5 metros.
      `
    },
    {
      id: 'articulo15',
      title: 'ARTÍCULO 15: FALTAS TÉCNICAS Y TARJETAS',
      content: `
        Tarjeta Amarilla (Amonestación): Por conducta antideportiva, disentir, infringir persistentemente las reglas, retrasar el juego, no respetar la distancia en un saque, o entrar/salir de la pista incorrectamente en una sustitución.
        Tarjeta Roja (Expulsión): Por juego brusco grave, conducta violenta, escupir, impedir un gol con la mano (excepto portero), insultar, o recibir una segunda amarilla en el mismo partido.
        Sanción por Expulsión: El jugador expulsado no podrá jugar el resto del partido. Su equipo jugará con un jugador menos durante 2 minutos cronometrados o hasta que encajen un gol. Pasado ese tiempo, podrán completar el equipo.
        El jugador que empiece o participe en alguna pelea será expulsado del torneo y no podrá jugar más ni en ese ni en los próximos 3 torneos organizados por las mismas personas.
        El jugador o staff que le falte el respeto o agreda a un árbitro será expulsado automáticamente del torneo y no podrá jugar más ni en ese ni en los próximos 3 torneos organizados por las mismas personas.
        Un jugador que reciba una tarjeta amarilla en 2 partidos consecutivos de cualquier fase se perderá el próximo partido. Una vez cumplida la sanción se reinicia el contador de tarjetas amarillas a 0.
        Un jugador que reciba 3 tarjetas amarillas por acumulación se pierde el próximo partido a partir de la última tarjeta sacada. Una vez cumplida la sanción se reinicia el contador de tarjetas amarillas en 0.
        Las tarjetas amarillas se borran a la hora de entrar en las fases eliminatorias. Es decir, el jugador que tenga 2 tarjetas amarillas acumuladas y entra a la fase de eliminación, se le borran las tarjetas.
        Los jugadores que por algún motivo tenga 2 tarjetas acumuladas y le muestran otra en el último juego antes de pasar a fase de eliminación, tiene que cumplir el partido de suspensión.
        Al jugador que le muestren una tarjeta amarilla en los 2 partidos antes de pasar a fase de eliminación (una por partido), o al que le saquen roja en el último partido antes de entrar en fase eliminatoria, tiene que cumplir el partido de suspensión.
        Si un jugador recibe solo una tarjeta amarilla en la fase de eliminación, ésta será borrada para la próxima fase.
        Un jugador que reciba una tarjeta roja será expulsado del partido y deberá cumplir una sanción de al menos un partido.
      `
    },
    {
      id: 'articulo16',
      title: 'ARTÍCULO 16: REGLA DE LOS 4 SEGUNDOS',
      content: `
        Se aplica a: Saques de banda, saques de esquina, tiros libres y saques del portero (de pie).
        El jugador tiene 4 segundos para poner el balón en juego. Si no lo hace, la posesión del balón pasará al equipo contrario.
      `
    },
    {
      id: 'articulo17',
      title: 'ARTÍCULO 17: PROCEDIMIENTO PARA DEFINIR EMPATES (SÓLO FASE ELIMINATORIA)',
      content: `
        Si un partido de fase eliminatoria termina en empate, se procederá de la siguiente forma:
        Tiempo Extra: 2 periodos de 5 minutos cada uno, con cambio de campo.
        Penaltis: Si persiste el empate, se lanzarán series de 5 penaltis alternos desde el punto de penal. Si continúa el empate, se continuará con lanzamientos alternos hasta que haya un ganador ("muerte súbita").
      `
    },
    {
      id: 'articulo18',
      title: 'ARTÍCULO 18: PROTOCOLO Y DISCIPLINA',
      content: `
        Puntualidad: El equipo que no se presente con al menos 4 jugadores en el terreno de juego 10 minutos después de la hora oficial de inicio, perderá el partido por no presentación con un resultado de 5-0.
        Responsabilidad: Los capitanes y entrenadores son responsables de la conducta de sus jugadores y aficionados.
        Reclamaciones: Cualquier reclamación deberá ser presentada por escrito por el capitán/delegado del equipo en un plazo máximo de 2 horas tras la finalización del partido. El staff organizador deberá dar una respuesta a la reclamación antes de su próximo partido.
        En caso de que un equipo dé foul field 1 veces es automáticamente eliminado del torneo. Se eliminarán los puntos acumulados a los equipos que se hayan enfrentado a ese equipo eliminado y hayan sumado puntos, y todos los juegos desde el inicio del torneo quedarán en un estado congelado como si el equipo eliminado no hubiese existido.
      `
    },
    {
      id: 'articulo19',
      title: 'ARTÍCULO 19: CESIONES',
      content: `
        Cuando el equipo está en su propia cancha el portero solamente podrá tocar el balón una vez, si el equipo pasa a zona de ataque y el balón bota o viene del rebote de un contrario el portero si la puede volver a tocar.
        Si un jugador del mismo equipo le pasa el balón al portero y este lo coge con la mano, será sancionado con tiro libre indirecto.
        Como único el portero tiene toques de balón ilimitado es que el portero pase de media cancha en faceta ofensiva (salida de 5).
      `
    },
    {
      id: 'articulo20',
      title: 'ARTÍCULO 20: ESTRUCTURA DEL TORNEO',
      content: `
        Fase de clasificatoria
        Todos los equipos jugarán una ronda donde se enfrentarán a los demás equipos del torneo en un partido por la clasificación.
        La tabla clasificatoria será sumando los puntos acumulados por los juegos disputados (3 puntos juego ganado, 1 punto juego empatado, 0 juego perdido), quedando en primer lugar el que más puntos acumule y así sucesivamente.
        Clasifican directo a la próxima fase los 6 primeros de la tabla clasificatoria, es decir los 6 equipos que más puntos acumulen.
        Los próximos 4 equipos en la tabla de clasificación, es decir del puesto 7 al 10, se enfrentarán en una serie donde jugarán un partido de ida y uno de vuelta, enfrentados el puesto 7 con el puesto 10 y el puesto 8 con el puesto 9. 
        Clasifica el equipo de cada serie que más goles anote, en caso de empate en el resultado global de los dos juegos, se pasa a 2 tiempos extra de 5 minutos cada uno en el segundo juego. En caso de seguir el  empate se pasa a una tanda de penales, donde se tiran 5 penales por cada equipo, alternando los cobradores, si sigue el empate, si tira de uno en uno hasta llegar a un ganador (muerte súbita).
        El orden que tomen en la clasificación para la próxima fase, depende del orden del puesto que tenían en la tabla general, es decir, el lugar 7 que enfrenta al lugar 10, en caso de clasificar el lugar 7 se queda en ese mismo puesto, en caso de clasificar el puesto 10, clasifica en la plaza 8 para la próxima fase. En la otra llave que se enfrentan lugar 8 y 9, si por la otra llave clasifica el lugar 7, cualquiera que clasifique en esta llave tomará la plaza 8, pero si por la otra llave clasifica el lugar 10, cualquiera de estos dos que clasifique tomará la plaza 7, ya que el lugar 10 tomará la plaza 8, como ya se explicó.

        Fase de Cuartos de Final
        La fase de cuartos de final se disputa a dos juegos, llamados ida y vuelta.
        Se enfrentan las plazas [1 - 8] - A, [2 - 7] - B, [3 - 6] - C y [4 - 5] - D.
        Clasifica para la próxima fase, el que más goles anote sobre el otro equipo. En caso de empate en el resultado global nos guiamos por el punto 5 explicado en la fase clasificatoria.

        Semifinales
        La fase de cuartos de final se disputa a dos juegos, llamados ida y vuelta.
        Se enfrentan en esta fase el ganador de la serie A con el ganador de la serie D y el ganador de la serie B con el ganador de la serie C.
        Clasifica para la próxima fase, el que más goles anote sobre el otro equipo. En caso de empate en el resultado global nos guiamos por el punto 5 explicado en la fase clasificatoria.

        Final y Tercer lugar
        Estos dos juegos se efectuarán el mismo día, el Tercer lugar se jugará primero y más tarde se jugará la Final, los horarios se publicaran con tiempo.
        El formato en esta fase es a partido único, gana el que más goles anote sobre el otro equipo. En caso de empate en el resultado global nos guiamos por el punto 5 explicado en la fase clasificatoria.
      `
    },
    {
      id: 'consideraciones',
      title: 'CONSIDERACIONES FINALES',
      content: `
        Se recomienda a todos los equipos que revisen las reglas y se preparen adecuadamente para el torneo.
        Se espera un ambiente de respeto y deportividad entre todos los participantes.
        El único jugador que se puede dirigir al árbitro y de una forma respetuosa y cordial son los capitanes de cada equipo, protestas de los jugadores hacia los árbitros se sancionarán con tarjeta amarilla.
        La fecha de las próximas jornadas se publicarán en el horario de la mañana o por la noche del día anterior.
        Los capitanes tienen hasta las 4pm de ese día de juego para querer retrasar o suspender el partido por motivos bien justificados. En caso de suspensión será valorado por el comité organizador.
        Los partidos aplazados serán recuperados al finalizar la fase de clasificación, en caso de que el torneo tenga varias vueltas, se recuperan al finalizar de cada fase.
        En caso de que se aplace una jornada completa por cualquier motivo, se recupera al finalizar de la fase.
        Los días de juego serán de lunes a jueves.
        Los partidos tienen que empezar en la hora que se dictaminó, en caso de que a la hora de comienzo de un juego exista algún equipo que no esté o no cuente con el mínimo de los jugadores para comenzar, se esperará un máximo de 10 minutos, pasados los 10 minutos se toma la decisión de que ese equipo pierde 5-0.
        Si la hora de comienzo de un partido ninguno de los dos equipos cuentan con el mínimo de jugadores para jugar, el juego será acordado como un empate con un resultado de 0 - 0.
        Si algún equipo tiene 4 jugadores en la cancha a la hora de comenzar su juego tienen que comenzar jugando con esos jugadores, los otros integrantes llegan pueden incorporar.
        En la cancha cada equipo podrá contar, si lo tiene, con 3 personas de su staff técnico, serán las mismas personas siempre.
        En el banco de los equipos que juegan no puede estar nadie que no sean los autorizados a jugar, con su staff y personas autorizados por los árbitros de cada juego, en caso que se detecte una ilegalidad se detiene el juego hasta que la o las personas abandonen el terreno.
        Cada jugador contará con un dorsal que lo identifique.
        Se va a crear una grupo para valorar algunas situaciones excepcionales, en caso que se den por algún motivo. El cual va a contar con Enrique Basto (organizador), los árbitros designados desde el inicio del torneo y los capitanes de los equipos.
      `
    },
    {
      id: 'nota-final',
      title: 'NOTA FINAL',
      content: `
        Este reglamento está sujeto a la interpretación de los árbitros y al comité organizador del torneo. Cualquier caso no previsto en este reglamento será resuelto por dicho comité.
      `
    }
  ]

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
        <h1 className="text-2xl font-bold text-white">Reglamento del Torneo de Futsal en la UCI</h1>
        <p className="text-green-100 mt-2">Convocatoria 2025 - 2026 invierno</p>
      </div>
      
      <div className="p-6">
        {sections.map((section) => (
          <div key={section.id} className="mb-4 border-b border-gray-700 pb-4 last:border-b-0">
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between w-full text-left py-3 hover:bg-gray-700/50 rounded-lg px-3 transition-colors"
            >
              <h3 className="font-semibold text-white">{section.title}</h3>
              <svg 
                className={`h-5 w-5 text-gray-400 transform transition-transform ${expandedSections[section.id] ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedSections[section.id] && (
              <div className="mt-3 pl-3 text-gray-300 whitespace-pre-line">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
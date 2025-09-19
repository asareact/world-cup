import ReglamentoTorneo from './reglamento'

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Reglas del Torneo</h1>
        <p className="text-gray-400 mt-2">
          Consulta las reglas y normativas oficiales para participar en los torneos
        </p>
      </div>

      <ReglamentoTorneo />
    </div>
  )
}
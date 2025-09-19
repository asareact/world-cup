"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, CheckCircle2, Loader2, Lock, Target, Users, Eye } from "lucide-react"
import { useTournaments } from "@/lib/hooks/use-tournaments"

const MIN_TEAMS = 9
const MAX_TEAMS = 14
const DIRECT_SLOTS = 6
const REPECHAGE_SLOTS = 4
const ELIMINATED_SLOTS = 3

interface HybridTournamentFormData {
  name: string
  description: string
  maxTeams: number
  startDate: string
  endDate: string
  registrationDeadline: string
  prizeDescription: string
  isPublic: boolean
  showPlanPreview: boolean
}

const defaultFormState: HybridTournamentFormData = {
  name: "",
  description: "",
  maxTeams: MAX_TEAMS,
  startDate: "",
  endDate: "",
  registrationDeadline: "",
  prizeDescription: "",
  isPublic: false,
  showPlanPreview: true,
}

const businessRules = [
  `Entre ${MIN_TEAMS} y ${MAX_TEAMS} equipos compiten en fase todos contra todos.`,
  `Los ${DIRECT_SLOTS} mejores clasificados avanzan directo a cuartos.`,
  `Los siguientes ${REPECHAGE_SLOTS} lugares disputan repechaje a doble partido (se ajusta si faltan equipos).`,
  `Los ultimos ${ELIMINATED_SLOTS} quedan eliminados automaticamente (el sistema se adapta si no es posible).`,
  "Los ocho clasificados resultantes se sortean para emparejar cuartos de final.",
  "Las series de repechaje se juegan ida y vuelta; si hay empate global se juega tiempo extra y luego penales.",
]

const rulesPayload = {
  type: "league_repechage",
  minTeams: MIN_TEAMS,
  maxTeams: MAX_TEAMS,
  directSlots: DIRECT_SLOTS,
  repechageSlots: REPECHAGE_SLOTS,
  eliminatedSlots: ELIMINATED_SLOTS,
  knockoutSeed: "random_draw",
  repechageFormat: {
    legs: 2,
    tieBreaker: ['extra_time', 'penalties'],
  },
  knockout: {
    quarterFinals: {
      legs: 2,
      tieBreaker: ['extra_time', 'penalties'],
      matchups: ['1 vs 8', '2 vs 7', '3 vs 6', '4 vs 5'],
    },
    semiFinals: {
      legs: 2,
      tieBreaker: ['extra_time', 'penalties'],
      matchups: ['Ganador A vs Ganador D', 'Ganador B vs Ganador C'],
    },
    final: {
      legs: 1,
      tieBreaker: ['extra_time', 'penalties'],
    },
    thirdPlace: {
      legs: 1,
      tieBreaker: ['extra_time', 'penalties'],
    },
  },
  notes: businessRules,
}

export function HybridTournamentForm() {
  const router = useRouter()
  const { createTournament } = useTournaments()
  const [form, setForm] = useState<HybridTournamentFormData>(defaultFormState)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const validation = useMemo(() => {
    const errors: Record<string, string> = {}

    if (!form.name.trim()) {
      errors.name = "El nombre es obligatorio"
    }

    if (form.maxTeams < MIN_TEAMS || form.maxTeams > MAX_TEAMS) {
      errors.maxTeams = `El numero de equipos debe estar entre ${MIN_TEAMS} y ${MAX_TEAMS}`
    }

    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      errors.startDate = "La fecha de inicio debe ser anterior a la de fin"
      errors.endDate = "La fecha de fin debe ser posterior a la de inicio"
    }

    if (form.registrationDeadline && form.startDate && form.registrationDeadline > form.startDate) {
      errors.registrationDeadline = "El cierre de inscripciones debe ser antes del inicio"
    }

    return errors
  }, [form])

  const hasErrors = Object.keys(validation).length > 0

  const handleChange = <K extends keyof HybridTournamentFormData>(key: K, value: HybridTournamentFormData[K]) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (hasErrors) {
      setToast({ message: "Corrige los errores antes de continuar", type: "error" })
      setTimeout(() => setToast(null), 2200)
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: "draft" as const,
        format: "round_robin" as const,
        max_teams: form.maxTeams,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        registration_deadline: form.registrationDeadline || null,
        rules: JSON.stringify(rulesPayload),
        prize_description: form.prizeDescription.trim() || null,
        is_public: form.isPublic,
      }

      const created = await createTournament(payload)

      setToast({ message: "Torneo creado en borrador", type: "success" })
      setTimeout(() => setToast(null), 2000)

      router.push(`/dashboard/tournaments?highlight=${created.id}`)
    } catch (error) {
      console.error("Error creating tournament", error)
      setToast({ message: "No se pudo crear el torneo", type: "error" })
      setTimeout(() => setToast(null), 2200)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.message}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <header>
                <h2 className="text-lg font-semibold text-white">Informacion del torneo</h2>
                <p className="text-sm text-gray-400">Define los datos basicos del torneo hibrido (liga + repechaje).</p>
              </header>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Nombre del torneo
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => handleChange("name", e.target.value)}
                    className={`mt-1 w-full rounded-lg border bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${validation.name ? "border-red-500" : "border-gray-700"}`}
                    placeholder="Ej. Liga Elite FutSal"
                    maxLength={80}
                  />
                </label>
                {validation.name && <p className="text-xs text-red-400">{validation.name}</p>}

                <label className="block text-sm font-medium text-gray-300">
                  Descripcion
                  <textarea
                    value={form.description}
                    onChange={e => handleChange("description", e.target.value)}
                    className="mt-1 w-full min-h-[96px] rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe objetivos, requisitos y contexto del torneo"
                  />
                </label>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <header>
                <h2 className="text-lg font-semibold text-white">Cupos y visibilidad</h2>
                <p className="text-sm text-gray-400">Controla el numero de equipos participantes y la exposicion publica.</p>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-gray-300">
                  Maximo de equipos
                  <input
                    type="number"
                    value={form.maxTeams}
                    min={MIN_TEAMS}
                    max={MAX_TEAMS}
                    onChange={e => handleChange("maxTeams", Number(e.target.value))}
                    className={`mt-1 w-full rounded-lg border bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${validation.maxTeams ? "border-red-500" : "border-gray-700"}`}
                  />
                </label>
                {validation.maxTeams && <p className="text-xs text-red-400 md:col-span-2">{validation.maxTeams}</p>}

                <label className="flex items-center space-x-3 text-sm font-medium text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={e => handleChange("isPublic", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500"
                  />
                  <span>Publicar en el directorio de torneos</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <header>
                <h2 className="text-lg font-semibold text-white">Fechas clave</h2>
                <p className="text-sm text-gray-400">Programa las fechas tentativas para inscripciones y partidos.</p>
              </header>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm font-medium text-gray-300">
                  Inicio
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => handleChange("startDate", e.target.value)}
                    className={`mt-1 w-full rounded-lg border bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${validation.startDate ? "border-red-500" : "border-gray-700"}`}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-300">
                  Finalizacion
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => handleChange("endDate", e.target.value)}
                    className={`mt-1 w-full rounded-lg border bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${validation.endDate ? "border-red-500" : "border-gray-700"}`}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-300">
                  Cierre de inscripciones
                  <input
                    type="date"
                    value={form.registrationDeadline}
                    onChange={e => handleChange("registrationDeadline", e.target.value)}
                    className={`mt-1 w-full rounded-lg border bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${validation.registrationDeadline ? "border-red-500" : "border-gray-700"}`}
                  />
                </label>
              </div>

              {(validation.startDate || validation.endDate || validation.registrationDeadline) && (
                <p className="text-xs text-red-400">
                  {validation.startDate || validation.endDate || validation.registrationDeadline}
                </p>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <header>
                <h2 className="text-lg font-semibold text-white">Incentivos opcionales</h2>
                <p className="text-sm text-gray-400">Comunica premios o reconocimientos para motivar la participacion.</p>
              </header>

              <label className="block text-sm font-medium text-gray-300">
                Premios / reconocimientos
                <textarea
                  value={form.prizeDescription}
                  onChange={e => handleChange("prizeDescription", e.target.value)}
                  className="mt-1 w-full min-h-[72px] rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Describe trofeos, medallas o beneficios"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center space-x-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
                  submitting ? "bg-gray-700 text-gray-300" : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Crear en borrador</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-4">
            <header className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Reglas de clasificacion</h3>
            </header>
            <ul className="space-y-3 text-sm text-gray-300">
              {businessRules.map(rule => (
                <li key={rule} className="flex items-start space-x-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">
              Despues de la fase regular, el sistema genera automaticamente repechaje y cuartos basandose en la tabla final.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-4">
            <header className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Plan de post temporada</h3>
            </header>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span>Repechaje adaptativo para completar los 8 cupos.</span>
              </li>
              <li className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-green-400" />
                <span>Semillas directas protegidas para los mejores 6.</span>
              </li>
              <li className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-400" />
                <span>Define fechas de repechaje y cuartos al cerrar la fase regular.</span>
              </li>
              <li className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-green-400" />
                <span>Reporte en vivo de clasificados y eliminados.</span>
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import './App.css'

type Status = 'idle' | 'running' | 'paused' | 'done' | 'error'

interface DoseConfig {
  targetWeight: number
  tolerance: number
  flowRate: number
  material: string
}

interface DoseLog {
  id: number
  timestamp: string
  material: string
  targetWeight: number
  actualWeight: number
  deviation: number
  status: 'ok' | 'nok'
}

const MATERIALS = ['Zand', 'Cement', 'Kalk', 'Grind', 'Vliegas', 'Silicameel']

export default function App() {
  const [status, setStatus] = useState<Status>('idle')
  const [config, setConfig] = useState<DoseConfig>({
    targetWeight: 1000,
    tolerance: 5,
    flowRate: 200,
    material: 'Zand',
  })
  const [currentWeight, setCurrentWeight] = useState(0)
  const [logs, setLogs] = useState<DoseLog[]>([])
  const [doseCount, setDoseCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startWeightRef = useRef(0)

  const progress = Math.min((currentWeight / config.targetWeight) * 100, 100)

  const startDosing = () => {
    if (status === 'running') return
    setStatus('running')
    startWeightRef.current = currentWeight
  }

  const pauseDosing = () => {
    if (status === 'running') setStatus('paused')
    else if (status === 'paused') setStatus('running')
  }

  const stopDosing = () => {
    setStatus('idle')
    setCurrentWeight(0)
  }

  const resetDosing = () => {
    stopDosing()
    setLogs([])
    setDoseCount(0)
  }

  // Simulate weighing
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setCurrentWeight(prev => {
          const increment = (config.flowRate / 60) * 0.5 + (Math.random() - 0.5) * 2
          const next = prev + increment
          if (next >= config.targetWeight) {
            clearInterval(intervalRef.current!)
            const actual = next
            const deviation = ((actual - config.targetWeight) / config.targetWeight) * 100
            const ok = Math.abs(deviation) <= (config.tolerance / 100) * config.targetWeight
            const newLog: DoseLog = {
              id: Date.now(),
              timestamp: new Date().toLocaleTimeString('nl-BE'),
              material: config.material,
              targetWeight: config.targetWeight,
              actualWeight: Math.round(actual * 10) / 10,
              deviation: Math.round(deviation * 10) / 10,
              status: ok ? 'ok' : 'nok',
            }
            setLogs(prev => [newLog, ...prev.slice(0, 19)])
            setDoseCount(c => c + 1)
            setStatus('done')
            return config.targetWeight
          }
          return next
        })
      }, 500)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [status, config])

  const getStatusColor = () => {
    switch (status) {
      case 'running': return '#22c55e'
      case 'paused': return '#f59e0b'
      case 'done': return '#3b82f6'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'running': return '● DOSEREN'
      case 'paused': return '⏸ GEPAUZEERD'
      case 'done': return '✓ KLAAR'
      case 'error': return '✗ FOUT'
      default: return '○ STAND-BY'
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="logo">⚙</span>
          <div>
            <h1>BigBag Doseerstation</h1>
            <p className="subtitle">Industrieel doseersysteem v1.0</p>
          </div>
        </div>
        <div className="header-right">
          <span className="status-badge" style={{ backgroundColor: getStatusColor() }}>
            {getStatusLabel()}
          </span>
          <div className="dose-counter">
            <span className="count-label">Doses vandaag</span>
            <span className="count-value">{doseCount}</span>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Weight Display */}
        <section className="weight-panel">
          <div className="weight-display">
            <span className="weight-label">Huidig gewicht</span>
            <span className="weight-value">{Math.round(currentWeight * 10) / 10}</span>
            <span className="weight-unit">kg</span>
          </div>
          <div className="target-display">
            <span>Doel: <strong>{config.targetWeight} kg</strong></span>
            <span>Tolerantie: ±{config.tolerance} kg</span>
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  backgroundColor: progress >= 100 ? '#3b82f6' : '#22c55e'
                }}
              />
            </div>
            <span className="progress-label">{Math.round(progress)}%</span>
          </div>

          {/* Controls */}
          <div className="controls">
            <button
              className="btn btn-primary"
              onClick={startDosing}
              disabled={status === 'running' || status === 'done'}
            >
              ▶ START
            </button>
            <button
              className="btn btn-warning"
              onClick={pauseDosing}
              disabled={status === 'idle' || status === 'done'}
            >
              {status === 'paused' ? '▶ HERVAT' : '⏸ PAUZE'}
            </button>
            <button
              className="btn btn-danger"
              onClick={stopDosing}
              disabled={status === 'idle'}
            >
              ■ STOP
            </button>
            <button
              className="btn btn-secondary"
              onClick={resetDosing}
            >
              ↺ RESET
            </button>
          </div>
        </section>

        {/* Configuration */}
        <section className="config-panel">
          <h2>Instellingen</h2>
          <div className="form-grid">
            <label>
              Materiaal
              <select
                value={config.material}
                onChange={e => setConfig(c => ({ ...c, material: e.target.value }))}
                disabled={status === 'running'}
              >
                {MATERIALS.map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label>
              Doelgewicht (kg)
              <input
                type="number"
                value={config.targetWeight}
                min={1}
                max={5000}
                onChange={e => setConfig(c => ({ ...c, targetWeight: Number(e.target.value) }))}
                disabled={status === 'running'}
              />
            </label>
            <label>
              Tolerantie (kg)
              <input
                type="number"
                value={config.tolerance}
                min={0.1}
                max={100}
                step={0.1}
                onChange={e => setConfig(c => ({ ...c, tolerance: Number(e.target.value) }))}
                disabled={status === 'running'}
              />
            </label>
            <label>
              Doorvoer (kg/min)
              <input
                type="number"
                value={config.flowRate}
                min={10}
                max={2000}
                onChange={e => setConfig(c => ({ ...c, flowRate: Number(e.target.value) }))}
                disabled={status === 'running'}
              />
            </label>
          </div>
        </section>

        {/* Log */}
        <section className="log-panel">
          <h2>Doseerlog <span className="log-count">({logs.length})</span></h2>
          {logs.length === 0 ? (
            <div className="log-empty">Nog geen doses geregistreerd</div>
          ) : (
            <div className="log-table-wrapper">
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Tijd</th>
                    <th>Materiaal</th>
                    <th>Doel (kg)</th>
                    <th>Actueel (kg)</th>
                    <th>Afwijking (%)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className={log.status === 'ok' ? 'row-ok' : 'row-nok'}>
                      <td>{log.timestamp}</td>
                      <td>{log.material}</td>
                      <td>{log.targetWeight}</td>
                      <td>{log.actualWeight}</td>
                      <td>{log.deviation > 0 ? '+' : ''}{log.deviation}%</td>
                      <td>
                        <span className={`badge ${log.status === 'ok' ? 'badge-ok' : 'badge-nok'}`}>
                          {log.status === 'ok' ? '✓ OK' : '✗ NOK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import './dice.css'

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

type DiceRollerProps = {
  selectedDie: string
  result?: number | null
  onRoll: (die?: string) => void
  compact?: boolean
}

function playRollSound(enabled: boolean) {
  if (!enabled) return
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(130, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(54, context.currentTime + 0.18)
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.21)
  oscillator.addEventListener('ended', () => void context.close())
}

export function DiceRoller({ selectedDie, result, onRoll, compact = false }: DiceRollerProps) {
  const [rolling, setRolling] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])

  function roll(die = selectedDie) {
    if (rolling) return
    setRolling(true)
    playRollSound(soundEnabled)
    onRoll(die)
    timer.current = window.setTimeout(() => setRolling(false), 850)
  }

  return <div className={`dice-roller ${compact ? 'compact' : ''}`}>
    <div className={`dice-stage ${rolling ? 'is-rolling' : ''}`} aria-live="polite" aria-label={result ? `Resultado ${result} no ${selectedDie}` : `Dado ${selectedDie}`}>
      <div className="dice-cube">
        <span>{result ?? selectedDie.slice(1)}</span>
        <small>{selectedDie}</small>
      </div>
    </div>
    <div className="dice-actions">
      <button className="dice-roll-button" onClick={() => roll()} disabled={rolling}>Rolar {selectedDie} <span>↗</span></button>
      <button className={`sound-toggle ${soundEnabled ? 'enabled' : ''}`} onClick={() => setSoundEnabled((current) => !current)} aria-pressed={soundEnabled} title={soundEnabled ? 'Desativar som' : 'Ativar som'}>{soundEnabled ? '♫ Som' : 'Som desligado'}</button>
    </div>
  </div>
}

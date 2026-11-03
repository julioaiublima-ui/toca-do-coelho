import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import './dice.css'
import { ThreeDiceCanvas } from './ThreeDiceCanvas'

declare global {
  interface Window { webkitAudioContext?: typeof AudioContext }
}

type DiceRollerProps = {
  selectedDie: string
  result?: number | null
  results?: number[]
  winningValue?: number | null
  onRoll: (die?: string) => void
  compact?: boolean
  showActions?: boolean
  soundEnabled?: boolean
  onSoundEnabledChange?: (enabled: boolean) => void
}

type VisualDie = { id: number; value: number; x: number; delay: number; rotation: number }

function playTone(enabled: boolean, frequency: number, duration: number, volume = 0.06) {
  if (!enabled) return
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(frequency, context.currentTime)
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + duration)
  oscillator.addEventListener('ended', () => void context.close())
}

function playDiceImpact(enabled: boolean, final = false) {
  if (!enabled) return
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const duration = final ? 0.16 : 0.07
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let index = 0; index < data.length; index += 1) {
    const fade = 1 - index / data.length
    data[index] = (Math.random() * 2 - 1) * fade * fade
  }
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  source.buffer = buffer
  filter.type = 'bandpass'
  filter.frequency.value = final ? 760 : 1150 + Math.random() * 500
  filter.Q.value = 0.8
  gain.gain.setValueAtTime(final ? 0.22 : 0.1, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(context.destination)
  source.start()
  source.addEventListener('ended', () => void context.close())
}

function makeDice(results: number[] | undefined, sides: number): VisualDie[] {
  const values = results?.length ? results : [sides]
  const spacing = values.length === 1 ? 0 : Math.min(68, 78 / (values.length - 1))
  const start = values.length === 1 ? 50 : 50 - ((values.length - 1) * spacing) / 2
  return values.map((value, index) => ({ id: Date.now() + index, value, x: start + index * spacing, delay: index * 0.06, rotation: -18 + index * 13 }))
}

export function DiceRoller({ selectedDie, result, results, winningValue, onRoll, compact = false, showActions = true, soundEnabled: soundPreference, onSoundEnabledChange }: DiceRollerProps) {
  const [rolling, setRolling] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(soundPreference ?? true)
  const timer = useRef<number | undefined>(undefined)
  const collisionTimer = useRef<number | undefined>(undefined)
  const sides = Number(selectedDie.slice(1)) || 20
  useEffect(() => {
    if (soundPreference !== undefined) setSoundEnabled(soundPreference)
  }, [soundPreference])

  const dice = useMemo(() => makeDice(results, sides), [results, sides])

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
    if (collisionTimer.current) window.clearInterval(collisionTimer.current)
  }, [])

  function roll(die = selectedDie) {
    if (rolling) return
    setRolling(true)
    playTone(soundEnabled, 92, 0.2, 0.08)
    playDiceImpact(soundEnabled)
    collisionTimer.current = window.setInterval(() => {
      playTone(soundEnabled, 150 + Math.random() * 100, 0.06, 0.035)
      playDiceImpact(soundEnabled)
    }, 170)
    onRoll(die)
    timer.current = window.setTimeout(() => {
      setRolling(false)
      if (collisionTimer.current) window.clearInterval(collisionTimer.current)
      playTone(soundEnabled, 280, 0.08, 0.045)
      playDiceImpact(soundEnabled, true)
    }, 1200)
  }

  return <div className={`dice-roller ${compact ? 'compact' : ''}`}>
    <div className={`dice-stage ${rolling ? 'is-rolling' : ''}`} aria-live="polite" aria-label={result ? `Resultado ${result} no ${selectedDie}` : `Pool de ${selectedDie}`}>
      <div className="dice-floor" />
      {dice.length === 1 ? <ThreeDiceCanvas sides={sides} rolling={rolling} compact={compact} /> : dice.map((die) => <div key={die.id} className={`physics-die die-shape-${sides} ${rolling ? 'physics-rolling' : ''} ${winningValue !== null && winningValue !== undefined && die.value === winningValue ? 'candidate' : ''}`} style={{ left: `${die.x}%`, animationDelay: `${die.delay}s`, '--die-rotation': `${die.rotation}deg` } as CSSProperties}><div className="die-3d"><span className="die-face die-front">{die.value}</span><span className="die-face die-top">✦</span><span className="die-face die-side">{selectedDie}</span></div></div>)}
      {!dice.length && <div className="dice-empty">Aguardando rolagem</div>}
    </div>
    {showActions && <div className="dice-actions">
      <button className="dice-roll-button" onClick={() => roll()} disabled={rolling}>Rolar {selectedDie} <span>↗</span></button>
      <button className={`sound-toggle ${soundEnabled ? 'enabled' : ''}`} onClick={() => setSoundEnabled((current) => { const next = !current; onSoundEnabledChange?.(next); return next })} aria-pressed={soundEnabled}>{soundEnabled ? '♫ Som' : 'Som desligado'}</button>
    </div>}
  </div>
}

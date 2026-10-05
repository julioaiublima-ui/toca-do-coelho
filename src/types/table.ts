export type TableSessionStatus = 'waiting' | 'active' | 'paused' | 'ended'
export type TableScene = { id: string; label: string; title: string; description: string; clueCount: number }
export type TableCharacter = { id: number; name: string; player: string; role: string; level: string; hp: number; maxHp: number; color: string }
export type TableRoll = { id: number; actor: string; dice: string; total: number; at: string }
export type TableMessage = { id: number; author: string; kind: 'chat' | 'system' | 'master'; text: string; at: string }

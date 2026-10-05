import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { TableCharacter, TableMessage, TableRoll, TableScene, TableSessionStatus } from '../../types/table'
import './table.css'

type TableCampaign = { id: number; title: string; system: string; players: number; scene: string }
type TableRoomProps = { campaign: TableCampaign; characters: TableCharacter[]; onExit: () => void }

const scenes: TableScene[] = [
  { id: 'scene-01', label: 'CENA 01', title: 'Estação abandonada', description: 'A chuva apaga os últimos sons da cidade. No fim da plataforma, três batidas respondem ao eco.', clueCount: 3 },
  { id: 'scene-02', label: 'CENA 02', title: 'Corredor subterrâneo', description: 'O ar fica mais frio depois da porta de serviço. As paredes guardam marcas recentes.', clueCount: 2 },
  { id: 'scene-03', label: 'CENA 03', title: 'Sala de arquivos', description: 'Pastas sem identificação cobrem as estantes. Uma delas ainda está morna.', clueCount: 4 },
]
const seedMessages: TableMessage[] = [
  { id: 1, author: 'Sistema', kind: 'system', text: 'Evelyn Croft entrou na mesa.', at: '21:04' },
  { id: 2, author: 'Julio', kind: 'chat', text: 'Vou investigar a porta antes de chamar o resto da equipe.', at: '21:05' },
  { id: 3, author: 'Mestre', kind: 'master', text: 'A porta parece ter sido arrombada por dentro.', at: '21:06' },
]
const seedRolls: TableRoll[] = [{ id: 1, actor: 'Evelyn Croft', dice: 'd20', total: 17, at: '21:06' }]

export function TableRoom({ campaign, characters, onExit }: TableRoomProps) {
  const [status, setStatus] = useState<TableSessionStatus>('active')
  const [scene, setScene] = useState(scenes[0])
  const [messages, setMessages] = useState(seedMessages)
  const [rolls, setRolls] = useState(seedRolls)
  const [message, setMessage] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState<TableCharacter | null>(null)
  const [selectedDie, setSelectedDie] = useState('d20')

  useEffect(() => {
    window.history.replaceState({}, '', `/mesa/${campaign.id}`)
  }, [campaign.id])

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = message.trim()
    if (!text) return
    setMessages((current) => [...current, { id: Date.now(), author: 'Julio', kind: 'chat', text, at: currentTime() }])
    setMessage('')
  }

  function roll(dice = selectedDie, actor = 'Evelyn Croft') {
    const sides = Number(dice.slice(1)); const total = Math.floor(Math.random() * sides) + 1; const at = currentTime()
    setSelectedDie(dice)
    setRolls((current) => [{ id: Date.now(), actor, dice, total, at }, ...current].slice(0, 8))
    setMessages((current) => [...current, { id: Date.now() + 1, author: 'Sistema', kind: 'system', text: `${actor} rolou 1${dice} → ${total}`, at }])
  }

  return <div className="table-room"><TableHeader campaign={campaign} status={status} onStatus={setStatus} onExit={onExit} /><div className="table-layout"><aside className="table-left"><PlayerList characters={characters} selected={selectedCharacter} onSelect={setSelectedCharacter} /><TurnTracker /></aside><main className="scene-column"><SceneView scene={scene} scenes={scenes} onChange={setScene} status={status} /><DiceDock selectedDie={selectedDie} rolls={rolls} onRoll={roll} /><TableChat messages={messages} message={message} onMessage={setMessage} onSubmit={sendMessage} /></main><aside className="master-panel"><MasterPanel scene={scene} status={status} onStatus={setStatus} /><div className="master-mark"><img src="/logo-toca.png" alt="" /> <span>TOCA DO COELHO // MESA {String(campaign.id).padStart(2, '0')}</span></div></aside></div>{selectedCharacter && <CharacterQuickView character={selectedCharacter} onClose={() => setSelectedCharacter(null)} onRoll={() => roll('d20', selectedCharacter.name)} />}</div>
}

function TableHeader({ campaign, status, onStatus, onExit }: { campaign: TableCampaign; status: TableSessionStatus; onStatus: (status: TableSessionStatus) => void; onExit: () => void }) { const label = { waiting: 'Aguardando jogadores', active: 'Sessão ativa', paused: 'Sessão pausada', ended: 'Sessão encerrada' }[status]; return <header className="table-header"><div className="table-brand"><span className="table-logo">C</span><div><span className="table-kicker">SALA DA MESA // C.R.I.S.</span><strong>{campaign.title}</strong><small>{campaign.system} · {campaign.players} jogadores previstos</small></div></div><div className="table-status"><i className={`status-${status}`} /> {label}<button aria-label="Alterar status" onClick={() => onStatus(status === 'active' ? 'paused' : 'active')}>⌄</button></div><div className="table-header-actions"><span className="connected-count">● 3 online</span><button className="table-button ghost" onClick={() => navigator.clipboard?.writeText(window.location.href)}>⧉ Compartilhar</button><button className="table-button" onClick={onExit}>Sair da mesa</button></div></header> }
function SceneView({ scene, scenes: availableScenes, onChange, status }: { scene: TableScene; scenes: TableScene[]; onChange: (scene: TableScene) => void; status: TableSessionStatus }) { return <section className="scene-view"><div className="scene-toolbar"><div><span className="table-kicker">{scene.label} // CENA ATUAL</span><h1>{scene.title}</h1><p>{scene.description}</p></div><span className={`session-badge ${status}`}>{status === 'active' ? 'EM ANDAMENTO' : status.toUpperCase()}</span></div><div className="scene-map"><div className="map-grid" /><div className="map-location location-one">PLATAFORMA<br /><b>01</b></div><div className="map-location location-two">PORTA DE SERVIÇO<br /><b>?</b></div><div className="map-pin">⌖</div><span className="map-note">SINAL DETECTADO<br />há 04 min</span></div><div className="scene-selector">{availableScenes.map((item) => <button key={item.id} className={item.id === scene.id ? 'selected' : ''} onClick={() => onChange(item)}><span>{item.label}</span><strong>{item.title}</strong><small>{item.clueCount} pistas catalogadas</small></button>)}</div></section> }
function PlayerList({ characters, selected, onSelect }: { characters: TableCharacter[]; selected: TableCharacter | null; onSelect: (character: TableCharacter) => void }) { return <section className="table-panel player-panel"><PanelHeading code="MESA // AGENTES" title="Jogadores" count={`${characters.length + 1} online`} />{characters.length ? characters.map((character) => <button key={character.id} className={`table-player ${selected?.id === character.id ? 'selected' : ''}`} onClick={() => onSelect(character)}><span className={`player-avatar ${character.color}`}>{character.name.slice(0, 2).toUpperCase()}</span><span><strong>{character.name}</strong><small>{character.level} · {character.role}</small><em>PV {character.hp}/{character.maxHp} · SAN 40/40</em></span><i>●</i></button>) : <EmptyState text="Nenhum personagem conectado." />}</section> }
function MasterPanel({ scene, status, onStatus }: { scene: TableScene; status: TableSessionStatus; onStatus: (status: TableSessionStatus) => void }) { return <section className="table-panel master-info"><PanelHeading code="PAINEL DO MESTRE" title="Controle da sessão" /><div className="master-fact"><span>CENA ATUAL</span><strong>{scene.title}</strong></div><div className="master-fact"><span>OBJETIVO</span><strong>Encontrar a origem das batidas.</strong></div><div className="master-fact split"><div><span>PISTAS</span><strong>{scene.clueCount} descobertas</strong></div><div><span>NPCS</span><strong>2 ativos</strong></div></div><div className="master-actions"><button className={status === 'paused' ? 'active' : ''} onClick={() => onStatus(status === 'paused' ? 'active' : 'paused')}>{status === 'paused' ? '▶ Retomar sessão' : 'Ⅱ Pausar sessão'}</button><button>＋ Adicionar nota</button></div></section> }
function TurnTracker() { return <section className="table-panel turn-panel"><PanelHeading code="ORDEM DE TURNO" title="Turno atual" /><div className="turn active"><span>01</span><strong>Evelyn Croft</strong><small>Investigadora</small></div><div className="turn"><span>02</span><strong>Membro da equipe</strong><small>Próximo</small></div><div className="turn"><span>03</span><strong>???</strong><small>Criatura desconhecida</small></div></section> }
function DiceDock({ selectedDie, rolls, onRoll }: { selectedDie: string; rolls: TableRoll[]; onRoll: (dice?: string) => void }) { return <section className="dice-dock"><div className="dock-heading"><span className="table-kicker">DADOS DA MESA</span><strong>Rolagem rápida</strong></div><div className="dock-controls">{['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map((die) => <button key={die} className={selectedDie === die ? 'selected' : ''} onClick={() => onRoll(die)}>{die}</button>)}<button className="roll-action" onClick={() => onRoll(selectedDie)}>Rolar ↗</button></div><div className="table-rolls">{rolls.slice(0, 3).map((roll) => <div key={roll.id}><span>{roll.actor}</span><strong>1{roll.dice} <b>→ {roll.total}</b></strong><small>{roll.at}</small></div>)}</div></section> }
function TableChat({ messages, message, onMessage, onSubmit }: { messages: TableMessage[]; message: string; onMessage: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <section className="table-chat"><PanelHeading code="REGISTRO DA MESA" title="Chat" /><div className="chat-log">{messages.map((entry) => <div className={`chat-line ${entry.kind}`} key={entry.id}><span>{entry.author}</span><p>{entry.text}</p><small>{entry.at}</small></div>)}</div><form className="chat-form" onSubmit={onSubmit}><input value={message} onChange={(event) => onMessage(event.target.value)} placeholder="Registrar uma mensagem..." aria-label="Mensagem para a mesa" /><button aria-label="Enviar mensagem">↗</button></form></section> }
function CharacterQuickView({ character, onClose, onRoll }: { character: TableCharacter; onClose: () => void; onRoll: () => void }) { return <aside className="character-quickview" aria-label={`Resumo de ${character.name}`}><button className="quick-close" onClick={onClose} aria-label="Fechar resumo">×</button><span className="table-kicker">FICHA RÁPIDA // REG-{character.id}</span><div className={`quick-avatar ${character.color}`}>{character.name.slice(0, 2).toUpperCase()}</div><h2>{character.name}</h2><p>{character.role} · {character.level}</p><div className="quick-resources"><span>PV <b>{character.hp}/{character.maxHp}</b></span><span>PE <b>18/30</b></span><span>SAN <b>40/40</b></span></div><div className="quick-condition"><span>CONDIÇÕES</span><strong>Nenhuma condição ativa</strong></div><div className="quick-actions"><button onClick={onRoll}>◇ Rolar d20</button><button>Ver ficha completa ↗</button></div></aside> }
function PanelHeading({ code, title, count }: { code: string; title: string; count?: string }) { return <header className="table-panel-heading"><div><span className="table-kicker">{code}</span><h2>{title}</h2></div>{count && <small>{count}</small>}</header> }
function EmptyState({ text }: { text: string }) { return <div className="table-empty">◌<span>{text}</span></div> }
function currentTime() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }

export default TableRoom

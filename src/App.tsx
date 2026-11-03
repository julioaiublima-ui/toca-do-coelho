import { useMemo, useState } from 'react'
import './App.css'
import './sheet.css'
import './sheet-edit.css'
import './landing.css'
import './theme.css'
import './upgrade.css'
import './dossier.css'
import { TableRoom } from './components/table/TableRoom'
import { DiceRoller } from './components/dice/DiceRoller'

type View = 'home' | 'overview' | 'campaigns' | 'characters' | 'sheet' | 'dice' | 'library' | 'table'
type SystemName = 'Ordem Paranormal' | 'D&D 5e' | 'Tormenta20' | 'Sistema próprio'
type Campaign = { id: number; title: string; system: SystemName; players: number; scene: string; color: string; updated: string }
type Character = { id: number; name: string; player: string; role: string; system: SystemName; level: string; hp: number; maxHp: number; color: string }
type RollRecord = { id: number; formula: string; total: number; values: number[]; detail: string; at: string }

const systems: { name: SystemName; mark: string; note: string }[] = [
  { name: 'Ordem Paranormal', mark: 'OP', note: 'Investigação e horror' },
  { name: 'D&D 5e', mark: 'D&D', note: 'Fantasia e aventura' },
  { name: 'Tormenta20', mark: 'T20', note: 'Ação e alta fantasia' },
  { name: 'Sistema próprio', mark: '∞', note: 'Do seu jeito' },
]

const seedCampaigns: Campaign[] = [
  { id: 1, title: 'O véu entre nós', system: 'Ordem Paranormal', players: 4, scene: 'A estação abandonada', color: 'moss', updated: 'há 12 min' },
  { id: 2, title: 'As lanternas de Arvandor', system: 'D&D 5e', players: 6, scene: 'Floresta de Nyr', color: 'coral', updated: 'ontem' },
  { id: 3, title: 'Maré de aço', system: 'Tormenta20', players: 3, scene: 'Porto de Valkaria', color: 'gold', updated: 'há 3 dias' },
]

const seedCharacters: Character[] = [
  { id: 1, name: 'Evelyn Croft', player: 'Julio Colares', role: 'Investigadora', system: 'Ordem Paranormal', level: 'NEX 35%', hp: 32, maxHp: 42, color: 'rose' },
  { id: 2, name: 'Milo Pé-ligeiro', player: 'Ana Clara', role: 'Ladino', system: 'D&D 5e', level: 'Nível 4', hp: 27, maxHp: 31, color: 'blue' },
  { id: 3, name: 'Kael de Valkaria', player: 'Rafa Lima', role: 'Guerreiro', system: 'Tormenta20', level: 'Nível 6', hp: 48, maxHp: 58, color: 'amber' },
]

const navItems: { id: View; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visão geral', icon: '⌂' },
  { id: 'campaigns', label: 'Campanhas', icon: '◫' },
  { id: 'characters', label: 'Minhas fichas', icon: '♙' },
  { id: 'dice', label: 'Rolagem rápida', icon: '◈' },
  { id: 'library', label: 'Biblioteca', icon: '▤' },
  { id: 'table', label: 'Sala da mesa', icon: '◉' },
]

function secureRandomInt(maxExclusive: number) {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.getRandomValues || maxExclusive <= 0) return Math.floor(Math.random() * maxExclusive)
  const range = 0x100000000
  const limit = range - (range % maxExclusive)
  const buffer = new Uint32Array(1)
  do cryptoApi.getRandomValues(buffer)
  while (buffer[0] >= limit)
  return buffer[0] % maxExclusive
}

function App() {
  const [view, setView] = useState<View>(() => window.location.pathname.startsWith('/mesa/') ? 'table' : 'home')
  const [campaigns, setCampaigns] = useState(seedCampaigns)
  const [characters, setCharacters] = useState(seedCharacters)
  const [activeCampaign, setActiveCampaign] = useState(seedCampaigns[0])
  const [selectedCharacter, setSelectedCharacter] = useState(seedCharacters[0])
  const [showCreate, setShowCreate] = useState(false)
  const [createType, setCreateType] = useState<'campaign' | 'character'>('campaign')
  const [roll, setRoll] = useState<{ total: number; dice: string; values: number[]; detail: string } | null>(null)
  const [selectedDie, setSelectedDie] = useState('d20')
  const [rollHistory, setRollHistory] = useState<RollRecord[]>([])
  const greeting = useMemo(() => new Date().getHours() < 12 ? 'Bom dia' : 'Boa tarde', [])

  function openCreate(type: 'campaign' | 'character') { setCreateType(type); setShowCreate(true) }
  function addRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (createType === 'campaign') {
      const item: Campaign = { id: Date.now(), title: String(data.get('name')), system: data.get('system') as SystemName, players: 0, scene: 'Uma nova aventura começa', color: 'moss', updated: 'agora' }
      setCampaigns((current) => [item, ...current]); setActiveCampaign(item)
    } else setCharacters((current) => [{ id: Date.now(), name: String(data.get('name')), player: 'Você', role: 'Aventureiro', system: data.get('system') as SystemName, level: 'Nível 1', hp: 10, maxHp: 10, color: 'blue' }, ...current])
    setShowCreate(false)
  }
  function rollDice(formula = selectedDie) {
    const match = formula.toLowerCase().replace(/\s/g, '').match(/^(\d+)?d(\d+)(k([hl])(\d+))?([+-]\d+)?$/)
    if (!match) return
    const requestedCount = Number(match[1] || 1)
    const count = Math.min(requestedCount === 0 ? 2 : requestedCount, 100)
    const sides = Number(match[2])
    const keepMode = requestedCount === 0 ? 'l' : match[4]
    const keepCount = requestedCount === 0 ? 1 : Math.min(Number(match[5] || count), count)
    const modifier = Number(match[6] || 0)
    const values = Array.from({ length: count }, () => secureRandomInt(sides) + 1)
    const kept = keepMode === 'h'
      ? [...values].sort((a, b) => b - a).slice(0, keepCount)
      : keepMode === 'l'
        ? [...values].sort((a, b) => a - b).slice(0, keepCount)
        : [Math.max(...values)]
    const total = (keepMode && keepCount > 1 ? kept.reduce((sum, value) => sum + value, 0) : kept[0]) + modifier
    const normalized = formula.toLowerCase().replace(/\s/g, '')
    const detail = `${values.join(' + ')}${modifier ? ` ${modifier > 0 ? '+' : '−'} ${Math.abs(modifier)}` : ''}`
    setSelectedDie(normalized.match(/d\d+/)?.[0] || selectedDie)
    setRoll({ total, dice: normalized, values, detail })
    setRollHistory((current) => [{ id: Date.now(), formula: normalized, total, values, detail, at: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }, ...current].slice(0, 12))
  }

  if (view === 'home') return <Landing onEnter={() => setView('overview')} onCreate={() => openCreate('character')} />

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="rabbit-mark"><img src={`${import.meta.env.BASE_URL}logo-toca.png`} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /><span>⌁</span></div><div><strong>toca</strong><small>COELHO RPG</small></div></div>
      <button className="campaign-picker"><span className="campaign-dot" /><div><small>CAMPANHA ATIVA</small><strong>{activeCampaign.title}</strong></div><b>⌄</b></button>
      <nav className="main-nav">{navItems.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{item.id === 'dice' && <i>⌘ R</i>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="new-button" onClick={() => openCreate('campaign')}><span>＋</span> Nova campanha</button><div className="user-row"><div className="user-avatar">JC</div><div><strong>Julio Colares</strong><small>Plano gratuito · ilimitado</small></div><span>•••</span></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumbs"><span>TOCA /</span><strong>{navItems.find((item) => item.id === view)?.label}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Buscar">⌕</button><button className="icon-button notification" aria-label="Notificações">♧<i /></button><button className="profile-chip"><span className="status-dot" /> Mesa online <b>⌄</b></button></div></header>
      <div className="content-wrap">
        {view === 'overview' && <Overview greeting={greeting} campaigns={campaigns} characters={characters} activeCampaign={activeCampaign} setActiveCampaign={setActiveCampaign} setView={setView} openCreate={openCreate} rollDice={rollDice} />}
        {view === 'campaigns' && <Collection title="Campanhas" kicker="SEU UNIVERSO" description="Toda aventura começa com uma página em branco." action="Nova campanha" onAction={() => openCreate('campaign')}><div className="campaign-grid">{campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} active={campaign.id === activeCampaign.id} onClick={() => setActiveCampaign(campaign)} />)}<button className="create-tile" onClick={() => openCreate('campaign')}><span>＋</span><strong>Criar campanha</strong><small>Comece uma nova história</small></button></div></Collection>}
        {view === 'characters' && <CharacterLibrary characters={characters} onCreate={() => openCreate('character')} onOpen={(character) => { setSelectedCharacter(character); setView('sheet') }} />}
        {view === 'sheet' && <div className="sheet-shell"><InteractiveCharacterSheet character={selectedCharacter} onBack={() => setView('characters')} onRoll={() => rollDice('d20')} /></div>}
        {view === 'dice' && <DiceRoom selectedDie={selectedDie} roll={roll} history={rollHistory} onRoll={rollDice} onClear={() => setRollHistory([])} />}
        {view === 'library' && <Library />}
        {view === 'table' && <TableRoom campaign={activeCampaign} characters={characters} onExit={() => { window.history.replaceState({}, '', '/'); setView('campaigns') }} />}
      </div>
    </main>
    {showCreate && <div className="modal-backdrop" onMouseDown={() => setShowCreate(false)}><form className="modal" onSubmit={addRecord} onMouseDown={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowCreate(false)}>×</button><span className="eyebrow">{createType === 'campaign' ? 'NOVA HISTÓRIA' : 'NOVA FICHA'}</span><h2>{createType === 'campaign' ? 'Onde vamos hoje?' : 'Quem entra na toca?'}</h2><p>Você pode criar quantas {createType === 'campaign' ? 'campanhas' : 'fichas'} quiser.</p><label>Nome<input name="name" autoFocus required placeholder={createType === 'campaign' ? 'Ex: A cidade sob a chuva' : 'Ex: Lia Luar'} /></label><label>Sistema<select name="system" defaultValue="Ordem Paranormal">{systems.map((system) => <option key={system.name}>{system.name}</option>)}</select></label><button className="submit-button">Criar agora <span>→</span></button></form></div>}
  </div>
}

function Overview({ greeting, campaigns, characters, activeCampaign, setActiveCampaign, setView, openCreate, rollDice }: { greeting: string; campaigns: Campaign[]; characters: Character[]; activeCampaign: Campaign; setActiveCampaign: (campaign: Campaign) => void; setView: (view: View) => void; openCreate: (type: 'campaign' | 'character') => void; rollDice: (dice?: string) => void }) {
  return <><div className="hero-heading"><div><span className="eyebrow">{greeting}, Julio <span className="spark">✦</span></span><h1>Que história<br /><em>vamos contar?</em></h1><p>Seu espaço para criar mundos, reunir a mesa<br className="desktop-only" /> e deixar a imaginação correr solta.</p></div><div className="hero-badge"><span>✦</span><strong>SEM LIMITE</strong><small>fichas e campanhas</small></div></div><section className="dashboard-grid"><article className="feature-card"><div className="feature-art"><span className="moon">☾</span><span className="rabbit">♞</span><span className="grass">⌇⌇⌇</span></div><div className="feature-copy"><span className="eyebrow">CONTINUAR AVENTURA</span><h2>{activeCampaign.title}</h2><p>{activeCampaign.system} <span>·</span> {activeCampaign.players} jogadores</p><div className="progress-label"><span>Próxima sessão</span><strong>Capítulo 03 <b>→</b></strong></div><div className="progress"><i /></div><button onClick={() => setView('campaigns')}>Entrar na campanha <span>↗</span></button></div></article><div className="side-stack"><article className="quick-roll"><div><span className="eyebrow">ROLAGEM RÁPIDA</span><h3>Precisa decidir<br /><em>agora?</em></h3></div><button className="die-button" onClick={() => rollDice('d20')}><span>20</span><small>d20</small></button><button className="roll-link" onClick={() => setView('dice')}>Abrir dados <span>→</span></button></article><article className="stats-card"><div><span className="eyebrow">SEU ARQUIVO</span><strong>{characters.length}</strong><small>fichas criadas</small></div><div className="stat-divider" /><div><strong>{campaigns.length}</strong><small>campanhas ativas</small></div><button onClick={() => openCreate('character')}>＋ Nova ficha</button></article></div></section><section className="lower-section"><div className="section-title"><div><span className="eyebrow">ACESSO RECENTE</span><h2>Suas campanhas</h2></div><button onClick={() => setView('campaigns')}>Ver todas <span>→</span></button></div><div className="mini-campaigns">{campaigns.slice(0, 3).map((campaign) => <button key={campaign.id} className={`mini-card ${campaign.id === activeCampaign.id ? 'selected' : ''}`} onClick={() => setActiveCampaign(campaign)}><span className={`mini-art ${campaign.color}`}>{campaign.system === 'D&D 5e' ? '♢' : campaign.system === 'Tormenta20' ? '⚔' : '☾'}</span><div><strong>{campaign.title}</strong><small>{campaign.system} <span>·</span> {campaign.updated}</small></div><span className="arrow">↗</span></button>)}</div></section></>
}

function Collection({ title, kicker, description, action, onAction, children }: { title: string; kicker: string; description: string; action: string; onAction: () => void; children: React.ReactNode }) { return <><div className="page-heading"><div><span className="eyebrow">{kicker}</span><h1>{title}<em>.</em></h1><p>{description}</p></div><button className="submit-button compact" onClick={onAction}>＋ {action}</button></div>{children}</> }
function CampaignCard({ campaign, active, onClick }: { campaign: Campaign; active: boolean; onClick: () => void }) { return <button className={`campaign-card ${active ? 'active' : ''}`} onClick={onClick}><div className={`campaign-art ${campaign.color}`}><span>{campaign.system === 'D&D 5e' ? '♢' : campaign.system === 'Tormenta20' ? '⚔' : '☾'}</span><small>{campaign.system}</small></div><div className="campaign-card-body"><div><span className="eyebrow">{campaign.updated}</span><h3>{campaign.title}</h3></div><p>{campaign.scene}</p><footer><span>♙ {campaign.players} jogadores</span><b>↗</b></footer></div></button> }
function CharacterRow({ character, onOpen }: { character: Character; onOpen: () => void }) { return <button className="character-row" onClick={onOpen}><div className={`character-avatar ${character.color}`}>{character.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</div><div className="character-info"><span className="eyebrow">{character.system}</span><h3>{character.name}</h3><p>{character.role} <span>·</span> {character.level}</p></div><div className="hp-block"><span>PV</span><strong>{character.hp}<small> / {character.maxHp}</small></strong><div className="hp-bar"><i style={{ width: `${character.hp / character.maxHp * 100}%` }} /></div></div><span className="row-chevron">↗</span></button> }

function CharacterLibrary({ characters, onCreate, onOpen }: { characters: Character[]; onCreate: () => void; onOpen: (character: Character) => void }) {
  const [query, setQuery] = useState('')
  const filtered = characters.filter((character) => `${character.name} ${character.player} ${character.role} ${character.system}`.toLowerCase().includes(query.toLowerCase()))
  return <section className="character-library"><Collection title="Minhas fichas" kicker="ARQUIVO DE PERSONAGENS" description="Busque, abra e organize os agentes da sua mesa." action="Nova ficha" onAction={onCreate}><div className="library-toolbar"><label className="library-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, jogador ou sistema" aria-label="Buscar fichas" /></label><span>{filtered.length} de {characters.length} registros</span></div>{filtered.length ? <div className="character-list">{filtered.map((character) => <CharacterRow key={character.id} character={character} onOpen={() => onOpen(character)} />)}</div> : <div className="library-empty"><strong>Nenhum registro encontrado</strong><span>Tente outro nome, jogador ou sistema.</span></div>}</Collection></section>
}

function SheetTabs({ activeTab, onChange }: { activeTab: string; onChange: (tab: string) => void }) { return <nav className="sheet-tabs" aria-label="Seções da ficha">{['RESUMO', 'ATRIBUTOS', 'PERÍCIAS', 'INVENTÁRIO', 'COMBATE', 'HABILIDADES', 'RITUAIS', 'CONDIÇÕES', 'HISTÓRICO', 'BIOGRAFIA', 'ANOTAÇÕES', 'CENA ATUAL'].map((tab) => <button key={tab} className={`sheet-tab tab-${tab.toLowerCase().replaceAll('í', 'i').replaceAll(' ', '-')} ${activeTab === tab ? 'active' : ''}`} onClick={() => onChange(tab)}>{tab}</button>)}</nav> }

function InteractiveCharacterSheet({ character, onBack, onRoll }: { character: Character; onBack: () => void; onRoll: () => void }) { const [activeTab, setActiveTab] = useState('RESUMO'); const [mode, setMode] = useState<'jogador' | 'arquivo'>('jogador'); const extendedTabs = ['RITUAIS', 'CONDIÇÕES', 'HISTÓRICO', 'BIOGRAFIA', 'ANOTAÇÕES', 'CENA ATUAL']; return <div className={`interactive-sheet dossier-mode-${mode}`}><div className="sheet-mode-switch" role="group" aria-label="Modo de visualização"><span>VISUALIZAÇÃO</span><button className={mode === 'jogador' ? 'active' : ''} onClick={() => setMode('jogador')}>Modo Jogador</button><button className={mode === 'arquivo' ? 'active' : ''} onClick={() => setMode('arquivo')}>Modo Arquivo</button></div><SheetTabs activeTab={activeTab} onChange={setActiveTab} /><div className="sheet-tab-content" key={activeTab}>{activeTab === 'RESUMO' ? <CharacterSheet character={character} onBack={onBack} onRoll={onRoll} /> : activeTab === 'PERÍCIAS' ? <SkillsSection /> : extendedTabs.includes(activeTab) ? <DossierSection tab={activeTab} /> : <SheetSection tab={activeTab} onRoll={onRoll} />}</div></div> }

type SkillRow = { name: string; attribute: string; training: number; others: number }

function SkillsSection() {
  const [skills, setSkills] = useState<SkillRow[]>([
    { name: 'Acrobacia', attribute: 'AGI', training: 0, others: 0 },
    { name: 'Adestramento', attribute: 'PRE', training: 0, others: 0 },
    { name: 'Artes', attribute: 'PRE', training: 0, others: 0 },
    { name: 'Atletismo', attribute: 'FOR', training: 5, others: 0 },
    { name: 'Atualidades', attribute: 'INT', training: 0, others: 0 },
    { name: 'Ciências', attribute: 'INT', training: 0, others: 0 },
    { name: 'Crime', attribute: 'AGI', training: 5, others: 0 },
    { name: 'Diplomacia', attribute: 'PRE', training: 0, others: 0 },
    { name: 'Enganação', attribute: 'PRE', training: 0, others: 0 },
    { name: 'Fortitude', attribute: 'VIG', training: 5, others: 0 },
    { name: 'Furtividade', attribute: 'AGI', training: 5, others: 0 },
    { name: 'Iniciativa', attribute: 'AGI', training: 10, others: 0 },
    { name: 'Intimidação', attribute: 'PRE', training: 0, others: 0 },
    { name: 'Intuição', attribute: 'PRE', training: 5, others: 0 },
    { name: 'Investigação', attribute: 'INT', training: 10, others: 0 },
    { name: 'Luta', attribute: 'FOR', training: 5, others: 0 },
    { name: 'Medicina', attribute: 'INT', training: 0, others: 0 },
    { name: 'Ocultismo', attribute: 'INT', training: 0, others: 0 },
    { name: 'Percepção', attribute: 'PRE', training: 10, others: 0 },
    { name: 'Pilotagem', attribute: 'AGI', training: 0, others: 0 },
    { name: 'Pontaria', attribute: 'AGI', training: 10, others: 0 },
    { name: 'Profissão', attribute: 'INT', training: 0, others: 0 },
    { name: 'Reflexos', attribute: 'AGI', training: 5, others: 0 },
    { name: 'Religião', attribute: 'PRE', training: 0, others: 0 },
    { name: 'Sobrevivência', attribute: 'INT', training: 0, others: 0 },
    { name: 'Tática', attribute: 'INT', training: 5, others: 0 },
    { name: 'Tecnologia', attribute: 'INT', training: 0, others: 0 },
    { name: 'Vontade', attribute: 'PRE', training: 5, others: 0 },
  ])
  function updateSkill(index: number, field: 'training' | 'others', value: string) {
    const nextValue = Math.max(0, Number(value) || 0)
    setSkills((current) => current.map((skill, skillIndex) => skillIndex === index ? { ...skill, [field]: nextValue } : skill))
  }
  return <section className="skills-sheet-panel"><header><div><span className="eyebrow">COMPETÊNCIAS DO AGENTE</span><h2>Perícias</h2></div><span className="skills-count">{skills.length} REGISTROS</span></header><div className="skills-table-wrap"><table className="skills-table"><thead><tr><th>Perícia</th><th>Atributo</th><th>Bônus</th><th>Treino</th><th>Outros</th></tr></thead><tbody>{skills.map((skill, index) => { const bonus = skill.training + skill.others; return <tr key={skill.name}><td>{skill.name}</td><td><span className="attribute-code">{skill.attribute}</span></td><td><strong>{bonus > 0 ? `+${bonus}` : '+0'}</strong></td><td><input type="number" min="0" step="1" value={skill.training} onChange={(event) => updateSkill(index, 'training', event.target.value)} aria-label={`Treino de ${skill.name}`} /></td><td><input type="number" min="0" step="1" value={skill.others} onChange={(event) => updateSkill(index, 'others', event.target.value)} aria-label={`Outros bônus de ${skill.name}`} /></td></tr> })}</tbody></table></div><small className="skills-footnote">* Use os campos de treino e outros para ajustar cada perícia de 1 em 1.</small></section>
}

function DossierSection({ tab }: { tab: string }) { const content: Record<string, { title: string; eyebrow: string; body: React.ReactNode }> = { RITUAIS: { title: 'Rituais', eyebrow: 'CONHECIMENTOS DO OUTRO LADO', body: <div className="dossier-record-list"><article><strong>Ouvir os sussurros</strong><span>1º círculo · Conhecimento</span><p>Escute os últimos sons deixados em uma superfície.</p></article><article><strong>Marca do outro lado</strong><span>2º círculo · Medo</span><p>Uma presença percebe você quando o ritual termina.</p></article></div> }, CONDIÇÕES: { title: 'Condições', eyebrow: 'ESTADO OPERACIONAL', body: <div className="condition-grid">{['Normal', 'Machucado', 'Abalado', 'Exausto', 'Vulnerável'].map((condition) => <button key={condition}>{condition}<span>○</span></button>)}</div> }, HISTÓRICO: { title: 'Histórico', eyebrow: 'LINHA DO TEMPO DO CASO', body: <div className="timeline"><p><time>22/09</time> encontrou uma pista na estação abandonada</p><p><time>22/09</time> realizou uma rolagem de Investigação</p><p><time>23/09</time> recebeu um item da equipe</p></div> }, BIOGRAFIA: { title: 'Biografia', eyebrow: 'HISTÓRICO DO AGENTE', body: <div className="biography-grid"><label>Origem<textarea defaultValue="Evelyn cresceu ouvindo histórias sobre lugares que não aparecem nos mapas." /></label><label>Personalidade<textarea placeholder="Como o agente reage quando o medo encontra a razão?" /></label><label>Objetivos<textarea placeholder="O que ainda mantém este agente em campo?" /></label><label>Vínculos e segredos<textarea placeholder="Informações privadas ou relações importantes." /></label></div> }, ANOTAÇÕES: { title: 'Anotações', eyebrow: 'REGISTRO PRIVADO', body: <textarea className="dossier-notes" placeholder="Escreva pistas, suspeitas e lembretes da próxima sessão..." /> }, 'CENA ATUAL': { title: 'Cena atual', eyebrow: 'POSIÇÃO DO AGENTE', body: <div className="current-scene"><span>O VÉU ENTRE NÓS</span><strong>A estação abandonada</strong><p>O grupo está diante da porta que não aparece em nenhum mapa.</p><small>4 agentes · sessão em andamento</small></div> } }; const section = content[tab]; return <section className="sheet-section-panel dossier-section"><span className="eyebrow">{section.eyebrow}</span><h2>{section.title}</h2>{section.body}</section> }

function SheetSection({ tab, onRoll }: { tab: string; onRoll: () => void }) { const attributes = [['FOR', 1], ['AGI', 3], ['INT', 3], ['PRE', 2], ['VIG', 1]]; const skills = [['Investigação', '+10', 'INT'], ['Percepção', '+10', 'PRE'], ['Reflexos', '+8', 'AGI'], ['Vontade', '+8', 'PRE'], ['Tecnologia', '+5', 'INT']]; if (tab === 'ATRIBUTOS') return <section className="sheet-section-panel"><span className="eyebrow">CARACTERÍSTICAS DO AGENTE</span><h2>Atributos</h2><div className="attribute-grid standalone">{attributes.map(([name, value]) => <div className="attribute" key={name}><span>{name}</span><strong>{value}</strong><small>{Number(value) >= 3 ? '+5' : '+1'}</small></div>)}</div></section>; if (tab === 'PERÍCIAS') return <section className="sheet-section-panel"><span className="eyebrow">COMPETÊNCIAS CATALOGADAS</span><h2>Perícias treinadas</h2><div className="skills-grid standalone-skills">{skills.map(([name, value, attr]) => <div className="skill" key={name}><span>{name}<small>{attr} · treinada</small></span><strong>{value}</strong></div>)}</div></section>; if (tab === 'INVENTÁRIO') return <section className="sheet-section-panel"><span className="eyebrow">OBJETOS REGISTRADOS</span><h2>Inventário</h2><div className="inventory inventory-expanded"><div><span className="item-symbol">⌁</span><strong>Pistola do investigador</strong><small>Arma · 1d12 · 1 espaço</small></div><div><span className="item-symbol">◇</span><strong>Kit de perícia</strong><small>Equipamento · 2 espaços</small></div><button className="submit-button compact">＋ Adicionar item</button></div></section>; if (tab === 'COMBATE') return <section className="sheet-section-panel"><span className="eyebrow">PROTOCOLO DE CONFRONTO</span><h2>Combate</h2><div className="combat-grid"><div><span>DEFESA</span><strong>15</strong></div><div><span>ESQUIVA</span><strong>18</strong></div><div><span>FORTITUDE</span><strong>11</strong></div><div><span>REFLEXOS</span><strong>13</strong></div></div><button className="sheet-roll" onClick={onRoll}>◈ Rolar iniciativa</button></section>; return <section className="sheet-section-panel"><span className="eyebrow">ARQUIVO EM EXPANSÃO</span><h2>{tab === 'HABILIDADES' ? 'Habilidades' : 'Histórico'}</h2><div className="sheet-empty-state"><span>◌</span><p>Esta seção está pronta para receber novos registros na próxima etapa do arquivo.</p><button className="button-like">Adicionar registro</button></div></section> }

function CharacterSheet({ character, onBack, onRoll }: { character: Character; onBack: () => void; onRoll: () => void }) {
  const [nex, setNex] = useState(character.level.replace('NEX ', ''))
  const [attributes, setAttributes] = useState({ AGI: 3, FOR: 1, INT: 3, PRE: 2, VIG: 1 })
  const skills = [['Acrobacia', '+0'], ['Adestramento', '+0'], ['Artes', '+0'], ['Atletismo', '+5'], ['Atualidades', '+0'], ['Ciências', '+0'], ['Crime', '+5'], ['Diplomacia', '+0'], ['Enganação', '+0'], ['Fortitude', '+5'], ['Furtividade', '+5'], ['Iniciativa', '+10'], ['Intimidação', '+0'], ['Intuição', '+5'], ['Investigação', '+10'], ['Luta', '+5'], ['Medicina', '+0'], ['Ocultismo', '+0'], ['Percepção', '+10'], ['Pilotagem', '+0'], ['Pontaria', '+10'], ['Profissão', '+0'], ['Reflexos', '+5'], ['Religião', '+0'], ['Sobrevivência', '+0'], ['Tática', '+5'], ['Tecnologia', '+0'], ['Vontade', '+5']]
  function updateAttribute(name: keyof typeof attributes, value: string) { setAttributes((current) => ({ ...current, [name]: Math.max(0, Math.min(9, Number(value) || 0)) })) }
  return <section className="sheet-page"><div className="sheet-toolbar"><button onClick={onBack}>← Voltar para fichas</button><span>FICHA · EDITADA AGORA</span><div><button>◌ Compartilhar</button><button className="sheet-save">Salvar ficha</button></div></div><div className="sheet-cover"><div className={`sheet-portrait ${character.color}`}><span>{character.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span><i>●</i></div><div className="sheet-identity"><span className="eyebrow">ORDEM PARANORMAL · AGENTE</span><h1>{character.name}</h1><p>{character.role} <b>·</b> NEX <input className="nex-input" value={nex} onChange={(event) => setNex(event.target.value)} aria-label="NEX do personagem" /> <b>·</b> Jogador: {character.player}</p><div className="sheet-tags"><span>O VÉU ENTRE NÓS</span><span>OCUPAÇÃO: INVESTIGADOR</span></div></div><div className="sheet-stamp">ARQUIVO<br /><strong>ATIVO</strong></div></div><div className="resource-grid"><Resource label="PONTOS DE VIDA" value={character.hp} max={character.maxHp} color="red" /><Resource label="PONTOS DE ESFORÇO" value={18} max={30} color="gold" /><Resource label="SANIDADE" value={42} max={50} color="blue" /><button className="sheet-roll" onClick={onRoll}><span>◈</span><div><small>ROLAGEM RÁPIDA</small><strong>Rolar d20</strong></div><b>↗</b></button></div><div className="sheet-columns"><div className="sheet-main"><SheetPanel title="Atributos" note="clique para editar"><div className="attribute-grid">{(Object.entries(attributes) as [keyof typeof attributes, number][]).map(([name, value]) => <div className="attribute" key={name}><span>{name}</span><input type="number" min="0" max="9" value={value} onChange={(event) => updateAttribute(name, event.target.value)} aria-label={`Valor de ${name}`} /><small>{value >= 3 ? '+5' : '+1'}</small></div>)}</div></SheetPanel><SheetPanel title="Perícias treinadas" note="bônus total"><div className="skills-grid">{skills.map(([name, value]) => <div className="skill" key={name}><span>{name}</span><strong>{value}</strong></div>)}</div></SheetPanel><SheetPanel title="Inventário" note="5 espaços usados"><div className="inventory"><div><span className="item-symbol">⌁</span><strong>Pistola do investigador</strong><small>Arma · 1d12</small></div><div><span className="item-symbol">◇</span><strong>Kit de perícia</strong><small>Equipamento · 2 espaços</small></div><div><span className="item-symbol">✦</span><strong>Fita cassete 07</strong><small>Evidência · importante</small></div></div></SheetPanel></div><aside className="sheet-side"><SheetPanel title="Defesas" note="valores atuais"><div className="defenses">{[['Defesa', '15'], ['Esquiva', '18'], ['Fortitude', '11'], ['Reflexos', '13'], ['Vontade', '14']].map(([name, value]) => <div key={name}><span>{name}</span><strong>{value}</strong></div>)}</div></SheetPanel><SheetPanel title="Anotações" note="privado"><div className="note-paper">A estação não aparece em nenhum mapa. Evelyn anotou: “as batidas começaram depois que abrimos a porta”.<br /><br /><em>Há algo observando do outro lado.</em></div></SheetPanel><button className="danger-action">⚠ Marcar condição</button></aside></div></section>
}

function Resource({ label, value, max, color }: { label: string; value: number; max: number; color: string }) { return <div className={`resource resource-${color}`}><span>{label}</span><strong>{value}<small> / {max}</small></strong><div><i style={{ width: `${value / max * 100}%` }} /></div></div> }
function SheetPanel({ title, note, children }: { title: string; note: string; children: React.ReactNode }) { return <section className="sheet-panel"><header><h2>{title}</h2><span>{note}</span></header>{children}</section> }
function DiceRoom({ selectedDie, roll, history, onRoll, onClear }: { selectedDie: string; roll: { total: number; dice: string; values: number[]; detail: string } | null; history: RollRecord[]; onRoll: (dice?: string) => void; onClear: () => void }) {
  const [attribute, setAttribute] = useState(1)
  const [skill, setSkill] = useState(0)
  const [mode, setMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal')
  const [formula, setFormula] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [animationKey, setAnimationKey] = useState(0)
  const dice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']
  const poolCount = attribute === 0 ? 2 : attribute
  const modeSuffix = mode === 'advantage' ? `kh1` : mode === 'disadvantage' ? `kl1` : ''
  const poolSuffix = attribute === 0 ? 'kl1' : modeSuffix
  const formulaModifier = mode === 'disadvantage' ? '' : skill ? `${skill > 0 ? '+' : ''}${skill}` : ''
  const selectedFormula = `${poolCount}${selectedDie}${poolSuffix}${formulaModifier}`
  function getDieFormula(die: string) { return `${poolCount}${die}${poolSuffix}${formulaModifier}` }
  function execute(animate = true) {
    onRoll(formula.trim() || selectedFormula)
    if (animate) setAnimationKey((current) => current + 1)
  }
  const winningValue = roll?.values.length ? (attribute === 0 || mode === 'disadvantage' ? Math.min(...roll.values) : Math.max(...roll.values)) : null
  const dieInfo: Record<string, [string, string]> = { d4: ['D4', '4 faces'], d6: ['D6', '6 faces'], d8: ['D8', '8 faces'], d10: ['D10', '10 faces'], d100: ['D%', 'Percentual'], d12: ['D12', '12 faces'], d20: ['D20', '20 faces'] }
  return <section className="dice-room dice-collection"><header className="dice-collection-header"><span>ARCANA · RPG DICE COLLECTION</span><h1>Dados do Destino</h1><p>Dados 3D · Física visual · Efeitos sonoros</p></header><div className="dice-workspace"><div className="dice-panel"><div className="dice-visual-heading"><span>VISUALIZAÇÃO 3D</span><small>{selectedDie === 'd100' ? 'D% · TRAPEZOEDRO PERCENTUAL' : `${selectedDie.toUpperCase()} · MODELO ARCANA`}</small></div><DiceRoller selectedDie={selectedDie} result={roll?.total} results={roll?.values} winningValue={winningValue} onRoll={() => execute(false)} animationKey={animationKey} showActions={false} soundEnabled={soundEnabled} /><div className="die-options">{dice.map((die) => <button key={die} className={selectedDie === die ? 'selected' : ''} onClick={() => { setFormula(''); onRoll(getDieFormula(die)); setAnimationKey((current) => current + 1) }}><strong>{dieInfo[die][0]}</strong><small>{dieInfo[die][1]}</small></button>)}</div><div className="roll-row"><label><span>QUANTIDADE</span><input type="number" min="0" max="20" value={attribute} onChange={(event) => setAttribute(Math.max(0, Number(event.target.value)))} /></label>  <button className="roll-main" onClick={() => execute()}>✦ ROLAR {selectedDie.toUpperCase()} ✦</button></div><button className={`sound-control ${soundEnabled ? 'enabled' : ''}`} type="button" onClick={() => setSoundEnabled((current) => !current)}>♫ Efeitos sonoros <span>{soundEnabled ? 'Ativados' : 'Desativados'}</span></button><div className="dice-result"><span>RESULTADO DA ROLAGEM</span><strong>{roll?.total ?? '—'}</strong><small>{roll ? `${roll.values.length} dado${roll.values.length === 1 ? '' : 's'} · ${selectedDie.toUpperCase()}` : 'Dado selecionado. Pronto para rolar.'}</small></div><div className="dice-extra-controls"><label className="formula-field"><span>FÓRMULA LIVRE</span><input value={formula} onChange={(event) => setFormula(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') execute() }} placeholder="Ex.: 2d6+3 ou 4d6kh3" aria-label="Fórmula de dados" /></label><div className="cris-fields"><label><span>PERÍCIA</span><input type="number" step="1" value={skill} onChange={(event) => setSkill(Number(event.target.value))} /></label><div className="roll-modes"><button className={mode === 'normal' ? 'active' : ''} onClick={() => setMode('normal')}>Normal</button><button className={mode === 'advantage' ? 'active' : ''} onClick={() => setMode('advantage')}>Vantagem</button><button className={mode === 'disadvantage' ? 'active' : ''} onClick={() => setMode('disadvantage')}>Desvantagem</button></div></div></div></div><aside className="dice-history"><div className="history-heading"><div><span>HISTÓRICO DE ROLAGENS</span></div><button onClick={onClear}>LIMPAR</button></div>{history.length ? history.map((item) => <button className="history-item" key={item.id} onClick={() => onRoll(item.formula)}><span className="history-die">✦</span><span><strong>{item.formula}</strong><small>{item.detail} · {item.at}</small></span><b>{item.total}</b></button>) : <div className="history-empty">Nenhuma rolagem realizada.</div>}</aside></div><footer className="dice-footer">✧ QUE OS DADOS SEJAM FAVORÁVEIS ✧</footer></section>
}
function Library() { const [query, setQuery] = useState(''); const [activeSystem, setActiveSystem] = useState<SystemName | 'Todos'>('Todos'); const filtered = systems.filter((system) => (activeSystem === 'Todos' || system.name === activeSystem) && `${system.name} ${system.note}`.toLowerCase().includes(query.toLowerCase())); return <Collection title="Biblioteca" kicker="REGRAS E REFERÊNCIAS" description="Pesquise sistemas e referências para a sua mesa." action="Adicionar conteúdo" onAction={() => undefined}><div className="library-toolbar"><label className="library-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar na biblioteca" aria-label="Buscar na biblioteca" /></label><span>{filtered.length} registros</span></div><div className="library-filters"><button className={activeSystem === 'Todos' ? 'active' : ''} onClick={() => setActiveSystem('Todos')}>Todos</button>{systems.map((system) => <button key={system.name} className={activeSystem === system.name ? 'active' : ''} onClick={() => setActiveSystem(system.name)}>{system.mark}</button>)}</div><div className="library-grid">{filtered.map((system) => <article className="system-card" key={system.name}><span className="system-mark">{system.mark}</span><div><h3>{system.name}</h3><p>{system.note}</p></div><span>↗</span></article>)}</div>{filtered.length === 0 && <div className="library-empty"><strong>Nenhum conteúdo encontrado</strong><span>Altere o termo ou o sistema selecionado.</span></div>}</Collection> }

function Landing({ onEnter, onCreate }: { onEnter: () => void; onCreate: () => void }) {
  return <div className="landing"><header className="landing-nav"><button className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="landing-rabbit">⌁</span><span><strong>toca</strong><small>COELHO RPG</small></span></button><nav><a href="#recursos">Recursos</a><a href="#mesa">Para a mesa</a><a href="#sistemas">Sistemas</a></nav><div className="landing-actions"><button className="landing-login" onClick={onEnter}>Entrar</button><button className="landing-cta" onClick={onCreate}>Criar minha ficha <span>↗</span></button></div></header><main><section className="landing-hero"><div className="hero-noise" /><div className="hero-copy"><span className="landing-kicker">UM ARQUIVO PARA CADA HISTÓRIA</span><h1>Entre na toca.<br /><em>O desconhecido espera.</em></h1><p>Crie agentes, organize campanhas e jogue sistemas que cabem na sua imaginação. Tudo em um espaço feito para quem não tem medo de abrir a porta.</p><div className="hero-actions"><button className="landing-cta large" onClick={onCreate}>Criar minha ficha <span>↗</span></button><button className="hero-link" onClick={onEnter}>Conhecer a plataforma <span>↓</span></button></div></div><div className="hero-dossier"><div className="dossier-stamp">ACESSO<br /><strong>AUTORIZADO</strong></div><div className="dossier-symbol">◉</div><span>ARQUIVO 07 / NÍVEL DE SIGILO: V</span><strong>O véu está<br /><em>se abrindo.</em></strong><div className="dossier-lines"><i /><i /><i /></div><small>TOCA DO COELHO · PLATAFORMA DE RPG</small></div><div className="scroll-cue">↓ <span>role para investigar</span></div></section><section className="landing-intro" id="recursos"><span className="landing-kicker">PARA QUEM JOGA E PARA QUEM NARRA</span><h2>Menos planilha.<br /><em>Mais história.</em></h2><p>A Toca reúne o que a sua mesa precisa para a próxima sessão: fichas vivas, campanhas sem limite e ferramentas que deixam o acaso fazer a parte dele.</p></section><section className="feature-band"><article className="feature-block feature-sheet"><div className="fake-sheet"><span>FICHA DE AGENTE</span><strong>Evelyn Croft</strong><small>ORDEM PARANORMAL · NEX 35%</small><div><i>VIDA <b>32 / 42</b></i><i>SANIDADE <b>42 / 50</b></i></div></div><div><span className="landing-kicker">FICHAS DIGITAIS</span><h3>Seu agente,<br /><em>sempre pronto.</em></h3><p>Atributos, perícias, inventário e rolagens rápidas em uma ficha editável que acompanha a sua história.</p><button onClick={onCreate}>Criar uma ficha <span>↗</span></button></div></article><article className="feature-block feature-table" id="mesa"><div className="table-orbit"><span>20</span><small>d20</small></div><div><span className="landing-kicker">FERRAMENTAS DE MESA</span><h3>O mestre segura<br /><em>o fio da história.</em></h3><p>Organize jogadores, ameaças, conteúdo próprio e resultados de dados sem interromper a sessão.</p><button onClick={onEnter}>Abrir a mesa <span>↗</span></button></div></article></section><section className="systems-band" id="sistemas"><div><span className="landing-kicker">UM ESPAÇO, VÁRIOS MUNDOS</span><h2>Escolha o sistema.<br /><em>Invente o resto.</em></h2></div><div className="system-pills">{systems.map((system, index) => <button key={system.name} onClick={onEnter}><span>0{index + 1}</span><strong>{system.name}</strong><small>{system.note}</small><b>↗</b></button>)}</div></section><section className="final-call"><span className="landing-kicker">A PRIMEIRA PISTA É SUA</span><h2>Qual história<br /><em>começa hoje?</em></h2><button className="landing-cta large" onClick={onCreate}>Entrar na Toca <span>↗</span></button></section></main><footer className="landing-footer"><span>TOCA DO COELHO · 2026</span><span>ARQUIVO ABERTO PARA A IMAGINAÇÃO</span><button onClick={onEnter}>Acessar workspace ↗</button></footer></div>
}

export default App

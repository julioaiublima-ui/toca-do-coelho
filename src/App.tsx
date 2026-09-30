import { useMemo, useState } from 'react'
import './App.css'
import './sheet.css'
import './sheet-edit.css'
import './landing.css'
import './theme.css'

type View = 'home' | 'overview' | 'campaigns' | 'characters' | 'sheet' | 'dice' | 'library'
type SystemName = 'Ordem Paranormal' | 'D&D 5e' | 'Tormenta20' | 'Sistema próprio'
type Campaign = { id: number; title: string; system: SystemName; players: number; scene: string; color: string; updated: string }
type Character = { id: number; name: string; player: string; role: string; system: SystemName; level: string; hp: number; maxHp: number; color: string }

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
]

function App() {
  const [view, setView] = useState<View>('home')
  const [campaigns, setCampaigns] = useState(seedCampaigns)
  const [characters, setCharacters] = useState(seedCharacters)
  const [activeCampaign, setActiveCampaign] = useState(seedCampaigns[0])
  const [selectedCharacter, setSelectedCharacter] = useState(seedCharacters[0])
  const [showCreate, setShowCreate] = useState(false)
  const [createType, setCreateType] = useState<'campaign' | 'character'>('campaign')
  const [roll, setRoll] = useState<{ total: number; dice: string } | null>(null)
  const [selectedDie, setSelectedDie] = useState('d20')
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
  function rollDice(dice = selectedDie) { const sides = Number(dice.slice(1)); setSelectedDie(dice); setRoll({ total: Math.floor(Math.random() * sides) + 1, dice }) }

  if (view === 'home') return <Landing onEnter={() => setView('overview')} onCreate={() => openCreate('character')} />

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="rabbit-mark"><span>⌁</span></div><div><strong>toca</strong><small>COELHO RPG</small></div></div>
      <button className="campaign-picker"><span className="campaign-dot" /><div><small>CAMPANHA ATIVA</small><strong>{activeCampaign.title}</strong></div><b>⌄</b></button>
      <nav className="main-nav">{navItems.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}{item.id === 'dice' && <i>⌘ R</i>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="new-button" onClick={() => openCreate('campaign')}><span>＋</span> Nova campanha</button><div className="user-row"><div className="user-avatar">JC</div><div><strong>Julio Colares</strong><small>Plano gratuito · ilimitado</small></div><span>•••</span></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="breadcrumbs"><span>TOCA /</span><strong>{navItems.find((item) => item.id === view)?.label}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Buscar">⌕</button><button className="icon-button notification" aria-label="Notificações">♧<i /></button><button className="profile-chip"><span className="status-dot" /> Mesa online <b>⌄</b></button></div></header>
      <div className="content-wrap">
        {view === 'overview' && <Overview greeting={greeting} campaigns={campaigns} characters={characters} activeCampaign={activeCampaign} setActiveCampaign={setActiveCampaign} setView={setView} openCreate={openCreate} rollDice={rollDice} />}
        {view === 'campaigns' && <Collection title="Campanhas" kicker="SEU UNIVERSO" description="Toda aventura começa com uma página em branco." action="Nova campanha" onAction={() => openCreate('campaign')}><div className="campaign-grid">{campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} active={campaign.id === activeCampaign.id} onClick={() => setActiveCampaign(campaign)} />)}<button className="create-tile" onClick={() => openCreate('campaign')}><span>＋</span><strong>Criar campanha</strong><small>Comece uma nova história</small></button></div></Collection>}
        {view === 'characters' && <Collection title="Minhas fichas" kicker="ARQUIVO DE PERSONAGENS" description="Heróis, anti-heróis e tudo que acontece entre os dois." action="Nova ficha" onAction={() => openCreate('character')}><div className="character-list">{characters.map((character) => <CharacterRow key={character.id} character={character} onOpen={() => { setSelectedCharacter(character); setView('sheet') }} />)}</div></Collection>}
        {view === 'sheet' && <div className="sheet-shell"><SheetTabs /><CharacterSheet character={selectedCharacter} onBack={() => setView('characters')} onRoll={() => rollDice('d20')} /></div>}
        {view === 'dice' && <DiceRoom selectedDie={selectedDie} roll={roll} onRoll={rollDice} />}
        {view === 'library' && <Library />}
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

function SheetTabs() {
  const [activeTab, setActiveTab] = useState('COMBATE')
  return <nav className="sheet-tabs" aria-label="Seções da ficha">{['COMBATE', 'HABILIDADES', 'RITUAIS', 'INVENTÁRIO', 'DESCRIÇÃO'].map((tab) => <button key={tab} className={`sheet-tab tab-${tab.toLowerCase().replace('í', 'i')} ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</nav>
}

function CharacterSheet({ character, onBack, onRoll }: { character: Character; onBack: () => void; onRoll: () => void }) {
  const [nex, setNex] = useState(character.level.replace('NEX ', ''))
  const [attributes, setAttributes] = useState({ AGI: 3, FOR: 1, INT: 3, PRE: 2, VIG: 1 })
  const skills = [['Investigação', '+10'], ['Percepção', '+10'], ['Reflexos', '+8'], ['Vontade', '+8'], ['Tecnologia', '+5'], ['Furtividade', '+5']]
  function updateAttribute(name: keyof typeof attributes, value: string) { setAttributes((current) => ({ ...current, [name]: Math.max(0, Math.min(9, Number(value) || 0)) })) }
  return <section className="sheet-page"><div className="sheet-toolbar"><button onClick={onBack}>← Voltar para fichas</button><span>FICHA · EDITADA AGORA</span><div><button>◌ Compartilhar</button><button className="sheet-save">Salvar ficha</button></div></div><div className="sheet-cover"><div className={`sheet-portrait ${character.color}`}><span>{character.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span><i>●</i></div><div className="sheet-identity"><span className="eyebrow">ORDEM PARANORMAL · AGENTE</span><h1>{character.name}</h1><p>{character.role} <b>·</b> NEX <input className="nex-input" value={nex} onChange={(event) => setNex(event.target.value)} aria-label="NEX do personagem" /> <b>·</b> Jogador: {character.player}</p><div className="sheet-tags"><span>O VÉU ENTRE NÓS</span><span>OCUPAÇÃO: INVESTIGADOR</span></div></div><div className="sheet-stamp">ARQUIVO<br /><strong>ATIVO</strong></div></div><div className="resource-grid"><Resource label="PONTOS DE VIDA" value={character.hp} max={character.maxHp} color="red" /><Resource label="PONTOS DE ESFORÇO" value={18} max={30} color="gold" /><Resource label="SANIDADE" value={42} max={50} color="blue" /><button className="sheet-roll" onClick={onRoll}><span>◈</span><div><small>ROLAGEM RÁPIDA</small><strong>Rolar d20</strong></div><b>↗</b></button></div><div className="sheet-columns"><div className="sheet-main"><SheetPanel title="Atributos" note="clique para editar"><div className="attribute-grid">{(Object.entries(attributes) as [keyof typeof attributes, number][]).map(([name, value]) => <div className="attribute" key={name}><span>{name}</span><input type="number" min="0" max="9" value={value} onChange={(event) => updateAttribute(name, event.target.value)} aria-label={`Valor de ${name}`} /><small>{value >= 3 ? '+5' : '+1'}</small></div>)}</div></SheetPanel><SheetPanel title="Perícias treinadas" note="bônus total"><div className="skills-grid">{skills.map(([name, value]) => <div className="skill" key={name}><span>{name}</span><strong>{value}</strong></div>)}</div></SheetPanel><SheetPanel title="Inventário" note="5 espaços usados"><div className="inventory"><div><span className="item-symbol">⌁</span><strong>Pistola do investigador</strong><small>Arma · 1d12</small></div><div><span className="item-symbol">◇</span><strong>Kit de perícia</strong><small>Equipamento · 2 espaços</small></div><div><span className="item-symbol">✦</span><strong>Fita cassete 07</strong><small>Evidência · importante</small></div></div></SheetPanel></div><aside className="sheet-side"><SheetPanel title="Defesas" note="valores atuais"><div className="defenses">{[['Defesa', '15'], ['Esquiva', '18'], ['Fortitude', '11'], ['Reflexos', '13'], ['Vontade', '14']].map(([name, value]) => <div key={name}><span>{name}</span><strong>{value}</strong></div>)}</div></SheetPanel><SheetPanel title="Anotações" note="privado"><div className="note-paper">A estação não aparece em nenhum mapa. Evelyn anotou: “as batidas começaram depois que abrimos a porta”.<br /><br /><em>Há algo observando do outro lado.</em></div></SheetPanel><button className="danger-action">⚠ Marcar condição</button></aside></div></section>
}

function Resource({ label, value, max, color }: { label: string; value: number; max: number; color: string }) { return <div className={`resource resource-${color}`}><span>{label}</span><strong>{value}<small> / {max}</small></strong><div><i style={{ width: `${value / max * 100}%` }} /></div></div> }
function SheetPanel({ title, note, children }: { title: string; note: string; children: React.ReactNode }) { return <section className="sheet-panel"><header><h2>{title}</h2><span>{note}</span></header>{children}</section> }
function DiceRoom({ selectedDie, roll, onRoll }: { selectedDie: string; roll: { total: number; dice: string } | null; onRoll: (dice?: string) => void }) { return <section className="dice-room"><div className="page-heading"><div><span className="eyebrow">A FERRAMENTA DA MESA</span><h1>Rolagem <em>rápida.</em></h1><p>O acaso também faz parte da história.</p></div></div><div className="dice-panel"><div className="dice-orbit"><div className="big-die"><span>{roll ? roll.total : '20'}</span><small>{roll ? roll.dice : 'd20'}</small></div></div><div className="dice-controls"><span className="eyebrow">ESCOLHA SEU DADO</span><div className="die-options">{['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map((die) => <button key={die} className={selectedDie === die ? 'selected' : ''} onClick={() => onRoll(die)}>{die}</button>)}</div><button className="roll-main" onClick={() => onRoll(selectedDie)}>Rolar {selectedDie} <span>↗</span></button><p>Os resultados aparecem somente para os jogadores da sua mesa.</p></div></div></section> }
function Library() { return <Collection title="Biblioteca" kicker="REGRAS E REFERÊNCIAS" description="O que você precisa, quando precisa." action="Adicionar conteúdo" onAction={() => undefined}><div className="library-grid">{systems.map((system) => <article className="system-card" key={system.name}><span className="system-mark">{system.mark}</span><div><h3>{system.name}</h3><p>{system.note}</p></div><span>↗</span></article>)}</div></Collection> }

function Landing({ onEnter, onCreate }: { onEnter: () => void; onCreate: () => void }) {
  return <div className="landing"><header className="landing-nav"><button className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><span className="landing-rabbit">⌁</span><span><strong>toca</strong><small>COELHO RPG</small></span></button><nav><a href="#recursos">Recursos</a><a href="#mesa">Para a mesa</a><a href="#sistemas">Sistemas</a></nav><div className="landing-actions"><button className="landing-login" onClick={onEnter}>Entrar</button><button className="landing-cta" onClick={onCreate}>Criar minha ficha <span>↗</span></button></div></header><main><section className="landing-hero"><div className="hero-noise" /><div className="hero-copy"><span className="landing-kicker">UM ARQUIVO PARA CADA HISTÓRIA</span><h1>Entre na toca.<br /><em>O desconhecido espera.</em></h1><p>Crie agentes, organize campanhas e jogue sistemas que cabem na sua imaginação. Tudo em um espaço feito para quem não tem medo de abrir a porta.</p><div className="hero-actions"><button className="landing-cta large" onClick={onCreate}>Criar minha ficha <span>↗</span></button><button className="hero-link" onClick={onEnter}>Conhecer a plataforma <span>↓</span></button></div></div><div className="hero-dossier"><div className="dossier-stamp">ACESSO<br /><strong>AUTORIZADO</strong></div><div className="dossier-symbol">◉</div><span>ARQUIVO 07 / NÍVEL DE SIGILO: V</span><strong>O véu está<br /><em>se abrindo.</em></strong><div className="dossier-lines"><i /><i /><i /></div><small>TOCA DO COELHO · PLATAFORMA DE RPG</small></div><div className="scroll-cue">↓ <span>role para investigar</span></div></section><section className="landing-intro" id="recursos"><span className="landing-kicker">PARA QUEM JOGA E PARA QUEM NARRA</span><h2>Menos planilha.<br /><em>Mais história.</em></h2><p>A Toca reúne o que a sua mesa precisa para a próxima sessão: fichas vivas, campanhas sem limite e ferramentas que deixam o acaso fazer a parte dele.</p></section><section className="feature-band"><article className="feature-block feature-sheet"><div className="fake-sheet"><span>FICHA DE AGENTE</span><strong>Evelyn Croft</strong><small>ORDEM PARANORMAL · NEX 35%</small><div><i>VIDA <b>32 / 42</b></i><i>SANIDADE <b>42 / 50</b></i></div></div><div><span className="landing-kicker">FICHAS DIGITAIS</span><h3>Seu agente,<br /><em>sempre pronto.</em></h3><p>Atributos, perícias, inventário e rolagens rápidas em uma ficha editável que acompanha a sua história.</p><button onClick={onCreate}>Criar uma ficha <span>↗</span></button></div></article><article className="feature-block feature-table" id="mesa"><div className="table-orbit"><span>20</span><small>d20</small></div><div><span className="landing-kicker">FERRAMENTAS DE MESA</span><h3>O mestre segura<br /><em>o fio da história.</em></h3><p>Organize jogadores, ameaças, conteúdo próprio e resultados de dados sem interromper a sessão.</p><button onClick={onEnter}>Abrir a mesa <span>↗</span></button></div></article></section><section className="systems-band" id="sistemas"><div><span className="landing-kicker">UM ESPAÇO, VÁRIOS MUNDOS</span><h2>Escolha o sistema.<br /><em>Invente o resto.</em></h2></div><div className="system-pills">{systems.map((system, index) => <button key={system.name} onClick={onEnter}><span>0{index + 1}</span><strong>{system.name}</strong><small>{system.note}</small><b>↗</b></button>)}</div></section><section className="final-call"><span className="landing-kicker">A PRIMEIRA PISTA É SUA</span><h2>Qual história<br /><em>começa hoje?</em></h2><button className="landing-cta large" onClick={onCreate}>Entrar na Toca <span>↗</span></button></section></main><footer className="landing-footer"><span>TOCA DO COELHO · 2026</span><span>ARQUIVO ABERTO PARA A IMAGINAÇÃO</span><button onClick={onEnter}>Acessar workspace ↗</button></footer></div>
}

export default App

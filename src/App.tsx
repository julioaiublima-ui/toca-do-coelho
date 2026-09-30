import { useMemo, useState } from 'react'
import './App.css'

type Section = 'system' | 'agents' | 'campaigns' | 'threats' | 'homebrew'
type ContentType = 'Habilidade' | 'Arma' | 'Ameaça' | 'Ritual' | 'Item'
type Entry = { id: number; type: ContentType; name: string; subtitle: string; detail: string; tag: string; accent: string }

const initialEntries: Entry[] = [
  { id: 1, type: 'Habilidade', name: 'Reflexos Defensivos', subtitle: 'Especialista · Reação', detail: 'Quando a ameaça se aproxima, você aprende a desaparecer antes do impacto.', tag: 'PASSIVA', accent: 'lime' },
  { id: 2, type: 'Ritual', name: 'Ouvir os sussurros', subtitle: 'Conhecimento · 1º círculo', detail: 'Você toca uma superfície e escuta os últimos sons deixados nela.', tag: 'RITUAL', accent: 'violet' },
  { id: 3, type: 'Arma', name: 'Pistola do investigador', subtitle: 'Fogo · 1d12', detail: 'Uma arma compacta, marcada por uma inscrição quase apagada.', tag: 'EQUIPAMENTO', accent: 'amber' },
  { id: 4, type: 'Ameaça', name: 'O Homem do Poço', subtitle: 'Criatura · VD 45', detail: 'Ele não caça pessoas. Caça aquilo que elas tentam esquecer.', tag: 'AMEAÇA', accent: 'red' },
  { id: 5, type: 'Item', name: 'Fita cassete 07', subtitle: 'Investigação · Evidência', detail: 'A gravação termina com três batidas. A quarta sempre acontece atrás de você.', tag: 'EVIDÊNCIA', accent: 'blue' },
]

const sectionInfo: Record<Section, { eyebrow: string; title: string; description: string }> = {
  system: { eyebrow: 'CENTRO DE CONTROLE', title: 'Sistema', description: 'Regras, compêndios e atualizações para manter a mesa no mesmo ritmo.' },
  agents: { eyebrow: 'ARQUIVO DE CAMPO', title: 'Agentes', description: 'As pessoas que continuam investigando mesmo quando já deveriam ter ido embora.' },
  campaigns: { eyebrow: 'DOSSIÊS ATIVOS', title: 'Campanhas', description: 'Suas histórias, pistas e sessões organizadas em um só lugar.' },
  threats: { eyebrow: 'NÍVEL DE RISCO', title: 'Ameaças', description: 'O catálogo de coisas que observam de volta quando você olha para o escuro.' },
  homebrew: { eyebrow: 'OFICINA DO MESTRE', title: 'Homebrew', description: 'Crie conteúdo, ajuste a experiência e dê uma assinatura à sua campanha.' },
}

function App() {
  const [section, setSection] = useState<Section>('system')
  const [entries, setEntries] = useState(initialEntries)
  const [filter, setFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [apiStatus, setApiStatus] = useState('API pronta')
  const [newEntry, setNewEntry] = useState({ type: 'Habilidade' as ContentType, name: '', subtitle: '', detail: '' })
  const info = sectionInfo[section]
  const visibleEntries = useMemo(() => entries.filter((entry) => (filter === 'Todos' || entry.type === filter) && `${entry.name} ${entry.subtitle}`.toLowerCase().includes(query.toLowerCase())), [entries, filter, query])

  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newEntry.name.trim()) return
    const accents: Record<ContentType, string> = { Habilidade: 'lime', Arma: 'amber', Ameaça: 'red', Ritual: 'violet', Item: 'blue' }
    setEntries((current) => [{ ...newEntry, id: Date.now(), tag: newEntry.type.toUpperCase(), accent: accents[newEntry.type] }, ...current])
    setNewEntry({ type: 'Habilidade', name: '', subtitle: '', detail: '' })
    setShowModal(false)
  }

  async function syncApi() {
    setApiStatus('Sincronizando...')
    try {
      const response = await fetch('https://op-fvtt-api.vercel.app/notes')
      if (!response.ok) throw new Error('API indisponível')
      await response.json()
      setApiStatus('API sincronizada')
    } catch {
      setApiStatus('Catálogo local')
    }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-symbol">◈</span><div><strong>NOCTUA</strong><small>rpg workspace</small></div></div>
      <div className="campaign-switcher"><span>CAMPANHA ATIVA</span><strong>O véu entre nós</strong><small>Força Umbra · 04 jogadores</small><b>⌄</b></div>
      <nav className="main-nav">{(Object.keys(sectionInfo) as Section[]).map((item, index) => <button key={item} className={section === item ? 'active' : ''} onClick={() => setSection(item)}><span className="nav-number">0{index + 1}</span>{sectionInfo[item].title}<i>↗</i></button>)}</nav>
      <div className="sidebar-foot"><button className="api-button" onClick={syncApi}><span className="pulse" /> {apiStatus}</button><div className="profile"><div className="profile-mark">JC</div><div><strong>Julio Colares</strong><small>Administrador</small></div><span>•••</span></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="location"><span>NOCTUA</span><b>/</b>{info.title.toUpperCase()}</div><div className="topbar-actions"><button aria-label="Pesquisar">⌕</button><button aria-label="Notificações">◌<i /></button><button className="ghost-button" onClick={() => setShowModal(true)}>＋ Criar conteúdo</button></div></header>
      <section className="page">
        <div className="page-intro"><div><span className="eyebrow">{info.eyebrow}</span><h1>{info.title}<em>.</em></h1><p>{info.description}</p></div><div className="intro-meta"><span>ÚLTIMA ATUALIZAÇÃO</span><strong>29 SET 2026 <i>●</i></strong></div></div>
        {section === 'system' && <><div className="signal-grid"><article className="signal-card featured"><span className="eyebrow">SINAL DA SEMANA</span><h2>O medo muda<br /><em>de forma.</em></h2><p>Uma nova forma de organizar sua mesa: personagens, conteúdo e ameaças em um mesmo arquivo vivo.</p><button onClick={() => setSection('campaigns')}>Abrir campanha <span>↗</span></button><div className="orbit">◌<i>✦</i></div></article><article className="metric-card"><span className="eyebrow">SUA FICHA</span><div className="metric-person"><div className="large-avatar">EC</div><div><strong>Evelyn Hp Croft</strong><small>Investigadora · NEX 35%</small></div></div><div className="metric-line"><span>Sanidade</span><b>42 / 50</b></div><div className="bar"><i className="sanity-bar" /></div><button onClick={() => setSection('agents')}>Ver agente <span>→</span></button></article><article className="metric-card danger"><span className="eyebrow">RADAR DE AMEAÇAS</span><strong className="big-number">07</strong><p>entidades catalogadas<br />nesta campanha</p><div className="threat-dots"><i /><i /><i /><i /><i /><i /><i /></div><button onClick={() => setSection('threats')}>Consultar radar <span>→</span></button></article></div><div className="section-heading"><div><span className="eyebrow">ACESSO RÁPIDO</span><h2>O arquivo recente</h2></div><button onClick={() => setSection('homebrew')}>Ver todo o acervo ↗</button></div><EntryList entries={entries.slice(0, 3)} /></>}
        {section !== 'system' && <><div className="control-strip"><div className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar em ${info.title.toLowerCase()}...`} /></div><div className="filter-tabs">{['Todos', 'Habilidade', 'Arma', 'Ameaça', 'Ritual', 'Item'].map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="primary-button" onClick={() => setShowModal(true)}>＋ Novo registro</button></div><div className="catalog-header"><span>{visibleEntries.length} REGISTROS ENCONTRADOS</span><button onClick={syncApi}>↻ Atualizar API</button></div><EntryList entries={visibleEntries} empty={query ? 'Nenhum registro encontrado.' : undefined} /></>}
        <footer><span>NOCTUA WORKSPACE · 01.04</span><span>Dados locais conectados ao catálogo da mesa</span><span>● ONLINE</span></footer>
      </section>
    </main>
    {showModal && <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}><form className="modal" onSubmit={addEntry} onMouseDown={(event) => event.stopPropagation()}><div className="modal-top"><div><span className="eyebrow">OFICINA DO MESTRE</span><h2>Novo registro</h2></div><button type="button" onClick={() => setShowModal(false)}>×</button></div><label>Tipo de conteúdo<select value={newEntry.type} onChange={(event) => setNewEntry({ ...newEntry, type: event.target.value as ContentType })}><option>Habilidade</option><option>Arma</option><option>Ameaça</option><option>Ritual</option><option>Item</option></select></label><label>Nome<input autoFocus required value={newEntry.name} onChange={(event) => setNewEntry({ ...newEntry, name: event.target.value })} placeholder="Ex: Marca do outro lado" /></label><label>Categoria ou valor<input value={newEntry.subtitle} onChange={(event) => setNewEntry({ ...newEntry, subtitle: event.target.value })} placeholder="Ex: Conhecimento · 1º círculo" /></label><label>Descrição<textarea value={newEntry.detail} onChange={(event) => setNewEntry({ ...newEntry, detail: event.target.value })} placeholder="Descreva o efeito, contexto ou pistas..." /></label><button className="primary-button save-button">Salvar no catálogo <span>↗</span></button></form></div>}
  </div>
}

function EntryList({ entries, empty }: { entries: Entry[]; empty?: string }) {
  if (!entries.length) return <div className="empty-state">{empty ?? 'O acervo está vazio.'}</div>
  return <div className="entry-list">{entries.map((entry) => <article className="entry-row" key={entry.id}><div className={`entry-icon ${entry.accent}`}>{entry.type === 'Ameaça' ? '☠' : entry.type === 'Arma' ? '⌁' : entry.type === 'Ritual' ? '✦' : entry.type === 'Item' ? '◇' : '✧'}</div><div className="entry-main"><div><span className="entry-type">{entry.tag}</span><h3>{entry.name}</h3></div><p>{entry.detail}</p></div><div className="entry-subtitle">{entry.subtitle}</div><button className="row-action" aria-label={`Abrir ${entry.name}`}>↗</button></article>)}</div>
}

export default App

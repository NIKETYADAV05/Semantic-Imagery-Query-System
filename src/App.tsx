import { useState, useEffect } from 'react'
import {
  AOI_REGIONS,
  SEARCH_RESULTS,
  CHANGE_CANDIDATES,
  INGESTION_LOG,
  REFERENCE_QUERY_PATCHES,
} from './data/mockImagery'
import { SearchResult, ChangeCandidate, AOIRegion } from './types/imagery'
import Globe3D from './components/Globe3D'
import TileInspectorModal from './components/TileInspectorModal'
import ChangeSlider from './components/ChangeSlider'
import DatasetsPanel from './components/DatasetsPanel'
import DiscoveryClusters from './components/DiscoveryClusters'
import WeatherAtmosphericPanel from './components/WeatherAtmosphericPanel'
import SpectralCalculatorModal from './components/SpectralCalculatorModal'
import MissionBriefingModal from './components/MissionBriefingModal'
import AnalystGuideModal from './components/AnalystGuideModal'
import HyperspectralUnmixingModal from './components/HyperspectralUnmixingModal'
import TelemetryAudioDeckModal from './components/TelemetryAudioDeckModal'
import SatelliteWorldMap from './components/SatelliteWorldMap'
import EOAnalyticsFlowchart from './components/EOAnalyticsFlowchart'
import SafeSatelliteImage from './components/SafeSatelliteImage'
import { sfx } from './utils/audioSfx'

type Tab =
  | 'search'
  | 'worldmap'
  | 'orbit3d'
  | 'weather'
  | 'change'
  | 'discovery'
  | 'queue'
  | 'datasets'
  | 'architecture'
  | 'ingestion'

function StatusDot({ color }: { color: string }) {
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color} mr-1.5`} />
}

function Chip({
  label,
  variant = 'default',
}: {
  label: string
  variant?: 'default' | 'amber' | 'green' | 'red' | 'blue' | 'cyan'
}) {
  const cls = {
    default: 'bg-[#1e252f] text-[#8b96a3] border-[#252d38]',
    amber: 'bg-[#92400e]/30 text-amber-400 border-amber-900/50',
    green: 'bg-[#064e3b]/40 text-emerald-400 border-emerald-900/50',
    red: 'bg-[#450a0a]/40 text-red-400 border-red-900/50',
    blue: 'bg-[#1e3a5f]/40 text-blue-400 border-blue-900/50',
    cyan: 'bg-[#083344]/50 text-cyan-300 border-cyan-800/60',
  }[variant]
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium border rounded ${cls}`}>
      {label}
    </span>
  )
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 85 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1 bg-[#1e252f] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs text-[#8b96a3]">{pct}%</span>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('search')
  const [sysTime, setSysTime] = useState(new Date())
  const [activeAoi, setActiveAoi] = useState<AOIRegion>(AOI_REGIONS[0])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [inspectingTile, setInspectingTile] = useState<SearchResult | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [spectralModalOpen, setSpectralModalOpen] = useState(false)
  const [briefingModalOpen, setBriefingModalOpen] = useState(false)
  const [guideModalOpen, setGuideModalOpen] = useState(false)
  const [hyperspectralModalOpen, setHyperspectralModalOpen] = useState(false)
  const [audioDeckOpen, setAudioDeckOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [audioVolume, setAudioVolume] = useState(sfx.getVolume())
  const [audioProfile, setAudioProfile] = useState<'aerospace' | 'sonar' | 'scifi'>(sfx.getSoundProfile())

  // Search State
  const [query, setQuery] = useState('')
  const [activeQueryText, setActiveQueryText] = useState('newly built structures near a river')
  const [searchMode, setSearchMode] = useState<'text' | 'image'>('text')
  const [selectedReferencePatch, setSelectedReferencePatch] = useState<string | null>(null)
  const [sensorFilter, setSensorFilter] = useState<string>('all')
  const [cloudLimit, setCloudLimit] = useState<number>(25)
  const [minSim, setMinSim] = useState<number>(70)
  const [results, setResults] = useState<SearchResult[]>(SEARCH_RESULTS)
  const [isSearching, setIsSearching] = useState(false)

  // Change Detection State
  const [candidates, setCandidates] = useState<ChangeCandidate[]>(CHANGE_CANDIDATES)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('CC-0041')
  const [changeFilterStatus, setChangeFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'rejected' | 'flagged'>('all')

  // Review Queue State
  const [queueIndex, setQueueIndex] = useState(0)

  // Ingestion Log & Pipeline
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [rebuildProgress, setRebuildProgress] = useState(0)
  const [rebuildLogs, setRebuildLogs] = useState<string[]>([])

  useEffect(() => {
    const t = setInterval(() => setSysTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-hide notification banner
  const notify = (msg: string) => {
    setNotification(msg)
    sfx.playConfirm()
    setTimeout(() => setNotification(null), 3500)
  }

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    sfx.setEnabled(next)
    notify(next ? 'Telemetry audio effects enabled.' : 'Telemetry audio muted.')
  }

  // Handle Search Submission
  const handleSearch = () => {
    sfx.playClick()
    setIsSearching(true)
    setTimeout(() => {
      let filtered = SEARCH_RESULTS.filter((r) => r.cloud <= cloudLimit && r.score * 100 >= minSim)
      if (sensorFilter !== 'all') {
        filtered = filtered.filter((r) => r.sensor.toLowerCase().includes(sensorFilter.toLowerCase()))
      }
      if (searchMode === 'text' && query.trim()) {
        setActiveQueryText(query)
      } else if (searchMode === 'image' && selectedReferencePatch) {
        const patch = REFERENCE_QUERY_PATCHES.find((p) => p.id === selectedReferencePatch)
        setActiveQueryText(`Visual embedding match: [${patch?.label}]`)
      }
      setResults(filtered.length > 0 ? filtered : SEARCH_RESULTS)
      setIsSearching(false)
      notify(`Search complete — ${filtered.length || SEARCH_RESULTS.length} tiles retrieved.`)
    }, 600)
  }

  // Find similar triggered from tile inspector
  const handleFindSimilar = (tile: SearchResult) => {
    sfx.playClick()
    setSearchMode('image')
    setActiveQueryText(`Visual vector match to ${tile.tile}`)
    setTab('search')
    setIsSearching(true)
    setTimeout(() => {
      setResults(
        SEARCH_RESULTS.slice()
          .sort((a, b) => (a.id === tile.id ? -1 : 1))
      )
      setIsSearching(false)
      notify(`Pivot completed — matching nearest 512-dim visual embeddings to ${tile.tile}.`)
    }, 500)
  }

  // Queue change from tile
  const handleQueueChange = (tile: SearchResult) => {
    const newCandidate: ChangeCandidate = {
      id: `CC-${Math.floor(1000 + Math.random() * 9000)}`,
      aoi: activeAoi.id,
      aoiName: activeAoi.name,
      coords: tile.coords,
      lat: tile.lat,
      lon: tile.lon,
      dateBefore: '2024-01-10',
      dateAfter: tile.date,
      sensor: tile.sensor,
      agency: tile.agency,
      changeType: `Automated Multi-Temporal Detection: ${tile.tags[0] || 'Structure'}`,
      confidence: 0.88,
      status: 'pending',
      deltaType: 'urban_expansion',
      estimatedAreaHa: 3.5,
      thumbBefore: 'photo-1559827260-dc66d52bef19',
      thumbAfter: tile.thumb,
      description: `Target ${tile.tile} queued by analyst for multi-temporal verification against baseline scene.`,
    }
    setCandidates([newCandidate, ...candidates])
    setSelectedCandidateId(newCandidate.id)
    setTab('change')
    notify(`Tile ${tile.tile} queued as candidate ${newCandidate.id}.`)
  }

  // Change Candidate Actions
  const handleConfirmCandidate = (id: string) => {
    sfx.playConfirm()
    setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, status: 'confirmed' } : c)))
    notify(`Candidate ${id} confirmed and recorded in dossier.`)
  }

  const handleRejectCandidate = (id: string) => {
    sfx.playClick()
    setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, status: 'rejected' } : c)))
    notify(`Candidate ${id} marked as false alarm / rejected.`)
  }

  const handleFlagCandidate = (id: string) => {
    sfx.playClick()
    setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, status: 'flagged' } : c)))
    notify(`Candidate ${id} flagged for senior intelligence review.`)
  }

  const handleSaveNotes = (id: string, notes: string) => {
    setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, analystNotes: notes } : c)))
    notify(`Notes saved for ${id}.`)
  }

  // Ingestion Simulation
  const handleTriggerRebuild = () => {
    sfx.playClick()
    setIsRebuilding(true)
    setRebuildProgress(10)
    setRebuildLogs([
      'INIT: Fetching STAC Item manifests for AOI-ALPHA-7...',
      'CONNECT: Connecting to Copernicus Data Space Ecosystem API...',
    ])

    setTimeout(() => {
      setRebuildProgress(35)
      setRebuildLogs((prev) => [
        ...prev,
        'INGEST: Parsing Sentinel-2 L2A BOA Bottom-of-Atmosphere COGs...',
        'PYRAMID: Generating dynamic Cloud-Optimized GeoTIFF overviews...',
      ])
    }, 1000)

    setTimeout(() => {
      setRebuildProgress(70)
      setRebuildLogs((prev) => [
        ...prev,
        'INFERENCE: Extracting 512-dim visual embeddings via RemoteCLIP (RS5M)...',
        'SEGMENTATION: Generating candidate change masks via SAM2 ViT-L...',
      ])
    }, 2200)

    setTimeout(() => {
      setRebuildProgress(100)
      setRebuildLogs((prev) => [
        ...prev,
        'INDEX: Updated HNSW vector index with 1,240 new scene tiles.',
        'COMPLETED: Index live. All hash signatures verified against Copernicus catalogue.',
      ])
      setIsRebuilding(false)
      notify('Incremental Index Rebuild completed successfully.')
    }, 3600)
  }

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0]
  const filteredCandidates =
    changeFilterStatus === 'all'
      ? candidates
      : candidates.filter((c) => c.status === changeFilterStatus)

  // Review Queue Items
  const pendingQueue = candidates.filter((c) => c.status === 'pending')
  const currentQueueItem = pendingQueue[queueIndex] || null

  const tabs: { id: Tab; label: string; sub: string }[] = [
    { id: 'search', label: 'SEMANTIC SEARCH', sub: 'free-text & image-to-image' },
    { id: 'worldmap', label: 'WORLD SATELLITE MAP', sub: 'Esri imagery & live probe' },
    { id: 'orbit3d', label: '3D CONSTELLATION', sub: 'Three.js orbital models' },
    { id: 'weather', label: 'ATMOSPHERE & FORECAST', sub: 'real-time weather & sensor viability' },
    { id: 'change', label: 'CHANGE ANALYSIS', sub: 'multi-temporal detection' },
    { id: 'discovery', label: 'DISCOVERY', sub: 'latent embedding clusters' },
    { id: 'architecture', label: 'ARCHITECTURE & GRAPHS', sub: 'pipeline flowchart & spectral curves' },
    { id: 'queue', label: 'ANALYST QUEUE', sub: 'ranked review triage' },
    { id: 'datasets', label: 'OPEN DATASETS & STAC', sub: 'Copernicus, Landsat, ISRO' },
    { id: 'ingestion', label: 'INGESTION', sub: 'index & provenance' },
  ]

  const utcDateStr = sysTime.toISOString().split('T')[0]
  const utcTimeStr = sysTime.toISOString().replace('T', ' ').split('.')[0].split(' ')[1]

  return (
    <div className="min-h-screen bg-[#080a0d] text-[#e8edf2] grid-overlay flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 bg-[#0f1216] border border-amber-500/80 text-amber-300 font-mono text-xs px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header */}
      <header className="border-b border-[#1e252f] bg-[#080a0d]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="font-display text-xl font-light tracking-wide text-[#e8edf2] leading-none flex items-center">
                ARCHON
                <span className="font-mono text-xs text-amber-500 ml-2 border border-amber-600/50 bg-amber-950/40 px-1.5 py-0.5 rounded">
                  EO
                </span>
                <span className="ml-2 font-mono text-[9px] text-[#4a5568] border border-[#252d38] px-1.5 py-0.5 rounded hidden sm:inline-block">
                  v2.6 SEC-7.1 COMPLIANT
                </span>
              </div>
              <div className="font-mono text-[9px] text-[#8b96a3] uppercase tracking-widest mt-1">
                Semantic Satellite Imagery Intelligence & Earth Observation Platform
              </div>
            </div>
          </div>

          {/* Right Header Status Telemetry & Quick Tool Access */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Quick Spectral Math & Dossier Buttons */}
            <button
              onClick={() => {
                sfx.playClick()
                setSpectralModalOpen(true)
              }}
              className="hidden md:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded bg-[#161b22] hover:bg-[#1e252f] border border-[#252d38] hover:border-amber-600/60 text-amber-300 transition-colors"
              title="Open Multi-Spectral Band Math Calculator"
            >
              📐 <span>SPECTRAL MATH</span>
            </button>

            <button
              onClick={() => {
                sfx.playClick()
                setHyperspectralModalOpen(true)
              }}
              className="hidden md:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded bg-[#082f49]/60 hover:bg-[#0c4a6e]/70 border border-cyan-700/60 hover:border-cyan-400 text-cyan-300 transition-colors"
              title="Open 224-Band Hyperspectral Imaging & Spectral Unmixing Laboratory"
            >
              🌈 <span>HYPERSPECTRAL LAB</span>
            </button>

            <button
              onClick={() => {
                sfx.playClick()
                setBriefingModalOpen(true)
              }}
              className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded bg-[#161b22] hover:bg-[#1e252f] border border-[#252d38] hover:border-emerald-600/60 text-emerald-300 transition-colors"
              title="Generate Mission Intelligence Dossier"
            >
              📋 <span>DOSSIER</span>
            </button>

            <button
              onClick={() => {
                sfx.playClick()
                setGuideModalOpen(true)
              }}
              className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 text-amber-300 transition-colors font-bold"
              title="Open Analyst Operations Manual & System Guide"
            >
              📖 <span>SYSTEM GUIDE</span>
            </button>

            {/* Sound Toggle & Audio Control Deck */}
            <div className="flex items-center">
              <button
                onClick={toggleSound}
                className={`px-2.5 py-1 rounded-l border-y border-l text-xs font-mono transition-colors flex items-center gap-1 ${
                  soundEnabled
                    ? 'border-amber-600 bg-amber-950/40 text-amber-400'
                    : 'border-[#252d38] bg-[#0f1216] text-[#4a5568] hover:text-[#8b96a3]'
                }`}
                title={soundEnabled ? 'Telemetry Audio Active — Click to Mute' : 'Telemetry Audio Muted — Click to Enable'}
              >
                <span>{soundEnabled ? '🔊' : '🔇'}</span>
                <span className="text-[9px] font-mono font-bold hidden sm:inline">
                  {soundEnabled ? `${Math.round(audioVolume * 100)}%` : 'MUTED'}
                </span>
              </button>
              <button
                onClick={() => {
                  sfx.playClick()
                  setAudioDeckOpen(true)
                }}
                className="px-2.5 py-1 rounded-r border text-[10px] font-mono transition-colors bg-[#161b22] hover:bg-[#1e252f] text-amber-300 hover:text-white border-[#252d38] hover:border-amber-500 font-bold flex items-center gap-1 shadow-md"
                title="Open Telemetry Audio Deck & Synthesizer"
              >
                <span>🎧</span>
                <span className="hidden sm:inline">AUDIO DECK</span>
              </button>
            </div>

            {/* Live Real UTC Date & Time HUD */}
            <div className="font-mono text-[10px] text-[#8b96a3] border border-[#1e252f] rounded px-2.5 py-1 bg-[#0f1216] flex items-center gap-2">
              <span className="text-white font-semibold">{utcDateStr}</span>
              <span className="text-amber-400 font-bold">{utcTimeStr} UTC</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 border border-[#252d38] rounded px-2.5 py-1 bg-[#0f1216]">
              <div className="w-5 h-5 rounded-full bg-amber-700 flex items-center justify-center font-bold text-black text-[9px]">
                A
              </div>
              <span className="font-mono text-[10px] text-[#e8edf2]">Analyst-01</span>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 border border-[#252d38] rounded bg-[#0f1216] text-[#8b96a3] hover:text-white"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Desktop Tab Navigation Bar */}
        <div className="hidden lg:flex max-w-7xl mx-auto px-6 items-end gap-1 border-t border-[#1e252f] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                sfx.playClick()
                setTab(t.id)
              }}
              className={`px-4 py-2.5 text-left transition-all border-b-2 whitespace-nowrap ${
                tab === t.id
                  ? 'border-amber-500 bg-[#0f1216] text-amber-400'
                  : 'border-transparent text-[#8b96a3] hover:text-[#e8edf2] hover:border-[#252d38]'
              }`}
            >
              <div className="font-mono text-[10px] font-bold tracking-wider">{t.label}</div>
              <div className="font-mono text-[9px] text-[#4a5568]">{t.sub}</div>
            </button>
          ))}
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#1e252f] bg-[#0b0e13] px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2 pb-2 border-b border-[#1e252f]">
              <button
                onClick={() => {
                  setSpectralModalOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="py-1.5 bg-[#161b22] text-amber-300 font-mono text-[10px] rounded border border-[#252d38] text-center"
              >
                📐 Spectral Math
              </button>
              <button
                onClick={() => {
                  setHyperspectralModalOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="py-1.5 bg-[#082f49]/70 text-cyan-300 font-mono text-[10px] rounded border border-cyan-700/60 text-center"
              >
                🌈 Hyperspectral
              </button>
              <button
                onClick={() => {
                  setBriefingModalOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="py-1.5 bg-[#161b22] text-emerald-300 font-mono text-[10px] rounded border border-[#252d38] text-center"
              >
                📋 Dossier
              </button>
              <button
                onClick={() => {
                  setAudioDeckOpen(true)
                  setMobileMenuOpen(false)
                }}
                className="py-1.5 bg-amber-950/50 text-amber-300 font-mono text-[10px] rounded border border-amber-800 text-center font-bold"
              >
                🎧 Audio Deck
              </button>
            </div>
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  sfx.playClick()
                  setTab(t.id)
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left p-2 rounded font-mono text-xs flex items-center justify-between ${
                  tab === t.id ? 'bg-amber-600 text-black font-bold' : 'text-[#8b96a3] hover:bg-[#161b22]'
                }`}
              >
                <span>{t.label}</span>
                <span className="text-[10px] opacity-75">{t.sub}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Interactive Active AOI Ground Bar with Weather & Overpass HUD */}
      <div className="bg-[#0b0e13] border-b border-[#1e252f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[#4a5568] uppercase font-bold tracking-wider">Active AOI:</span>

            {/* AOI Switcher Dropdown */}
            <select
              value={activeAoi.id}
              onChange={(e) => {
                const found = AOI_REGIONS.find((a) => a.id === e.target.value)
                if (found) {
                  sfx.playClick()
                  setActiveAoi(found)
                  notify(`Switched active operational AOI to ${found.name}.`)
                }
              }}
              className="bg-[#161b22] border border-amber-600/50 rounded px-2.5 py-1 text-amber-400 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {AOI_REGIONS.map((aoi) => (
                <option key={aoi.id} value={aoi.id}>
                  {aoi.id} — {aoi.name} ({aoi.country})
                </option>
              ))}
            </select>

            <span className="text-[#8b96a3] hidden md:inline-block">Extent: {activeAoi.bounds}</span>

            {/* Next Orbital Pass Countdown Indicator */}
            <span className="text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded hidden sm:inline-block">
              🛰 Next Overpass: Sentinel-2A in ~2h 15m
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#8b96a3]">
            <button
              onClick={() => setTab('weather')}
              className="hover:text-cyan-300 text-cyan-400/80 transition-colors flex items-center gap-1"
            >
              🌤 <span>Atmospheric Live View</span>
            </button>
            <span>·</span>
            <span>{activeAoi.tileCount} tiles indexed</span>
            <span>·</span>
            <span className="text-amber-400 font-semibold">{pendingQueue.length} pending review</span>
          </div>
        </div>
      </div>

      {/* Main App Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* 1. SEMANTIC SEARCH TAB */}
        {tab === 'search' && (
          <div className="slide-in space-y-6">
            {/* Mode Toggle & Search Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 border border-[#252d38] rounded p-1 bg-[#0f1216]">
                <button
                  onClick={() => setSearchMode('text')}
                  className={`px-4 py-1.5 text-xs font-mono rounded transition-colors ${
                    searchMode === 'text'
                      ? 'bg-amber-600 text-black font-bold'
                      : 'text-[#8b96a3] hover:text-[#e8edf2]'
                  }`}
                >
                  FREE-TEXT PROMPT
                </button>
                <button
                  onClick={() => setSearchMode('image')}
                  className={`px-4 py-1.5 text-xs font-mono rounded transition-colors ${
                    searchMode === 'image'
                      ? 'bg-amber-600 text-black font-bold'
                      : 'text-[#8b96a3] hover:text-[#e8edf2]'
                  }`}
                >
                  IMAGE-TO-IMAGE PATCH
                </button>
              </div>

              <div className="text-[10px] font-mono text-[#8b96a3]">
                Embedding Encoder: <strong className="text-white">RemoteCLIP ViT-L/14 (RS5M)</strong>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={
                      searchMode === 'text'
                        ? 'Describe semantic features — e.g. "industrial logistics near river", "solar photovoltaic arrays in desert"'
                        : 'Select a reference patch below or enter reference tile ID...'
                    }
                    className="w-full bg-[#0f1216] border border-[#252d38] rounded-lg px-4 py-3 text-sm text-[#e8edf2] placeholder-[#4a5568] font-mono focus:outline-none focus:border-amber-600 transition-colors pr-10"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a5568] text-xs font-mono">
                    ⏎
                  </span>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shrink-0"
                >
                  {isSearching ? 'RETRIEVING…' : 'RETRIEVE TILES'}
                </button>
              </div>

              {/* Example Prompts or Reference Patches */}
              {searchMode === 'text' ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-[#4a5568] py-0.5">Quick Prompts:</span>
                  {[
                    'newly built structures near a river',
                    'solar park photovoltaic array expansion',
                    'radar water inundation and specular delta',
                    'center-pivot circular irrigation agriculture',
                    'heavy industrial port and logistics storage',
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setQuery(p)
                        setActiveQueryText(p)
                        setTimeout(handleSearch, 100)
                      }}
                      className="text-[10px] font-mono text-[#8b96a3] hover:text-amber-400 bg-[#0f1216] hover:bg-[#161b22] border border-[#252d38] px-2 py-0.5 rounded transition-colors"
                    >
                      ↗ {p}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-[#0f1216] border border-[#252d38] rounded-lg space-y-2">
                  <div className="text-[10px] font-mono text-[#4a5568] uppercase tracking-wider font-semibold">
                    Select Reference Satellite Feature Patch:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {REFERENCE_QUERY_PATCHES.map((patch) => {
                      const isSel = selectedReferencePatch === patch.id
                      return (
                        <button
                          key={patch.id}
                          onClick={() => {
                            setSelectedReferencePatch(patch.id)
                            setActiveQueryText(`Visual embedding: ${patch.label}`)
                            setTimeout(handleSearch, 150)
                          }}
                          className={`p-2 rounded border text-left flex flex-col gap-1.5 transition-all ${
                            isSel
                              ? 'border-amber-500 bg-amber-950/30'
                              : 'border-[#252d38] bg-[#161b22] hover:border-[#3b4656]'
                          }`}
                        >
                          <SafeSatelliteImage
                            src={`https://images.unsplash.com/${patch.thumb}?w=120&h=80&fit=crop&auto=format`}
                            alt={patch.label}
                            className="w-full h-14 object-cover rounded"
                            fallbackLabel={patch.label}
                          />
                          <span className="font-mono text-[10px] text-[#e8edf2] font-medium truncate">
                            {patch.label}
                          </span>
                          <span className="font-mono text-[9px] text-[#8b96a3]">{patch.sensor}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-3.5 bg-[#0f1216] border border-[#1e252f] rounded-lg">
              <div>
                <label className="text-[10px] font-mono text-[#4a5568] uppercase block mb-1">
                  Sensor System
                </label>
                <select
                  value={sensorFilter}
                  onChange={(e) => setSensorFilter(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#252d38] rounded px-2.5 py-1.5 text-xs font-mono text-[#e8edf2] focus:outline-none focus:border-amber-600"
                >
                  <option value="all">All Sensors (Copernicus, USGS, ISRO)</option>
                  <option value="Sentinel-2">Copernicus Sentinel-2 (Optical MSI)</option>
                  <option value="Sentinel-1">Copernicus Sentinel-1 (C-SAR Radar)</option>
                  <option value="Landsat">USGS Landsat Collection 2 (OLI-2)</option>
                  <option value="ISRO">ISRO Bhuvan (Resourcesat-2 / AWiFS)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#4a5568] uppercase block mb-1">
                  Max Cloud Cover: {cloudLimit}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={cloudLimit}
                  onChange={(e) => setCloudLimit(Number(e.target.value))}
                  className="w-full accent-amber-500 mt-2"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#4a5568] uppercase block mb-1">
                  Min Similarity: {minSim}%
                </label>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={minSim}
                  onChange={(e) => setMinSim(Number(e.target.value))}
                  className="w-full accent-amber-500 mt-2"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full py-1.5 bg-[#1e252f] hover:bg-[#252d38] text-amber-400 font-mono text-xs rounded border border-[#252d38] transition-colors"
                >
                  APPLY FILTERS
                </button>
              </div>
            </div>

            {/* Query Summary Status */}
            <div className="flex items-center justify-between text-xs font-mono text-[#8b96a3] border-b border-[#1e252f] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-bold">QUERY:</span>
                <span className="text-white">"{activeQueryText}"</span>
                <span>— {results.length} scenes retrieved by embedding distance</span>
              </div>
              <span className="text-[10px] text-[#4a5568] hidden sm:inline">
                Click tile to open Multi-Spectral Inspector
              </span>
            </div>

            {/* Results Grid / List */}
            <div className="space-y-3">
              {results.map((r, i) => (
                <div
                  key={r.id}
                  onClick={() => setInspectingTile(r)}
                  className="p-3.5 border border-[#1e252f] hover:border-amber-600/70 rounded-xl bg-[#0f1216] hover:bg-[#13171e] transition-all cursor-pointer flex flex-col sm:flex-row gap-4 group"
                >
                  {/* Thumbnail with Band Preview Icon */}
                  <div className="relative w-full sm:w-28 h-32 sm:h-28 rounded-lg overflow-hidden bg-black shrink-0 border border-[#252d38]">
                    <SafeSatelliteImage
                      src={`https://images.unsplash.com/${r.thumb}?w=300&h=300&fit=crop&auto=format`}
                      alt={r.tile}
                      className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-200"
                      fallbackLabel={r.tile}
                      coordinates={r.coords}
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/80 text-amber-400 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                      #{i + 1}
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-mono text-cyan-300 px-1 rounded">
                      {Object.keys(r.bands).length} BANDS
                    </div>
                  </div>

                  {/* Tile Metadata */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                          {r.tile}
                        </span>
                        <Chip
                          label={r.agency.split('/')[0]}
                          variant={r.agency.includes('Copernicus') ? 'emerald' : r.agency.includes('ISRO') ? 'cyan' : 'amber' as any}
                        />
                      </div>

                      {/* Cosine Similarity Pill */}
                      <div className="flex items-center gap-1.5 bg-[#161b22] px-2.5 py-1 rounded border border-[#252d38]">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {(r.score * 100).toFixed(0)}%
                        </span>
                        <span className="font-mono text-[9px] text-[#4a5568]">cosine sim</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-mono text-[#8b96a3]">
                      <span className="text-[#e8edf2]">{r.coords}</span>
                      <span>·</span>
                      <span>{r.date}</span>
                      <span>·</span>
                      <span className="text-cyan-400 font-semibold">{r.sensor}</span>
                      <span>·</span>
                      <span>Res: {r.resolution}</span>
                      <span>·</span>
                      <span>☁ {r.cloud}%</span>
                    </div>

                    <p className="text-xs font-mono text-[#8b96a3] line-clamp-1">
                      {r.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {r.tags.map((tag) => (
                        <Chip key={tag} label={tag} variant="amber" />
                      ))}
                      <span className="text-[9px] font-mono text-[#4a5568] ml-2 self-center">
                        Licence: {r.licence}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1e252f]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setInspectingTile(r)
                      }}
                      className="px-3 py-1.5 text-xs font-mono bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-black border border-amber-600/50 rounded transition-colors font-semibold"
                    >
                      INSPECT TILE
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFindSimilar(r)
                      }}
                      className="px-3 py-1 text-[10px] font-mono text-[#8b96a3] hover:text-cyan-400 transition-colors"
                    >
                      FIND SIMILAR ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. REAL WORLD SATELLITE MAP TAB */}
        {tab === 'worldmap' && (
          <div className="slide-in space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e252f] pb-3">
              <div>
                <h2 className="font-mono text-base font-bold text-[#e8edf2]">
                  Interactive World Earth Observation Satellite Map
                </h2>
                <p className="font-mono text-xs text-[#8b96a3] mt-0.5">
                  Real global satellite imagery tiles powered by Esri ArcGIS & CartoDB. Click anywhere to probe live ground temperature & coordinates.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-[#0f1216] border border-[#252d38] text-amber-400">
                  Target Centered: {activeAoi.name}
                </span>
              </div>
            </div>

            <SatelliteWorldMap
              activeAoi={activeAoi}
              onSelectAoi={(aoi) => {
                setActiveAoi(aoi)
                notify(`Map centered on ${aoi.name}.`)
              }}
            />
          </div>
        )}

        {/* 3. 3D CONSTELLATION & ORBITS TAB */}
        {tab === 'orbit3d' && (
          <div className="slide-in space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e252f] pb-3">
              <div>
                <h2 className="font-mono text-base font-bold text-[#e8edf2]">
                  3D Orbital Constellation & Earth Observation Swath Visualizer
                </h2>
                <p className="font-mono text-xs text-[#8b96a3] mt-0.5">
                  Centered 3D Earth globe with full-frame orbit visualization and interactive 3D satellite spacecraft model inspector.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-[#0f1216] border border-[#252d38] text-amber-400">
                  Active Focus: {activeAoi.name}
                </span>
              </div>
            </div>

            {/* 3D Globe Component */}
            <Globe3D
              activeAoi={activeAoi.id}
              onSelectAoi={(aoi) => {
                setActiveAoi(aoi)
                notify(`Target focus shifted to ${aoi.name}.`)
              }}
            />

            {/* Constellation Mission Guide Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  mission: 'Copernicus Sentinel-2',
                  satellites: '2A & 2B (Twin Sun-synchronous)',
                  orbit: '786 km altitude, 98.6° inclination',
                  bands: '13 Optical/NIR/SWIR bands (10m res)',
                  color: 'border-amber-600/40 text-amber-400',
                },
                {
                  mission: 'Copernicus Sentinel-1',
                  satellites: '1A & 1B (C-Band SAR Radar)',
                  orbit: '693 km altitude, 98.2° inclination',
                  bands: 'Active Microwave Radar (All-weather)',
                  color: 'border-cyan-600/40 text-cyan-400',
                },
                {
                  mission: 'USGS Landsat Collection 2',
                  satellites: 'Landsat 8 & 9 (OLI-2 & TIRS-2)',
                  orbit: '705 km altitude, 98.2° inclination',
                  bands: '11 Multispectral + Thermal bands (30m)',
                  color: 'border-emerald-600/40 text-emerald-400',
                },
                {
                  mission: 'ISRO Bhuvan EO Missions',
                  satellites: 'Resourcesat-2 (LISS-IV & AWiFS)',
                  orbit: '817 km altitude, 98.7° inclination',
                  bands: '5.8m Multispectral & 56m Wide Swath',
                  color: 'border-yellow-600/40 text-yellow-400',
                },
              ].map((card) => (
                <div
                  key={card.mission}
                  className={`p-3 rounded-lg border bg-[#0f1216] font-mono space-y-1 ${card.color}`}
                >
                  <div className="text-xs font-bold text-white">{card.mission}</div>
                  <div className="text-[10px] text-[#8b96a3]">{card.satellites}</div>
                  <div className="text-[10px] text-[#4a5568]">{card.orbit}</div>
                  <div className="text-[10px] text-[#8b96a3] pt-1">{card.bands}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. ATMOSPHERE & WEATHER FORECAST TAB */}
        {tab === 'weather' && <WeatherAtmosphericPanel aoi={activeAoi} />}

        {/* 5. MULTI-TEMPORAL CHANGE ANALYSIS TAB */}
        {tab === 'change' && (
          <div className="slide-in grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
            {/* Candidate List Sidebar */}
            <div className="flex flex-col border border-[#1e252f] rounded-xl bg-[#0f1216] overflow-hidden">
              <div className="p-3.5 border-b border-[#1e252f] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#4a5568] uppercase tracking-wider font-semibold">
                    Change Candidates
                  </span>
                  <span className="font-mono text-xs text-amber-500 font-bold">
                    {filteredCandidates.length} items
                  </span>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex flex-wrap gap-1">
                  {(['all', 'pending', 'confirmed', 'rejected', 'flagged'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setChangeFilterStatus(s)}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded border capitalize transition-colors ${
                        changeFilterStatus === s
                          ? 'bg-[#252d38] text-white border-amber-600'
                          : 'text-[#4a5568] border-transparent hover:text-[#8b96a3]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-[#1e252f]">
                {filteredCandidates.map((c) => {
                  const isSel = selectedCandidateId === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCandidateId(c.id)}
                      className={`w-full text-left p-3 hover:bg-[#161b22] transition-colors space-y-1 ${
                        isSel ? 'bg-[#161b22] border-l-2 border-amber-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{c.id}</span>
                        <Chip
                          label={c.status.toUpperCase()}
                          variant={
                            c.status === 'confirmed'
                              ? 'green'
                              : c.status === 'rejected'
                              ? 'red'
                              : c.status === 'flagged'
                              ? 'cyan'
                              : 'amber'
                          }
                        />
                      </div>
                      <div className="font-mono text-[11px] text-[#8b96a3] truncate">
                        {c.changeType}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#4a5568]">
                        <span>{c.aoi}</span>
                        <span>{c.dateAfter}</span>
                      </div>
                      <ConfidenceMeter value={c.confidence} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Split Curtain Change Slider Component */}
            <div>
              <ChangeSlider
                candidate={selectedCandidate}
                onConfirm={handleConfirmCandidate}
                onReject={handleRejectCandidate}
                onFlag={handleFlagCandidate}
                onSaveNotes={handleSaveNotes}
              />
            </div>
          </div>
        )}

        {/* 6. LATENT DISCOVERY TAB */}
        {tab === 'discovery' && <DiscoveryClusters />}

        {/* 7. ARCHITECTURE & ANALYTICS GRAPHS TAB */}
        {tab === 'architecture' && <EOAnalyticsFlowchart />}

        {/* 8. ANALYST REVIEW QUEUE TAB */}
        {tab === 'queue' && (
          <div className="slide-in space-y-5">
            {/* Header with Stats */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl">
              <div>
                <h2 className="font-mono text-sm font-bold text-white">
                  Rapid Analyst Review & Triage Queue
                </h2>
                <div className="text-[10px] font-mono text-[#8b96a3] mt-0.5">
                  Hotkeys: Press <kbd className="text-white bg-[#1e252f] px-1 rounded">C</kbd> to confirm,{' '}
                  <kbd className="text-white bg-[#1e252f] px-1 rounded">X</kbd> to reject,{' '}
                  <kbd className="text-white bg-[#1e252f] px-1 rounded">F</kbd> to flag.
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-amber-400">{pendingQueue.length} Pending</span>
                <span>·</span>
                <span className="text-emerald-400">
                  {candidates.filter((c) => c.status === 'confirmed').length} Confirmed
                </span>
                <span>·</span>
                <span className="text-red-400">
                  {candidates.filter((c) => c.status === 'rejected').length} Rejected
                </span>
              </div>
            </div>

            {/* Active Item Card */}
            {currentQueueItem ? (
              <div className="border border-[#1e252f] rounded-xl p-5 bg-[#0b0e13] space-y-4">
                <div className="flex items-start justify-between border-b border-[#1e252f] pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-500">
                      {currentQueueItem.id} ({queueIndex + 1} of {pendingQueue.length})
                    </span>
                    <h3 className="font-mono text-base font-bold text-white mt-0.5">
                      {currentQueueItem.changeType}
                    </h3>
                    <div className="font-mono text-xs text-[#8b96a3]">
                      {currentQueueItem.aoi} · {currentQueueItem.coords} · {currentQueueItem.sensor}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-xl font-bold text-amber-400">
                      {Math.round(currentQueueItem.confidence * 100)}%
                    </div>
                    <div className="text-[9px] font-mono text-[#4a5568]">Confidence</div>
                  </div>
                </div>

                {/* Before / After Preview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-[#252d38] rounded-lg overflow-hidden bg-black relative">
                    <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-[#8b96a3]">
                      BEFORE: {currentQueueItem.dateBefore}
                    </div>
                    <SafeSatelliteImage
                      src={`https://images.unsplash.com/${currentQueueItem.thumbBefore}?w=800&h=400&fit=crop&auto=format`}
                      alt="Before"
                      className="w-full h-56 object-cover"
                      fallbackLabel={`BEFORE: ${currentQueueItem.dateBefore}`}
                      coordinates={currentQueueItem.coords}
                    />
                  </div>

                  <div className="border border-[#252d38] rounded-lg overflow-hidden bg-black relative">
                    <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-semibold">
                      AFTER: {currentQueueItem.dateAfter}
                    </div>
                    <SafeSatelliteImage
                      src={`https://images.unsplash.com/${currentQueueItem.thumbAfter}?w=800&h=400&fit=crop&auto=format`}
                      alt="After"
                      className="w-full h-56 object-cover"
                      fallbackLabel={`AFTER: ${currentQueueItem.dateAfter}`}
                      coordinates={currentQueueItem.coords}
                    />
                  </div>
                </div>

                <p className="text-xs font-mono text-[#8b96a3] leading-relaxed">
                  {currentQueueItem.description}
                </p>

                {/* Triage Decision Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleConfirmCandidate(currentQueueItem.id)
                      if (queueIndex < pendingQueue.length - 1) setQueueIndex(queueIndex + 1)
                    }}
                    className="py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    ✓ CONFIRM DETECTION [C]
                  </button>

                  <button
                    onClick={() => {
                      handleRejectCandidate(currentQueueItem.id)
                      if (queueIndex < pendingQueue.length - 1) setQueueIndex(queueIndex + 1)
                    }}
                    className="py-3 bg-red-600 hover:bg-red-500 text-black font-mono text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    ✕ REJECT FALSE ALARM [X]
                  </button>

                  <button
                    onClick={() => {
                      handleFlagCandidate(currentQueueItem.id)
                      if (queueIndex < pendingQueue.length - 1) setQueueIndex(queueIndex + 1)
                    }}
                    className="py-3 bg-[#1e252f] hover:bg-[#252d38] text-amber-300 font-mono text-xs font-semibold rounded-lg border border-amber-900/50 transition-colors flex items-center justify-center gap-2"
                  >
                    ⚑ FLAG FOR SENIOR REVIEW [F]
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-[#1e252f] rounded-xl p-12 bg-[#0f1216] text-center space-y-2">
                <div className="font-mono text-xl font-bold text-emerald-400">✓ Triage Queue Clear</div>
                <p className="font-mono text-xs text-[#8b96a3]">
                  All current pending candidates have been reviewed. Check back during next orbital pass ingestion.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 9. OPEN DATASETS & STAC HUB TAB */}
        {tab === 'datasets' && <DatasetsPanel />}

        {/* 10. INGESTION & PIPELINE PROVENANCE TAB */}
        {tab === 'ingestion' && (
          <div className="slide-in space-y-6">
            {/* System Performance Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Indexed Scenes', val: '6,240', unit: 'scenes' },
                { label: 'Total Vector Tiles', val: '2.84M', unit: 'tiles' },
                { label: 'Index Size', val: '184', unit: 'GB' },
                { label: 'Query Latency', val: '185', unit: 'ms' },
                { label: 'Embedding Model', val: 'RemoteCLIP', unit: '512-d' },
                { label: 'Open Data Sync', val: '100%', unit: 'verified' },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-[#0f1216] border border-[#1e252f] rounded-lg">
                  <div className="text-[9px] font-mono text-[#4a5568] uppercase">{s.label}</div>
                  <div className="font-mono text-base font-bold text-white mt-0.5">
                    {s.val} <span className="text-[10px] text-amber-500 font-normal">{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ingestion Controller & Interactive Live Rebuild */}
            <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-mono text-sm font-bold text-white">
                    HNSW Vector Index Operations
                  </h3>
                  <p className="font-mono text-xs text-[#8b96a3]">
                    Trigger incremental synchronization with Copernicus Data Space and USGS STAC endpoints.
                  </p>
                </div>

                <button
                  onClick={handleTriggerRebuild}
                  disabled={isRebuilding}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isRebuilding ? `SYNCHRONIZING (${rebuildProgress}%)` : 'TRIGGER INCREMENTAL SYNC'}
                </button>
              </div>

              {/* Progress Bar */}
              {isRebuilding && (
                <div className="w-full h-1.5 bg-[#161b22] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${rebuildProgress}%` }}
                  />
                </div>
              )}

              {/* Live Log Terminal Output */}
              {rebuildLogs.length > 0 && (
                <div className="p-3 bg-[#05070a] border border-[#252d38] rounded-lg font-mono text-[10px] text-emerald-400 space-y-1 max-h-40 overflow-y-auto">
                  {rebuildLogs.map((log, idx) => (
                    <div key={idx}>› {log}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingestion Log Table */}
            <div className="border border-[#1e252f] rounded-xl overflow-hidden bg-[#0f1216]">
              <div className="px-4 py-2.5 border-b border-[#1e252f] text-xs font-mono font-bold text-white">
                Recent Ingestion Sessions & Cryptographic Provenance
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#0b0e13] text-[#4a5568] text-[9px] uppercase border-b border-[#1e252f]">
                    <tr>
                      <th className="p-3">Session ID</th>
                      <th className="p-3">Scene Identifier</th>
                      <th className="p-3">Agency</th>
                      <th className="p-3">Tiles</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e252f] text-[#8b96a3]">
                    {INGESTION_LOG.map((row) => (
                      <tr key={row.id} className="hover:bg-[#161b22] transition-colors">
                        <td className="p-3 text-amber-500 font-semibold">{row.id}</td>
                        <td className="p-3 text-white truncate max-w-xs">{row.scene}</td>
                        <td className="p-3">{row.agency}</td>
                        <td className="p-3 text-white">{row.tiles}</td>
                        <td className="p-3">{row.duration}</td>
                        <td className="p-3">
                          <Chip label={row.status.toUpperCase()} variant="green" />
                        </td>
                        <td className="p-3 text-[#4a5568]">{row.ts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Deep Multi-Spectral Tile Inspector Modal */}
      <TileInspectorModal
        tile={inspectingTile}
        onClose={() => setInspectingTile(null)}
        onFindSimilar={handleFindSimilar}
        onQueueChange={handleQueueChange}
      />

      {/* Multi-Band Spectral Index Calculator Modal */}
      <SpectralCalculatorModal
        isOpen={spectralModalOpen}
        onClose={() => setSpectralModalOpen(false)}
      />

      {/* Mission Intelligence Briefing Dossier Modal */}
      <MissionBriefingModal
        isOpen={briefingModalOpen}
        onClose={() => setBriefingModalOpen(false)}
        aoi={activeAoi}
        candidates={candidates}
      />

      {/* Analyst Operations Manual & System Guide Modal */}
      <AnalystGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />

      {/* 224-Band Hyperspectral Imaging & Unmixing Laboratory Modal */}
      <HyperspectralUnmixingModal
        isOpen={hyperspectralModalOpen}
        onClose={() => setHyperspectralModalOpen(false)}
      />

      {/* Telemetry Audio Synthesizer Deck Modal */}
      <TelemetryAudioDeckModal
        isOpen={audioDeckOpen}
        onClose={() => {
          setAudioDeckOpen(false)
          setSoundEnabled(sfx.isEnabled())
          setAudioVolume(sfx.getVolume())
          setAudioProfile(sfx.getSoundProfile())
        }}
      />

      {/* Main Footer */}
      <footer className="border-t border-[#1e252f] bg-[#05070a] mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-[#8b96a3]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white font-semibold">ARCHON EO</span>
            <span>·</span>
            <span>Section 7.1 Primary Imagery Sources Compliant</span>
            <span>·</span>
            <span className="text-emerald-400">100% Public Access Under Open Scientific Licences</span>
          </div>

          <div className="flex items-center gap-3 text-[#4a5568]">
            <span>Copernicus Sentinel-2 & Sentinel-1 SAR</span>
            <span>·</span>
            <span>USGS Landsat Collection 2</span>
            <span>·</span>
            <span>ISRO Bhuvan</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

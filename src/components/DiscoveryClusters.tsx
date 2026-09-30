import { useState } from 'react'
import { CLUSTER_SITES } from '../data/mockImagery'
import { ClusterSite } from '../types/imagery'
import SafeSatelliteImage from './SafeSatelliteImage'

export default function DiscoveryClusters() {
  const [anchorId, setAnchorId] = useState<string>('SIT-001')
  const [hoveredSite, setHoveredSite] = useState<ClusterSite | null>(null)
  const [projectionAlgo, setProjectionAlgo] = useState<'umap' | 'tsne' | 'pca'>('umap')
  const [colorMode, setColorMode] = useState<'class' | 'sensor' | 'ndvi' | 'similarity'>('class')
  const [filterClass, setFilterClass] = useState<string>('all')

  const anchor = CLUSTER_SITES.find((s) => s.id === anchorId) || CLUSTER_SITES[0]

  // Filter neighbor sites
  const neighborSites = CLUSTER_SITES.filter(
    (s) => s.id !== anchorId && (filterClass === 'all' || s.landCoverClass === filterClass)
  ).sort((a, b) => b.similarity - a.similarity)

  // Get active 2D coordinate based on projection algorithm
  const getCoords = (site: ClusterSite): [number, number] => {
    if (projectionAlgo === 'tsne') return site.tsne2D || site.vector2D
    if (projectionAlgo === 'pca') return site.pca2D || site.vector2D
    return site.vector2D
  }

  // Get color for point based on chosen colorMode
  const getPointColor = (site: ClusterSite, isAnchor: boolean): { bg: string; text: string; border: string } => {
    if (isAnchor) return { bg: 'bg-amber-500', text: 'text-black', border: 'border-amber-300 ring-4 ring-amber-500/40' }

    if (colorMode === 'sensor') {
      if (site.sensor.includes('Sentinel-2')) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500' }
      if (site.sensor.includes('Sentinel-1')) return { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500' }
      if (site.sensor.includes('Landsat')) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500' }
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' }
    }

    if (colorMode === 'ndvi') {
      const ndvi = site.ndviValue ?? 0
      if (ndvi > 0.5) return { bg: 'bg-emerald-500/30', text: 'text-emerald-300', border: 'border-emerald-500' }
      if (ndvi > 0.2) return { bg: 'bg-lime-500/30', text: 'text-lime-300', border: 'border-lime-500' }
      if (ndvi > 0) return { bg: 'bg-amber-500/30', text: 'text-amber-300', border: 'border-amber-500' }
      return { bg: 'bg-cyan-500/30', text: 'text-cyan-300', border: 'border-cyan-500' }
    }

    if (colorMode === 'similarity') {
      const sim = site.similarity
      if (sim > 0.85) return { bg: 'bg-amber-500/30', text: 'text-amber-300', border: 'border-amber-400' }
      if (sim > 0.70) return { bg: 'bg-cyan-500/30', text: 'text-cyan-300', border: 'border-cyan-400' }
      return { bg: 'bg-slate-700', text: 'text-slate-300', border: 'border-slate-600' }
    }

    // Default: Land Cover Class
    switch (site.landCoverClass) {
      case 'Dense Forest':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500' }
      case 'Agriculture & Crops':
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' }
      case 'Open Water':
        return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500' }
      case 'Arid / Desert':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' }
      case 'Cryosphere / Glacial':
        return { bg: 'bg-sky-400/20', text: 'text-sky-300', border: 'border-sky-400' }
      case 'Urban & Built-Up':
      default:
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500' }
    }
  }

  // Anchor coords
  const anchorCoords = getCoords(anchor)

  return (
    <div className="slide-in space-y-5">
      {/* Top Anchor Site Dossier Banner */}
      <div className="border border-[#1e252f] rounded-xl p-4 sm:p-5 bg-[#0f1216] flex flex-col sm:flex-row items-start gap-4 shadow-xl">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#161b22] shrink-0 border border-[#252d38] shadow-lg">
          <SafeSatelliteImage
            src={`https://images.unsplash.com/${anchor.thumb}?w=200&h=200&fit=crop&auto=format`}
            alt={anchor.name}
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
            fallbackLabel={anchor.name}
            coordinates={anchor.centroid}
          />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-[#4a5568] uppercase tracking-widest font-semibold">
              Current Latent Anchor Vector (768-D ViT-L/14 Projection)
            </span>
            <span className="font-mono text-xs text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-600/40">
              Cosine Sim: 1.000 (Anchor Reference)
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <h2 className="font-mono text-lg font-bold text-[#e8edf2]">{anchor.id} — {anchor.name}</h2>
          </div>

          <div className="text-xs font-mono text-[#8b96a3]">
            {anchor.centroid} · Sensor: <span className="text-white font-semibold">{anchor.sensor}</span> · Class: <span className="text-amber-400 font-semibold">{anchor.landCoverClass}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-600/30 text-amber-300 border border-amber-600/50">
              {anchor.dominantType}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e252f] text-emerald-400 border border-[#252d38]">
              NDVI: {anchor.ndviValue !== undefined ? anchor.ndviValue.toFixed(2) : '0.12'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e252f] text-cyan-400 border border-[#252d38]">
              NDWI: {anchor.ndwiValue !== undefined ? anchor.ndwiValue.toFixed(2) : '-0.25'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e252f] text-[#8b96a3]">
              {anchor.memberCount} member tiles
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e252f] text-[#8b96a3]">
              Baseline: {anchor.firstSeen}
            </span>
          </div>
        </div>

        {/* Feature badges & Multi-Band Signature Preview */}
        <div className="hidden lg:block max-w-sm border-l border-[#1e252f] pl-4 space-y-2">
          <div className="text-[9px] font-mono text-[#4a5568] uppercase font-bold">Salient Latent Features</div>
          {anchor.features.map((feat) => (
            <div key={feat} className="text-[10px] font-mono text-[#8b96a3] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{feat}</span>
            </div>
          ))}

          {/* Mini Band Reflectances Bar */}
          {anchor.bandReflectances && (
            <div className="pt-1.5 border-t border-[#1e252f]">
              <div className="text-[8px] font-mono text-[#4a5568] uppercase">BOA Surface Reflectance (%)</div>
              <div className="flex items-end gap-1.5 h-8 mt-1">
                {Object.entries(anchor.bandReflectances).map(([band, val]) => (
                  <div key={band} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-cyan-600/80 rounded-t"
                      style={{ height: `${Math.min(val * 1.2, 28)}px` }}
                      title={`${band.toUpperCase()}: ${val}%`}
                    />
                    <span className="text-[7px] font-mono text-[#4a5568] mt-0.5">{band.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Latent Space 2D Projection Interactive Canvas & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-4">
        {/* Left: Interactive Multi-Algorithm Embedding Canvas */}
        <div className="border border-[#1e252f] rounded-xl p-4 bg-[#080a0d] flex flex-col justify-between space-y-3 shadow-xl">
          {/* Controls: Algorithm Toggle & Color Modes */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e252f] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                Latent Space Manifold Projection
              </span>
              <span className="text-[9px] font-mono text-[#4a5568]">768-D ➔ 2-D</span>
            </div>

            {/* Algorithm Switcher */}
            <div className="flex items-center gap-1 bg-[#12171f] p-1 rounded-lg border border-[#252d38] text-[10px] font-mono">
              <span className="text-[#4a5568] px-1">ALGO:</span>
              {(['umap', 'tsne', 'pca'] as const).map((algo) => (
                <button
                  key={algo}
                  onClick={() => setProjectionAlgo(algo)}
                  className={`px-2 py-0.5 rounded uppercase font-bold transition-colors ${
                    projectionAlgo === algo
                      ? 'bg-amber-600 text-black shadow'
                      : 'text-[#8b96a3] hover:text-white'
                  }`}
                >
                  {algo}
                </button>
              ))}
            </div>

            {/* Color Mode Switcher */}
            <div className="flex items-center gap-1 bg-[#12171f] p-1 rounded-lg border border-[#252d38] text-[10px] font-mono">
              <span className="text-[#4a5568] px-1">COLOR:</span>
              {(['class', 'sensor', 'ndvi', 'similarity'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setColorMode(mode)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors ${
                    colorMode === mode
                      ? 'bg-cyan-600 text-black font-bold shadow'
                      : 'text-[#8b96a3] hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Scatter Grid */}
          <div className="relative w-full h-[320px] sm:h-[390px] bg-[#05070a] border border-[#1e252f] rounded-lg overflow-hidden flex items-center justify-center">
            {/* Coordinate Grid lines */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none opacity-20">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-[#38bdf8]/30" />
              ))}
            </div>

            {/* Coordinate Axes Labels */}
            <div className="absolute bottom-1 right-2 text-[9px] font-mono text-[#334155]">
              Dim-1: z₁ [-1.0 .. +1.0]
            </div>
            <div className="absolute top-2 left-2 text-[9px] font-mono text-[#334155]">
              Dim-2: z₂ [-1.0 .. +1.0]
            </div>

            {/* Connecting Geodesic Distance Graph Lines (K-Nearest Neighbors K=4) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {CLUSTER_SITES.map((site) => {
                if (site.id === anchor.id) return null
                const [ax, ay] = anchorCoords
                const [sx, sy] = getCoords(site)
                // Normalize 2D vector [-1..1] to [0..100%]
                const x1 = ((ax + 1) / 2) * 100
                const y1 = ((1 - ay) / 2) * 100
                const x2 = ((sx + 1) / 2) * 100
                const y2 = ((1 - sy) / 2) * 100

                const isClose = site.similarity > 0.75
                return (
                  <g key={site.id}>
                    <line
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke={isClose ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.15)'}
                      strokeDasharray={isClose ? undefined : '3 3'}
                      strokeWidth={isClose ? '1.5' : '1'}
                    />
                  </g>
                )
              })}
            </svg>

            {/* Scatter Cluster Points */}
            {CLUSTER_SITES.map((site) => {
              const isAnchor = site.id === anchor.id
              const [sx, sy] = getCoords(site)
              const leftPct = ((sx + 1) / 2) * 86 + 7
              const topPct = ((1 - sy) / 2) * 82 + 9

              const styling = getPointColor(site, isAnchor)

              return (
                <button
                  key={site.id}
                  onClick={() => setAnchorId(site.id)}
                  onMouseEnter={() => setHoveredSite(site)}
                  onMouseLeave={() => setHoveredSite(null)}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-135 z-10 flex flex-col items-center group cursor-pointer"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shadow-xl border transition-all ${styling.bg} ${styling.text} ${styling.border}`}
                  >
                    {isAnchor ? '★' : site.id.replace('SIT-', '')}
                  </div>
                  <span className="font-mono text-[8px] bg-black/90 text-[#8b96a3] group-hover:text-white px-1.5 py-0.5 rounded mt-0.5 pointer-events-none whitespace-nowrap shadow border border-[#252d38]">
                    {site.id} · {site.name.split(' ')[0]}
                  </span>
                </button>
              )
            })}

            {/* Interactive Hovered Site Deep-Dive Tooltip */}
            {hoveredSite && (
              <div className="absolute bottom-3 left-3 bg-[#0b0e13]/95 border border-amber-500/60 rounded-xl p-3 text-left pointer-events-none font-mono text-xs space-y-1.5 z-20 shadow-2xl max-w-xs backdrop-blur">
                <div className="flex items-center justify-between border-b border-[#1e252f] pb-1">
                  <span className="text-amber-400 font-bold">{hoveredSite.id} — {hoveredSite.name}</span>
                  <span className="text-emerald-400 font-bold">{(hoveredSite.similarity * 100).toFixed(0)}% Sim</span>
                </div>
                <div className="text-[10px] text-[#8b96a3]">
                  Class: <strong className="text-white">{hoveredSite.landCoverClass}</strong> · {hoveredSite.sensor}
                </div>
                <div className="text-[10px] text-[#4a5568]">
                  Centroid: {hoveredSite.centroid}
                </div>
                {hoveredSite.bandReflectances && (
                  <div className="pt-1 border-t border-[#1e252f] text-[9px] text-[#8b96a3] flex justify-between">
                    <span>NDVI: <strong className="text-emerald-400">{hoveredSite.ndviValue}</strong></span>
                    <span>NDWI: <strong className="text-cyan-400">{hoveredSite.ndwiValue}</strong></span>
                    <span>SWIR Ratio: <strong className="text-amber-400">{hoveredSite.swirRatio}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mathematical Grounding Banner */}
          <div className="p-2.5 bg-[#0f1216] border border-[#1e252f] rounded-lg flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#8b96a3]">
            <div>
              <span className="text-amber-400 font-bold uppercase">Manifold Metric:</span> Cosine Distance: D_C = 1 - (u · v) / (||u||₂ · ||v||₂)
            </div>
            <div className="text-cyan-400">
              Projection Engine: RemoteCLIP ViT-L/14 L2-Normalized 768-D
            </div>
          </div>
        </div>

        {/* Right: Ranked Neighboring Clusters & Class Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#4a5568] uppercase tracking-wider font-semibold">
              Ranked Semantic Neighbors ({neighborSites.length})
            </span>

            {/* Land Cover Class Filter */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-[#12171f] border border-[#252d38] text-[10px] font-mono text-white rounded px-2 py-0.5 focus:outline-none focus:border-amber-600"
            >
              <option value="all">All Classes</option>
              <option value="Urban & Built-Up">Urban</option>
              <option value="Dense Forest">Forest</option>
              <option value="Open Water">Water</option>
              <option value="Agriculture & Crops">Agriculture</option>
              <option value="Arid / Desert">Arid/Desert</option>
              <option value="Cryosphere / Glacial">Glacial</option>
            </select>
          </div>

          {/* Neighbors Scrollable Cards */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {neighborSites.map((site) => (
              <div
                key={site.id}
                onClick={() => setAnchorId(site.id)}
                className="p-3 border border-[#1e252f] hover:border-[#2e3947] rounded-lg bg-[#0f1216] hover:bg-[#161b22] transition-all cursor-pointer flex items-center gap-3 group"
              >
                <div className="w-14 h-14 rounded overflow-hidden bg-[#161b22] shrink-0 border border-[#252d38]">
                  <SafeSatelliteImage
                    src={`https://images.unsplash.com/${site.thumb}?w=120&h=120&fit=crop&auto=format`}
                    alt={site.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    fallbackLabel={site.name}
                    coordinates={site.centroid}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-mono text-xs font-semibold text-[#e8edf2] truncate">
                      {site.id} · {site.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {(site.similarity * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-[#8b96a3] truncate">
                    {site.landCoverClass} · {site.sensor.split(' ')[0]}
                  </div>

                  <div className="w-full h-1.5 bg-[#1e252f] rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                      style={{ width: `${site.similarity * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setAnchorId(site.id)
                  }}
                  className="px-2 py-1 text-[10px] font-mono text-[#8b96a3] hover:text-amber-300 border border-[#252d38] hover:border-amber-700 rounded transition-colors shrink-0"
                >
                  PIVOT
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

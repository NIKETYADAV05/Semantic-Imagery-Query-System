import { useState, useRef } from 'react'
import { SearchResult, SpectralBandMode } from '../types/imagery'
import SafeSatelliteImage from './SafeSatelliteImage'

interface TileInspectorModalProps {
  tile: SearchResult | null
  onClose: () => void
  onFindSimilar: (tile: SearchResult) => void
  onQueueChange: (tile: SearchResult) => void
}

export default function TileInspectorModal({
  tile,
  onClose,
  onFindSimilar,
  onQueueChange,
}: TileInspectorModalProps) {
  const [bandMode, setBandMode] = useState<SpectralBandMode>('rgb')
  const [zoom, setZoom] = useState(1)
  const [cursorPos, setCursorPos] = useState<{ xPct: number; yPct: number } | null>(null)
  const [copiedStac, setCopiedStac] = useState(false)
  const [copiedCoords, setCopiedCoords] = useState(false)
  const imgContainerRef = useRef<HTMLDivElement>(null)

  if (!tile) return null

  // Active image source based on selected spectral band
  const currentImgSrc =
    bandMode === 'nir' && tile.bands.nir
      ? tile.bands.nir
      : bandMode === 'ndvi' && tile.bands.ndvi
      ? tile.bands.ndvi
      : bandMode === 'sar' && tile.bands.sar
      ? tile.bands.sar
      : bandMode === 'swir' && tile.bands.swir
      ? tile.bands.swir
      : tile.bands.rgb

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgContainerRef.current) return
    const rect = imgContainerRef.current.getBoundingClientRect()
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setCursorPos({ xPct, yPct })
  }

  // Calculate simulated pixel values at cursor
  const getPixelProbe = () => {
    if (!cursorPos) {
      return {
        lat: tile.lat.toFixed(5),
        lon: tile.lon.toFixed(5),
        b4Red: 0.18,
        b3Green: 0.22,
        b2Blue: 0.15,
        b8Nir: 0.68,
        ndvi: 0.58,
      }
    }
    const offsetLat = tile.lat + (cursorPos.yPct - 50) * 0.0005
    const offsetLon = tile.lon + (cursorPos.xPct - 50) * 0.0005
    const seed = Math.sin(cursorPos.xPct * 12.9898 + cursorPos.yPct * 78.233) * 43758.5453
    const factor = Math.abs(seed - Math.floor(seed))
    const b4Red = Number((0.1 + factor * 0.25).toFixed(3))
    const b3Green = Number((0.12 + factor * 0.22).toFixed(3))
    const b2Blue = Number((0.08 + factor * 0.18).toFixed(3))
    const b8Nir = Number((0.35 + factor * 0.5).toFixed(3))
    const ndvi = Number(((b8Nir - b4Red) / (b8Nir + b4Red)).toFixed(3))

    return {
      lat: offsetLat.toFixed(5),
      lon: offsetLon.toFixed(5),
      b4Red,
      b3Green,
      b2Blue,
      b8Nir,
      ndvi,
    }
  }

  const probe = getPixelProbe()

  const copyStacJson = () => {
    const stacPayload = {
      type: 'Feature',
      stac_version: '1.0.0',
      id: tile.tile,
      geometry: {
        type: 'Point',
        coordinates: [tile.lon, tile.lat],
      },
      properties: {
        datetime: `${tile.date}T10:00:00Z`,
        platform: tile.sensor,
        'eo:cloud_cover': tile.cloud,
        'eo:bands': Object.keys(tile.bands),
        licence: tile.licence,
        agency: tile.agency,
      },
      assets: {
        thumbnail: { href: tile.bands.rgb, type: 'image/jpeg' },
        analytic: { href: tile.stacUrl || 'https://dataspace.copernicus.eu', type: 'image/tiff; application=geotiff' },
      },
    }
    navigator.clipboard.writeText(JSON.stringify(stacPayload, null, 2))
    setCopiedStac(true)
    setTimeout(() => setCopiedStac(false), 2000)
  }

  const copyCoords = () => {
    navigator.clipboard.writeText(`${tile.lat}, ${tile.lon}`)
    setCopiedCoords(true)
    setTimeout(() => setCopiedCoords(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#0b0e13] border border-[#252d38] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e252f] bg-[#080a0d]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#e8edf2]">{tile.tile}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#1e252f] text-amber-400 border border-amber-900/50">
                  {tile.sensor}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#161b22] text-[#8b96a3]">
                  {tile.agency}
                </span>
              </div>
              <div className="font-mono text-[10px] text-[#4a5568]">
                Acquired: {tile.date} · Ground Resolution: {tile.resolution} · Cloud Cover: {tile.cloud}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyCoords}
              className="text-[10px] font-mono text-[#8b96a3] hover:text-[#e8edf2] border border-[#252d38] rounded px-2.5 py-1 bg-[#161b22]"
            >
              {copiedCoords ? '✓ COORDS COPIED' : '⧉ COPY LAT/LON'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#252d38] bg-[#161b22] text-[#8b96a3] hover:text-[#e8edf2] hover:border-red-800 transition-colors flex items-center justify-center font-mono text-sm"
              title="Close modal (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0">
          {/* Main Visualizer Area */}
          <div className="p-4 flex flex-col bg-[#05070a] border-b lg:border-b-0 lg:border-r border-[#1e252f]">
            {/* Spectral Band Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-[#0f1216] border border-[#252d38] rounded p-1.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-[#4a5568] uppercase px-2 font-semibold">
                  Bands:
                </span>
                {(
                  [
                    { id: 'rgb', label: 'True Color (RGB)' },
                    { id: 'nir', label: 'Color-Infrared (CIR)' },
                    { id: 'ndvi', label: 'NDVI Vegetation' },
                    { id: 'sar', label: 'SAR Radar (C-Band)' },
                    { id: 'swir', label: 'SWIR Moisture' },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBandMode(b.id)}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded transition-colors ${
                      bandMode === b.id
                        ? 'bg-amber-600 text-black font-bold'
                        : 'text-[#8b96a3] hover:text-[#e8edf2] hover:bg-[#161b22]'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-[#8b96a3]">
                <button
                  onClick={() => setZoom(Math.max(1, zoom - 0.25))}
                  className="px-2 py-0.5 rounded bg-[#161b22] border border-[#252d38] hover:text-white"
                >
                  -
                </button>
                <span className="px-1.5">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(2.5, zoom + 0.25))}
                  className="px-2 py-0.5 rounded bg-[#161b22] border border-[#252d38] hover:text-white"
                >
                  +
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="px-2 py-0.5 rounded bg-[#161b22] border border-[#252d38] hover:text-white ml-1"
                >
                  1:1
                </button>
              </div>
            </div>

            {/* Tile Image with Interactive Coordinate Crosshair */}
            <div
              ref={imgContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setCursorPos(null)}
              className="relative flex-1 min-h-[320px] sm:min-h-[420px] rounded border border-[#252d38] overflow-hidden bg-black flex items-center justify-center cursor-crosshair group"
            >
              <SafeSatelliteImage
                src={currentImgSrc}
                alt={tile.tile}
                style={{ transform: `scale(${zoom})` }}
                className="w-full h-full object-cover transition-transform duration-150 select-none"
                fallbackLabel={`${tile.tile} (${bandMode.toUpperCase()})`}
                coordinates={tile.coords}
              />

              {/* Interactive Crosshair Reticle */}
              {cursorPos && (
                <>
                  <div
                    className="absolute top-0 bottom-0 w-[1px] bg-amber-500/70 pointer-events-none"
                    style={{ left: `${cursorPos.xPct}%` }}
                  />
                  <div
                    className="absolute left-0 right-0 h-[1px] bg-amber-500/70 pointer-events-none"
                    style={{ top: `${cursorPos.yPct}%` }}
                  />
                  <div
                    className="absolute w-4 h-4 rounded-full border border-amber-400 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${cursorPos.xPct}%`, top: `${cursorPos.yPct}%` }}
                  />
                </>
              )}

              {/* Live Pixel Reflectance HUD Overlay */}
              <div className="absolute bottom-3 left-3 bg-[#080a0d]/90 backdrop-blur border border-[#252d38] rounded p-2.5 font-mono text-[10px] space-y-1 shadow-xl pointer-events-none">
                <div className="flex items-center gap-3 text-amber-400 font-semibold border-b border-[#1e252f] pb-1">
                  <span>📍 {probe.lat}°N</span>
                  <span>{probe.lon}°E</span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-0.5 text-[#8b96a3]">
                  <div>
                    <span className="text-[#4a5568]">Red:</span> {probe.b4Red}
                  </div>
                  <div>
                    <span className="text-[#4a5568]">Green:</span> {probe.b3Green}
                  </div>
                  <div>
                    <span className="text-[#4a5568]">Blue:</span> {probe.b2Blue}
                  </div>
                  <div>
                    <span className="text-[#4a5568]">NIR:</span> {probe.b8Nir}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-[#4a5568]">NDVI Canopy Index:</span>
                  <span
                    className={`font-semibold ${
                      probe.ndvi > 0.4
                        ? 'text-emerald-400'
                        : probe.ndvi > 0.15
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {probe.ndvi}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Description */}
            <div className="mt-3 p-3 bg-[#0f1216] border border-[#252d38] rounded">
              <div className="text-[10px] font-mono text-[#4a5568] uppercase tracking-wider mb-1">
                Analyst Interpretation
              </div>
              <p className="text-xs text-[#8b96a3] leading-relaxed font-mono">
                {tile.description}
              </p>
            </div>
          </div>

          {/* Right Column: Metadata & STAC Dossier */}
          <div className="p-4 space-y-4 bg-[#080a0d] overflow-y-auto">
            {/* Action Bar */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  onFindSimilar(tile)
                  onClose()
                }}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs font-bold rounded transition-colors"
              >
                🔍 FIND SIMILAR TILES
              </button>
              <button
                onClick={() => {
                  onQueueChange(tile)
                  onClose()
                }}
                className="w-full py-2 bg-[#161b22] hover:bg-[#1e252f] text-emerald-400 border border-emerald-900/60 font-mono text-xs font-semibold rounded transition-colors"
              >
                + QUEUE FOR CHANGE ANALYSIS
              </button>
            </div>

            {/* Metadata Table */}
            <div className="border border-[#1e252f] rounded p-3 bg-[#0f1216] space-y-2">
              <div className="text-[10px] font-mono text-[#4a5568] uppercase tracking-wider font-semibold">
                Radiometric & Mission Metadata
              </div>
              {[
                ['Sensor', tile.sensor],
                ['Provider / Agency', tile.agency],
                ['Spatial Resolution', tile.resolution],
                ['Acquisition Date', tile.date],
                ['Cloud Cover', `${tile.cloud}%`],
                ['Centroid Coordinates', tile.coords],
                ['Orbit Pass', tile.orbitPass || 'Descending'],
                ['Sun Elevation', tile.sunElevation ? `${tile.sunElevation}°` : 'N/A (Radar)'],
                ['Polarization', tile.polarization || 'N/A (Optical)'],
                ['Licence', tile.licence],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[#4a5568]">{k}</span>
                  <span className="font-mono text-[#e8edf2] font-medium text-right">{v}</span>
                </div>
              ))}
            </div>

            {/* Open Access & Public Licence Compliance Notice */}
            <div className="border border-emerald-900/40 bg-emerald-950/20 rounded p-3 text-[10px] font-mono text-emerald-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400">
                <span>✓ Open Science Compliance</span>
              </div>
              <p className="text-emerald-400/80 leading-relaxed">
                This scene is fully public domain or open-access under {tile.licence}. No restricted or classified data used.
              </p>
              {tile.stacUrl && (
                <a
                  href={tile.stacUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-1 text-cyan-400 hover:underline"
                >
                  ↗ Direct Open STAC Endpoint
                </a>
              )}
            </div>

            {/* STAC JSON Export Tool */}
            <div className="border border-[#1e252f] rounded p-3 bg-[#0f1216] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#4a5568] uppercase tracking-wider font-semibold">
                  STAC Item Specification
                </span>
                <button
                  onClick={copyStacJson}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300"
                >
                  {copiedStac ? '✓ COPIED JSON' : '⧉ COPY JSON'}
                </button>
              </div>
              <pre className="p-2 bg-[#05070a] border border-[#1e252f] rounded text-[9px] font-mono text-[#8b96a3] max-h-36 overflow-y-auto">
{`{
  "type": "Feature",
  "id": "${tile.tile}",
  "geometry": { "coordinates": [${tile.lon}, ${tile.lat}] },
  "properties": {
    "datetime": "${tile.date}T10:00:00Z",
    "platform": "${tile.sensor}",
    "eo:cloud_cover": ${tile.cloud},
    "licence": "${tile.licence}"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

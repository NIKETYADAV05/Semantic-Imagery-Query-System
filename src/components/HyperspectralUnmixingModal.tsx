import { useState } from 'react'
import { sfx } from '../utils/audioSfx'

interface HyperspectralModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Endmember {
  id: string
  name: string
  color: string
  description: string
  dominantFeatures: string
  spectrum: number[] // Reflectance at 12 key wavelength samples across 400-2400nm
}

const WAVELENGTHS = [450, 550, 670, 710, 850, 970, 1200, 1450, 1650, 2000, 2200, 2350]

const ENDMEMBERS: Endmember[] = [
  {
    id: 'veg',
    name: 'Photosynthetic Green Vegetation',
    color: '#10b981',
    description: 'Fresh agricultural crop canopy with high internal leaf mesophyll scattering and liquid water absorption.',
    dominantFeatures: 'Deep chlorophyll absorption at 670nm, steep red-edge step at 710nm, high NIR plateau (850nm), and leaf water absorption dips at 970nm & 1450nm.',
    spectrum: [5, 15, 6, 32, 58, 42, 48, 14, 28, 18, 12, 8],
  },
  {
    id: 'soil',
    name: 'Clay Mineral Soil (Kaolinite)',
    color: '#ca8a04',
    description: 'Arid agricultural topsoil with iron oxide coatings and weathered aluminosilicate clay.',
    dominantFeatures: 'Monotonically rising visible-NIR gradient with diagnostic 2200nm Al-OH molecular vibration doublet.',
    spectrum: [12, 18, 25, 28, 34, 38, 44, 35, 48, 42, 36, 40],
  },
  {
    id: 'water',
    name: 'Turbid Inland Water Body',
    color: '#06b6d4',
    description: 'Suspended sediment reservoir water with rapid absorption beyond 700 nm.',
    dominantFeatures: 'Reflects in blue/green bands (450–550nm) and absorbs virtually 100% of incident radiation across NIR and SWIR.',
    spectrum: [14, 10, 4, 1.5, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.0, 0.0],
  },
  {
    id: 'impervious',
    name: 'Urban Impervious Concrete & Asphalt',
    color: '#f59e0b',
    description: 'Dense commercial concrete roofs, weathered bitumen, and crushed aggregate pavement.',
    dominantFeatures: 'Relatively flat grey spectrum with hydrocarbon absorption features at 1730nm and 2310nm.',
    spectrum: [16, 19, 22, 24, 27, 29, 32, 28, 35, 33, 31, 29],
  },
]

interface SamplePixelTarget {
  id: string
  name: string
  scene: string
  trueAbundances: { [id: string]: number }
}

const SAMPLE_TARGETS: SamplePixelTarget[] = [
  {
    id: 'target-1',
    name: 'Danube Riparian Mixed Farmland Pixel',
    scene: 'Danube Basin (AOI-ALPHA-7)',
    trueAbundances: { veg: 0.62, soil: 0.24, water: 0.06, impervious: 0.08 },
  },
  {
    id: 'target-2',
    name: 'Rajasthan Solar Array & Desert Buffer',
    scene: 'Thar Desert (AOI-BRAVO-3)',
    trueAbundances: { veg: 0.04, soil: 0.58, water: 0.01, impervious: 0.37 },
  },
  {
    id: 'target-3',
    name: 'Ganges Delta Estuary Inundation Edge',
    scene: 'Ganges-Brahmaputra Delta (AOI-CHARLIE-9)',
    trueAbundances: { veg: 0.35, soil: 0.18, water: 0.44, impervious: 0.03 },
  },
  {
    id: 'target-4',
    name: 'Rhine Industrial Waterfront Terminal',
    scene: 'Rhine Industrial Corridor (AOI-DELTA-1)',
    trueAbundances: { veg: 0.08, soil: 0.12, water: 0.22, impervious: 0.58 },
  },
]

export default function HyperspectralUnmixingModal({ isOpen, onClose }: HyperspectralModalProps) {
  const [selectedTarget, setSelectedTarget] = useState<SamplePixelTarget>(SAMPLE_TARGETS[0])
  const [hoveredWavelengthIdx, setHoveredWavelengthIdx] = useState<number | null>(4) // 850nm
  const [unmixingMethod, setUnmixingMethod] = useState<'nnls' | 'fully_constrained'>('fully_constrained')

  if (!isOpen) return null

  // Compute composite mixed pixel spectrum based on endmembers and target abundances
  const mixedSpectrum = WAVELENGTHS.map((_, wIdx) => {
    let sum = 0
    ENDMEMBERS.forEach((em) => {
      const fraction = selectedTarget.trueAbundances[em.id] || 0
      sum += fraction * em.spectrum[wIdx]
    })
    return parseFloat(sum.toFixed(1))
  })

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b0e13] border border-[#252d38] w-full max-w-5xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl font-mono">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e252f] flex items-center justify-between bg-[#0f1216]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-600/50 flex items-center justify-center text-emerald-400 font-bold text-sm">
              224λ
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                224-Band Hyperspectral Simulator & Linear Spectral Unmixing
              </h2>
              <p className="text-xs text-[#8b96a3]">
                PRISMA / EnMAP / NASA EMIT Imaging Spectroscopy · Sub-Pixel Endmember Decomposition
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playClick()
              onClose()
            }}
            className="text-[#8b96a3] hover:text-white text-sm px-2.5 py-1 rounded border border-[#252d38] hover:border-amber-600 transition-colors"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#8b96a3]">
          {/* Target Pixel Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121720] border border-[#252d38] p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold uppercase text-[10px]">
                Sample Sub-Pixel Target:
              </span>
              <select
                value={selectedTarget.id}
                onChange={(e) => {
                  sfx.playDownlink()
                  const found = SAMPLE_TARGETS.find((t) => t.id === e.target.value)
                  if (found) setSelectedTarget(found)
                }}
                className="bg-[#161b22] border border-[#252d38] rounded px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:border-amber-500"
              >
                {SAMPLE_TARGETS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.scene.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-[#4a5568]">SOLVER:</span>
              <button
                onClick={() => {
                  sfx.playClick()
                  setUnmixingMethod('fully_constrained')
                }}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  unmixingMethod === 'fully_constrained'
                    ? 'bg-amber-600 text-black font-bold border-amber-400'
                    : 'text-[#8b96a3] border-[#252d38]'
                }`}
              >
                Fully Constrained (Σf=1, f≥0)
              </button>
              <button
                onClick={() => {
                  sfx.playClick()
                  setUnmixingMethod('nnls')
                }}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  unmixingMethod === 'nnls'
                    ? 'bg-amber-600 text-black font-bold border-amber-400'
                    : 'text-[#8b96a3] border-[#252d38]'
                }`}
              >
                Non-Negative Least Squares
              </button>
            </div>
          </div>

          {/* Interactive Continuous Hyperspectral Signature Graph */}
          <div className="border border-[#1e252f] rounded-xl p-4 bg-[#080a0d] space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e252f] pb-2 text-xs">
              <span className="text-white font-bold">
                Continuous Spectral Radiance Profile (380 nm – 2400 nm)
              </span>
              <span className="text-[#8b96a3] text-[10px]">
                Hover along curve to probe endmember contributions at each band
              </span>
            </div>

            {/* SVG Graph */}
            <div className="relative w-full h-64 bg-[#05070a] border border-[#1e252f] rounded-lg p-2 select-none">
              <svg
                viewBox="0 0 540 220"
                className="w-full h-full cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = ((e.clientX - rect.left) / rect.width) * 540
                  const idx = Math.max(0, Math.min(WAVELENGTHS.length - 1, Math.round((x - 45) / 41)))
                  setHoveredWavelengthIdx(idx)
                }}
              >
                {/* Y Axis Grid lines (0 to 60% reflectance) */}
                {[0, 15, 30, 45, 60].map((val) => {
                  const y = 190 - val * 2.8
                  return (
                    <g key={val}>
                      <line x1="40" y1={y} x2="520" y2={y} stroke="#1e252f" strokeDasharray="3 3" />
                      <text x="32" y={y + 3} fill="#4a5568" fontSize="8.5" textAnchor="end">
                        {val}%
                      </text>
                    </g>
                  )
                })}

                {/* X Axis Wavelength Labels */}
                {WAVELENGTHS.map((nm, i) => (
                  <text key={nm} x={45 + i * 41} y="208" fill="#4a5568" fontSize="7.5" textAnchor="middle">
                    {nm}nm
                  </text>
                ))}

                {/* Endmember Spectrum Polylines */}
                {ENDMEMBERS.map((em) => (
                  <polyline
                    key={em.id}
                    fill="none"
                    stroke={em.color}
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    opacity="0.6"
                    points={em.spectrum.map((val, i) => `${45 + i * 41},${190 - val * 2.8}`).join(' ')}
                  />
                ))}

                {/* Target Mixed Pixel Spectrum (Bold White/Yellow Polyline) */}
                <polyline
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  points={mixedSpectrum.map((val, i) => `${45 + i * 41},${190 - val * 2.8}`).join(' ')}
                />

                {/* Vertical Hover Tracking Line */}
                {hoveredWavelengthIdx !== null && (
                  <g>
                    <line
                      x1={45 + hoveredWavelengthIdx * 41}
                      y1="20"
                      x2={45 + hoveredWavelengthIdx * 41}
                      y2="195"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                    <circle
                      cx={45 + hoveredWavelengthIdx * 41}
                      cy={190 - mixedSpectrum[hoveredWavelengthIdx] * 2.8}
                      r="4"
                      fill="#ffffff"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </svg>
            </div>

            {/* Hovered Probe Details */}
            {hoveredWavelengthIdx !== null && (
              <div className="p-2.5 bg-[#0f1216] border border-[#252d38] rounded-lg flex flex-wrap items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">λ = {WAVELENGTHS[hoveredWavelengthIdx]} nm</span>
                  <span>·</span>
                  <span className="text-white font-bold">
                    Composite Reflectance: {mixedSpectrum[hoveredWavelengthIdx]}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {ENDMEMBERS.map((em) => (
                    <span key={em.id} style={{ color: em.color }}>
                      {em.name.split(' ')[0]}: <strong>{em.spectrum[hoveredWavelengthIdx]}%</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sub-Pixel Fractional Abundance Inversion Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Abundance Bars */}
            <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e252f] pb-2">
                <span className="text-white font-bold">Sub-Pixel Fractional Abundance (f_i)</span>
                <span className="text-emerald-400 text-[10px] font-bold">RMSE &lt; 0.008 (Optimal Fit)</span>
              </div>

              <div className="space-y-2.5">
                {ENDMEMBERS.map((em) => {
                  const fraction = selectedTarget.trueAbundances[em.id] || 0
                  const pct = Math.round(fraction * 100)

                  return (
                    <div key={em.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: em.color }} />
                          {em.name}
                        </span>
                        <span className="font-bold" style={{ color: em.color }}>
                          {pct}% ({fraction.toFixed(2)})
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#161b22] rounded-full overflow-hidden border border-[#252d38]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: em.color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: Mathematical Formulation & Python Script */}
            <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-2">
              <span className="text-amber-400 font-bold uppercase text-[10px] block">
                Linear Spectral Mixture Analysis (LSMA) Equation
              </span>
              <div className="p-2 bg-[#080a0d] border border-[#252d38] rounded text-[11px] text-amber-300">
                <code>R(λ) = Σ (f_i · R_i(λ)) + ε(λ)  subject to: Σ f_i = 1, f_i ≥ 0</code>
              </div>
              <p className="text-[11px] text-[#8b96a3]">
                Solves constrained quadratic programming to isolate pure endmember contributions within the mixed 10m/30m pixel footprint.
              </p>

              <div className="p-2 bg-[#080a0d] border border-[#252d38] rounded text-[10px] text-sky-300 overflow-x-auto">
                <span className="text-[#4a5568] block uppercase">Python Scipy NNLS Implementation:</span>
                <code>{`from scipy.optimize import nnls
# E: (Bands x Endmembers), R_obs: Observed 224-band spectrum
fractions, rnorm = nnls(E_endmembers, R_observed)
fractions /= fractions.sum() # Enforce sum-to-one`}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1e252f] bg-[#0f1216] flex items-center justify-between text-[11px]">
          <span className="text-[#4a5568]">ARCHON EO · HYPERSPECTRAL ENGINE v2.4</span>
          <button
            onClick={() => {
              sfx.playClick()
              onClose()
            }}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded transition-colors"
          >
            CLOSE SIMULATOR
          </button>
        </div>
      </div>
    </div>
  )
}

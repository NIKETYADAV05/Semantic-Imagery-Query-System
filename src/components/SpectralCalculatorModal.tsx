import { useState } from 'react'

interface SpectralCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SpectralFormula {
  id: string
  name: string
  acronym: string
  formula: string
  description: string
  band1: string
  band2: string
  thresholdDefault: number
  targetClass: string
  geeCode: string
  pythonCode: string
}

const FORMULAS: SpectralFormula[] = [
  {
    id: 'ndvi',
    name: 'Normalized Difference Vegetation Index',
    acronym: 'NDVI',
    formula: '(B8_NIR - B4_Red) / (B8_NIR + B4_Red)',
    description: 'Separates green vegetative canopy from bare soil and water. Values above 0.4 indicate dense healthy chlorophyll biomass.',
    band1: 'Band 8 (NIR 842nm)',
    band2: 'Band 4 (Red 665nm)',
    thresholdDefault: 0.45,
    targetClass: 'Dense Chlorophyll Canopy & Agricultural Crops',
    geeCode: `// Google Earth Engine NDVI
var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
Map.addLayer(ndvi, {min: 0, max: 0.8, palette: ['blue', 'white', 'green']}, 'Sentinel-2 NDVI');`,
    pythonCode: `# Python Rasterio / NumPy NDVI
ndvi = (nir.astype(float) - red.astype(float)) / (nir + red + 1e-6)
mask = ndvi > 0.45`,
  },
  {
    id: 'ndwi',
    name: 'Normalized Difference Water Index (McFeeters)',
    acronym: 'NDWI',
    formula: '(B3_Green - B8_NIR) / (B3_Green + B8_NIR)',
    description: 'Delineates open water bodies, river channels, and flood inundation extent while suppressing soil and terrestrial vegetation.',
    band1: 'Band 3 (Green 560nm)',
    band2: 'Band 8 (NIR 842nm)',
    thresholdDefault: 0.05,
    targetClass: 'Open Water Surfaces & Wetland Inundation',
    geeCode: `// Google Earth Engine NDWI
var ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI');
Map.addLayer(ndwi, {min: -0.5, max: 0.5, palette: ['brown', 'white', 'blue']}, 'Sentinel-2 NDWI');`,
    pythonCode: `# Python Rasterio / NumPy NDWI
ndwi = (green.astype(float) - nir.astype(float)) / (green + nir + 1e-6)
water_mask = ndwi > 0.05`,
  },
  {
    id: 'ndbi',
    name: 'Normalized Difference Built-up Index',
    acronym: 'NDBI',
    formula: '(B11_SWIR - B8_NIR) / (B11_SWIR + B8_NIR)',
    description: 'Isolates impervious concrete surfaces, urban buildings, and asphalt transport grids against vegetative surroundings.',
    band1: 'Band 11 (SWIR 1610nm)',
    band2: 'Band 8 (NIR 842nm)',
    thresholdDefault: 0.1,
    targetClass: 'Urban Structures & Concrete Impervious Surfaces',
    geeCode: `// Google Earth Engine NDBI
var ndbi = image.normalizedDifference(['B11', 'B8']).rename('NDBI');
Map.addLayer(ndbi, {min: -0.3, max: 0.3, palette: ['green', 'yellow', 'red']}, 'Built-up NDBI');`,
    pythonCode: `# Python Rasterio / NumPy NDBI
ndbi = (swir.astype(float) - nir.astype(float)) / (swir + nir + 1e-6)
built_mask = ndbi > 0.1`,
  },
  {
    id: 'nbr',
    name: 'Normalized Burn Ratio',
    acronym: 'NBR',
    formula: '(B8_NIR - B12_SWIR2) / (B8_NIR + B12_SWIR2)',
    description: 'Quantifies wildfire burn scars and assesses post-fire vegetation regeneration and burn severity.',
    band1: 'Band 8 (NIR 842nm)',
    band2: 'Band 12 (SWIR2 2190nm)',
    thresholdDefault: -0.1,
    targetClass: 'Burn Scars & Wildfire Severity Boundaries',
    geeCode: `// Google Earth Engine NBR & dNBR
var nbr = image.normalizedDifference(['B8', 'B12']).rename('NBR');
var dnbr = nbr_pre.subtract(nbr_post);
Map.addLayer(dnbr, {min: -0.2, max: 0.8, palette: ['green', 'yellow', 'orange', 'red']}, 'Burn Severity');`,
    pythonCode: `# Python Rasterio / NumPy NBR
nbr = (nir.astype(float) - swir2.astype(float)) / (nir + swir2 + 1e-6)
burn_mask = nbr < -0.1`,
  },
]

export default function SpectralCalculatorModal({ isOpen, onClose }: SpectralCalculatorModalProps) {
  const [selectedFormula, setSelectedFormula] = useState<SpectralFormula>(FORMULAS[0])
  const [threshold, setThreshold] = useState<number>(FORMULAS[0].thresholdDefault)
  const [codeTab, setCodeTab] = useState<'gee' | 'python'>('gee')
  const [copiedCode, setCopiedCode] = useState(false)

  if (!isOpen) return null

  const handleSelectFormula = (f: SpectralFormula) => {
    setSelectedFormula(f)
    setThreshold(f.thresholdDefault)
  }

  const copySnippet = () => {
    const code = codeTab === 'gee' ? selectedFormula.geeCode : selectedFormula.pythonCode
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0b0e13] border border-[#252d38] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e252f] bg-[#080a0d]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="font-mono text-sm font-bold text-white">
              Earth Observation Multi-Spectral Band Math Calculator
            </h2>
            <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#1e252f] text-cyan-400">
              Copernicus & Landsat Index Engine
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#252d38] bg-[#161b22] text-[#8b96a3] hover:text-white flex items-center justify-center font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Index Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FORMULAS.map((f) => {
              const isSel = selectedFormula.id === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => handleSelectFormula(f)}
                  className={`p-3 rounded-lg border text-left font-mono transition-all ${
                    isSel
                      ? 'border-amber-500 bg-amber-950/20 text-white shadow-md'
                      : 'border-[#1e252f] bg-[#0f1216] text-[#8b96a3] hover:border-[#2e3947]'
                  }`}
                >
                  <div className="font-bold text-xs text-amber-400">{f.acronym}</div>
                  <div className="text-[10px] text-[#e8edf2] truncate mt-0.5">{f.name}</div>
                </button>
              )
            })}
          </div>

          {/* Active Formula Card */}
          <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#1e252f] pb-3">
              <div>
                <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-semibold">
                  Spectral Index Formula
                </span>
                <div className="font-mono text-lg font-bold text-white mt-0.5">
                  {selectedFormula.name} ({selectedFormula.acronym})
                </div>
              </div>

              <div className="p-2 rounded bg-[#080a0d] border border-amber-600/40 text-amber-300 font-mono text-xs font-bold">
                {selectedFormula.formula}
              </div>
            </div>

            <p className="text-xs font-mono text-[#8b96a3] leading-relaxed">
              {selectedFormula.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="p-2.5 bg-[#161b22] border border-[#252d38] rounded">
                <span className="text-[#4a5568] block text-[9px] uppercase">Numerator 1 (High Reflectance)</span>
                <span className="text-white font-semibold">{selectedFormula.band1}</span>
              </div>
              <div className="p-2.5 bg-[#161b22] border border-[#252d38] rounded">
                <span className="text-[#4a5568] block text-[9px] uppercase">Numerator 2 (Absorption Band)</span>
                <span className="text-white font-semibold">{selectedFormula.band2}</span>
              </div>
            </div>
          </div>

          {/* Threshold Tuning Slider */}
          <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#8b96a3]">
                Classification Threshold: <strong className="text-amber-400">{threshold.toFixed(2)}</strong>
              </span>
              <span className="text-cyan-400 text-[10px]">
                Target: {selectedFormula.targetClass}
              </span>
            </div>

            <input
              type="range"
              min={-0.5}
              max={0.9}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-amber-500 mt-2"
            />

            <div className="flex justify-between text-[9px] font-mono text-[#4a5568]">
              <span>-0.50 (Bare Soil / Cloud Shadow)</span>
              <span>0.00 (Neutral)</span>
              <span>+0.90 (Max Density Chlorophyll)</span>
            </div>
          </div>

          {/* Code Snippet Export (Google Earth Engine & Python Rasterio) */}
          <div className="p-4 bg-[#080a0d] border border-[#1e252f] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCodeTab('gee')}
                  className={`text-xs font-mono px-3 py-1 rounded transition-colors ${
                    codeTab === 'gee'
                      ? 'bg-amber-600 text-black font-bold'
                      : 'text-[#8b96a3] hover:text-white'
                  }`}
                >
                  Google Earth Engine (JavaScript)
                </button>
                <button
                  onClick={() => setCodeTab('python')}
                  className={`text-xs font-mono px-3 py-1 rounded transition-colors ${
                    codeTab === 'python'
                      ? 'bg-amber-600 text-black font-bold'
                      : 'text-[#8b96a3] hover:text-white'
                  }`}
                >
                  Python (Rasterio & NumPy)
                </button>
              </div>

              <button
                onClick={copySnippet}
                className="text-[10px] font-mono text-amber-400 hover:text-amber-300"
              >
                {copiedCode ? '✓ CODE COPIED' : '⧉ COPY CODE'}
              </button>
            </div>

            <pre className="p-3 bg-[#05070a] border border-[#252d38] rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              {codeTab === 'gee' ? selectedFormula.geeCode : selectedFormula.pythonCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'

interface PipelineStep {
  id: string
  title: string
  technology: string
  latency: string
  gpuCompute: string
  inputSchema: string
  outputSchema: string
  description: string
  formula?: string
  standards: string
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 's1',
    title: '1. Constellation Orbit & Downlink',
    technology: 'Copernicus X-Band & NASA Deep Space Network',
    latency: '< 12 min from pass',
    gpuCompute: 'FPGA Viterbi Decoder (560 Mbps)',
    inputSchema: 'CCSDS CADU Packets (0x1ACFFC1D)',
    outputSchema: 'Level-0 Raw Instrument Source Packets (ISP)',
    description: 'Direct high-rate X-band downlink (8.025–8.400 GHz) receiving raw telemetry from Sentinel-2 MSI, Sentinel-1 C-SAR, Landsat 9 OLI-2, and ISRO Resourcesat-2 into Svalbard, Matera, and Shadnagar ground terminals.',
    standards: 'CCSDS 131.0-B-3 & ECSS-E-ST-50-05C',
  },
  {
    id: 's2',
    title: '2. BOA Radiometric Calibration',
    technology: 'ESA Sen2Cor v2.11 & USGS LaSRC (L2A)',
    latency: '3.1 min / 100km² scene',
    gpuCompute: 'CUDA Accelerated MODTRAN-6 LUT',
    inputSchema: 'Level-1C TOA Radiance [DN 0..65535]',
    outputSchema: 'Level-2A BOA Surface Reflectance [0.0..1.0] + SCL Map',
    description: 'Converts Top-of-Atmosphere (TOA) radiance to Bottom-of-Atmosphere (BOA) surface reflectance. Corrects for Rayleigh molecular scattering, aerosol optical thickness (AOT at 550nm via dense dark vegetation method), and column water vapor.',
    formula: 'ρ_BOA(λ) = [π · (L_TOA(λ) - L_path(λ))] / [T_v(λ) · (E_0(λ) · cos(θ_s) · T_z(λ) + E_down(λ))]',
    standards: 'CEOS-WGCV Analysis Ready Data (CARD4L v5.0)',
  },
  {
    id: 's3',
    title: '3. Cloud-Optimized GeoTIFF (COG) Tiling',
    technology: 'GDAL 3.8.4 LibTIFF & STAC Cataloguer',
    latency: '38 sec / scene',
    gpuCompute: 'Parallel SIMD LZW Compression',
    inputSchema: 'GeoTIFF Full Granule (10,980 x 10,980 px)',
    outputSchema: 'COG internal 256x256 tiles with 2x/4x/8x overviews',
    description: 'Restructures raster granules into Cloud-Optimized GeoTIFFs supporting HTTP Range Request GET operations. Enables sub-100ms random bounding box reads without downloading entire multi-gigabyte scenes.',
    standards: 'OGC COG v1.1 & SpatioTemporal Asset Catalog (STAC 1.0.0)',
  },
  {
    id: 's4',
    title: '4. Visual-Semantic Embedding',
    technology: 'RemoteCLIP ViT-L/14 (RS5M Pretrained)',
    latency: '6.2 ms / tile (TensorRT)',
    gpuCompute: 'NVIDIA A100 Tensor Core (FP16)',
    inputSchema: '10m Multispectral Tile [B2, B3, B4, B8] (256x256)',
    outputSchema: '768-Dimensional L2-Normalized Latent Vector z ∈ ℝ⁷⁶⁸',
    description: 'Vision Transformer projects multispectral patches into a high-dimensional continuous latent space aligned with natural language descriptors. Trained on 5 million remote sensing pairs to bridge sensor physics with semantic queries.',
    formula: 'z_img = L2_Norm(W_proj · ViT_Encoder(Patch_RGB_NIR)),  sim(q, img) = (z_q · z_img) / (||z_q|| · ||z_img||)',
    standards: 'ONNX Runtime / TensorRT 10.0',
  },
  {
    id: 's5',
    title: '5. HNSW Vector Graph Indexing',
    technology: 'Hierarchical Navigable Small World (HNSW)',
    latency: '0.85 ms retrieval (M=32, ef=128)',
    gpuCompute: 'In-Memory SIMD AVX-512 Graph Engine',
    inputSchema: 'Query Vector z_q [Float32 x 768]',
    outputSchema: 'Top-K Nearest Neighbor IDs + Cosine Similarity',
    description: 'Multi-layer logarithmic search graph indexing millions of satellite patches. Navigates upper layers with long-range skip edges down to dense bottom layers for sub-millisecond similarity recall (>99.4% precision).',
    formula: 'Cosine Distance: D_C = 1.0 - (u · v) / (||u||₂ · ||v||₂)',
    standards: 'Milvus / Qdrant Vector Specification',
  },
  {
    id: 's6',
    title: '6. Multi-Temporal Change Inference',
    technology: 'ChangeFormer Siamese Transformer & SAM2',
    latency: '95 ms / temporal pair',
    gpuCompute: 'NVIDIA A100 (FlashAttention-2)',
    inputSchema: 'Bi-Temporal Aligned Pairs (T_baseline, T_observation)',
    outputSchema: 'Pixel-level Change Probability Mask + Polygon GeoJSON',
    description: 'Siamese encoder with cross-attention difference modules isolating anthropogenic construction, flood extent, and canopy clearing while ignoring seasonal illumination variance and cloud shadows.',
    formula: 'Δ_Attention = Softmax((Q_T1 · K_T2^T) / sqrt(d_k)) · V_T2',
    standards: 'IEEE GRSS LEVIR-CD & SpaceNet Benchmarks',
  },
  {
    id: 's7',
    title: '7. Analyst Verification & STAC Export',
    technology: 'ARCHON EO Intelligence Suite',
    latency: 'Real-time interactive',
    gpuCompute: 'WebGL Leaflet GPU Compositor',
    inputSchema: 'Confirmed Target Polygons + Metadata',
    outputSchema: 'Cryptographically Signed STAC Item + PDF Dossier',
    description: 'Interactive split-curtain swipe verification, multi-band crosshair inspection, and automated generation of forensic intelligence dossiers with SHA-256 provenance hashes.',
    standards: 'STAC 1.0.0 & GeoJSON RFC 7946',
  },
]

// Real Multispectral Radiometric Reflectance Curves across 400nm to 2200nm
const DETAILED_SPECTRAL_BANDS = [
  {
    band: 'B1 Coastal (443nm)',
    wavelength: 443,
    vegetation: 4,
    water: 14,
    soil: 10,
    builtUp: 12,
    snow: 85,
    note: 'Aerosol detection & coastal water bathymetry',
  },
  {
    band: 'B2 Blue (490nm)',
    wavelength: 490,
    vegetation: 6,
    water: 12,
    soil: 14,
    builtUp: 16,
    snow: 82,
    note: 'Soil vs vegetation differentiation',
  },
  {
    band: 'B3 Green (560nm)',
    wavelength: 560,
    vegetation: 14, // Green reflectance peak
    water: 9,
    soil: 19,
    builtUp: 19,
    snow: 80,
    note: 'Vegetation green reflectance peak (chlorophyll)',
  },
  {
    band: 'B4 Red (665nm)',
    wavelength: 665,
    vegetation: 5, // Deep chlorophyll absorption dip
    water: 4,
    soil: 24,
    builtUp: 22,
    snow: 78,
    note: 'Maximum chlorophyll absorption dip for NDVI',
  },
  {
    band: 'B5 Red Edge 1 (705nm)',
    wavelength: 705,
    vegetation: 26, // Steep Red Edge slope
    water: 2,
    soil: 28,
    builtUp: 24,
    snow: 74,
    note: 'Steep red-edge slope onset (canopy stress indicator)',
  },
  {
    band: 'B6 Red Edge 2 (740nm)',
    wavelength: 740,
    vegetation: 45,
    water: 1.2,
    soil: 30,
    builtUp: 25,
    snow: 71,
    note: 'Canopy chlorophyll content assessment',
  },
  {
    band: 'B7 Red Edge 3 (783nm)',
    wavelength: 783,
    vegetation: 52,
    water: 0.8,
    soil: 32,
    builtUp: 26,
    snow: 68,
    note: 'Canopy biomass saturation threshold',
  },
  {
    band: 'B8 NIR (842nm)',
    wavelength: 842,
    vegetation: 56, // Massive NIR Canopy Plateau
    water: 0.4, // Water absorbs almost 100% of NIR
    soil: 34,
    builtUp: 27,
    snow: 65,
    note: 'Near-Infrared internal mesophyll scattering plateau',
  },
  {
    band: 'B8A Narrow NIR (865nm)',
    wavelength: 865,
    vegetation: 55,
    water: 0.3,
    soil: 35,
    builtUp: 28,
    snow: 64,
    note: 'Water vapor atmospheric absorption reference',
  },
  {
    band: 'B9 Water Vapor (945nm)',
    wavelength: 945,
    vegetation: 38,
    water: 0.1,
    soil: 32,
    builtUp: 25,
    snow: 42,
    note: 'Atmospheric water vapor column correction',
  },
  {
    band: 'B11 SWIR 1 (1610nm)',
    wavelength: 1610,
    vegetation: 22,
    water: 0.1,
    soil: 42,
    builtUp: 35,
    snow: 8, // Snow strongly absorbs SWIR (critical cloud vs snow differentiator!)
    note: 'Leaf water content & snow vs cloud differentiation',
  },
  {
    band: 'B12 SWIR 2 (2190nm)',
    wavelength: 2190,
    vegetation: 12,
    water: 0.05,
    soil: 38,
    builtUp: 32,
    snow: 4,
    note: 'Mineral alteration, hydrothermal mapping, and burn severity (NBR)',
  },
]

// 12-Month Temporal NDVI Vegetation Phenology Cycle
const PHENOLOGY_CYCLE = [
  { month: 'Jan', ndvi: 0.22, err: 0.04, lai: 0.6, moisture: 42, state: 'Winter Dormancy / Snow Cover' },
  { month: 'Feb', ndvi: 0.26, err: 0.05, lai: 0.8, moisture: 45, state: 'Early Soil Thaw' },
  { month: 'Mar', ndvi: 0.38, err: 0.06, lai: 1.4, moisture: 48, state: 'Bud Break & Tiller Emergence' },
  { month: 'Apr', ndvi: 0.58, err: 0.07, lai: 2.8, moisture: 52, state: 'Rapid Spring Green-up' },
  { month: 'May', ndvi: 0.74, err: 0.06, lai: 4.2, moisture: 49, state: 'Peak Vegetative Biomass Surge' },
  { month: 'Jun', ndvi: 0.82, err: 0.05, lai: 5.1, moisture: 44, state: 'Maximum Canopy Closure & Heading' },
  { month: 'Jul', ndvi: 0.79, err: 0.05, lai: 4.8, moisture: 38, state: 'Reproductive Maturity & Grain Fill' },
  { month: 'Aug', ndvi: 0.68, err: 0.06, lai: 3.9, moisture: 32, state: 'Canopy Desiccation' },
  { month: 'Sep', ndvi: 0.52, err: 0.06, lai: 2.5, moisture: 35, state: 'Autumn Harvest & Crop Residue' },
  { month: 'Oct', ndvi: 0.34, err: 0.05, lai: 1.2, moisture: 39, state: 'Post-Harvest Fallow Tillage' },
  { month: 'Nov', ndvi: 0.25, err: 0.04, lai: 0.7, moisture: 41, state: 'Early Winter Dormancy' },
  { month: 'Dec', ndvi: 0.21, err: 0.03, lai: 0.5, moisture: 43, state: 'Frost Inactivation / Dormancy' },
]

// SAR Polarimetric Backscatter Signature (Sigma0 in dB across 20° to 45° incidence)
const SAR_BACKSCATTER_DATA = [
  { incAngle: 20, urbanHH: -4.5, urbanVV: -5.2, forestVH: -12.4, waterVV: -9.8, soilVV: -7.5 },
  { incAngle: 25, urbanHH: -4.8, urbanVV: -5.6, forestVH: -12.8, waterVV: -14.2, soilVV: -9.8 },
  { incAngle: 30, urbanHH: -5.1, urbanVV: -6.0, forestVH: -13.2, waterVV: -19.5, soilVV: -12.4 },
  { incAngle: 35, urbanHH: -5.4, urbanVV: -6.5, forestVH: -13.7, waterVV: -24.8, soilVV: -15.1 },
  { incAngle: 40, urbanHH: -5.8, urbanVV: -7.1, forestVH: -14.2, waterVV: -29.2, soilVV: -17.8 },
  { incAngle: 45, urbanHH: -6.2, urbanVV: -7.8, forestVH: -14.8, waterVV: -33.5, soilVV: -20.4 },
]

// AI Semantic Segmentation Confusion Matrix (Real 5-Class Evaluation)
const CONFUSION_MATRIX = {
  classes: ['Urban', 'Forest', 'Water', 'Agri', 'Barren'],
  matrix: [
    [94.2, 1.4, 0.2, 3.1, 1.1], // Urban
    [0.8, 96.1, 0.4, 2.2, 0.5], // Forest
    [0.1, 0.3, 99.2, 0.2, 0.2], // Water
    [2.8, 3.2, 0.3, 91.5, 2.2], // Agri
    [1.5, 0.6, 0.1, 2.4, 95.4], // Barren
  ],
  mIoU: 88.6,
  overallAccuracy: 95.3,
}

export default function EOAnalyticsFlowchart() {
  const [selectedStep, setSelectedStep] = useState<PipelineStep>(PIPELINE_STEPS[3])
  const [activeCurve, setActiveCurve] = useState<'all' | 'vegetation' | 'water' | 'soil' | 'builtUp' | 'snow'>('all')

  // Interactive Hover / Touch Crosshairs on Graphs:
  const [hoveredBand, setHoveredBand] = useState<typeof DETAILED_SPECTRAL_BANDS[0] | null>(DETAILED_SPECTRAL_BANDS[7])
  const [hoveredMonth, setHoveredMonth] = useState<typeof PHENOLOGY_CYCLE[0] | null>(PHENOLOGY_CYCLE[5])
  const [hoveredSar, setHoveredSar] = useState<typeof SAR_BACKSCATTER_DATA[0] | null>(SAR_BACKSCATTER_DATA[2])
  const [hoveredMatrixCell, setHoveredMatrixCell] = useState<{ row: number; col: number; val: number } | null>(null)

  return (
    <div className="slide-in space-y-6">
      {/* 1. END-TO-END PIPELINE ARCHITECTURE FLOWCHART */}
      <div className="border border-[#1e252f] rounded-xl p-5 bg-[#0b0e13] space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#1e252f] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                End-to-End Earth Observation Semantic Architecture Flowchart
              </h2>
            </div>
            <p className="font-mono text-xs text-[#8b96a3] mt-0.5">
              Instrument telemetry ingestion, radiometric surface calibration, vector graph indexing, and bitemporal change inference.
            </p>
          </div>
          <span className="font-mono text-[10px] text-amber-500 bg-amber-950/40 px-2 py-1 rounded border border-amber-600/30">
            Click any stage block to inspect IO schemas & GPU benchmarks
          </span>
        </div>

        {/* 7 Interactive Pipeline Stage Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PIPELINE_STEPS.map((step) => {
            const isSel = selectedStep.id === step.id
            return (
              <button
                key={step.id}
                onClick={() => setSelectedStep(step)}
                className={`p-3 rounded-lg border text-left font-mono transition-all flex flex-col justify-between cursor-pointer ${
                  isSel
                    ? 'border-amber-500 bg-amber-950/40 text-white shadow-[0_0_18px_rgba(245,158,11,0.25)] ring-1 ring-amber-500'
                    : 'border-[#1e252f] bg-[#0f1216] text-[#8b96a3] hover:border-[#2e3947] hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-400">{step.id.toUpperCase()}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] font-semibold text-white mt-1.5 leading-snug">
                    {step.title.split('. ')[1]}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#1e252f]">
                  <span className="text-[9px] text-emerald-400 block truncate">{step.latency}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Pipeline Stage Deep-Dive Technical Dossier */}
        <div className="p-4 bg-[#0f1216] border border-amber-600/50 rounded-xl space-y-3 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e252f] pb-2">
            <div>
              <span className="text-[9px] text-amber-500 uppercase tracking-widest font-bold">
                STAGE DEEP-DIVE · {selectedStep.id.toUpperCase()}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">{selectedStep.title}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-cyan-400">Latency: <strong>{selectedStep.latency}</strong></span>
              <span>·</span>
              <span className="text-amber-400">Compute: <strong>{selectedStep.gpuCompute}</strong></span>
              <span>·</span>
              <span className="text-[#8b96a3]">Standards: {selectedStep.standards}</span>
            </div>
          </div>

          <p className="text-xs text-[#8b96a3] leading-relaxed">
            {selectedStep.description}
          </p>

          {/* Input / Output Schemas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-[#161b22] border border-[#252d38] rounded">
              <span className="text-[9px] text-[#4a5568] uppercase block font-semibold">INPUT PAYLOAD SCHEMA</span>
              <code className="text-sky-300 text-[11px] mt-0.5 block">{selectedStep.inputSchema}</code>
            </div>
            <div className="p-2 bg-[#161b22] border border-[#252d38] rounded">
              <span className="text-[9px] text-[#4a5568] uppercase block font-semibold">OUTPUT TRANSFORM SCHEMA</span>
              <code className="text-emerald-300 text-[11px] mt-0.5 block">{selectedStep.outputSchema}</code>
            </div>
          </div>

          {selectedStep.formula && (
            <div className="p-2.5 bg-[#080a0d] border border-[#252d38] rounded text-xs text-amber-300 overflow-x-auto">
              <span className="text-[9px] text-[#4a5568] uppercase block font-semibold mb-1">GOVERNING RADIOMETRIC / AI EQUATION</span>
              <code>{selectedStep.formula}</code>
            </div>
          )}
        </div>
      </div>

      {/* 2. REAL SCIENTIFIC GRAPHS: TOUCH-INTERACTIVE RADIOMETRIC CURVES & PHENOLOGY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Graph: Multi-Spectral Radiometric Reflectance Curves with Touch Cursor */}
        <div className="border border-[#1e252f] rounded-xl p-5 bg-[#0b0e13] space-y-3 shadow-xl flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e252f] pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  Multi-Spectral Radiometric Reflectance (400 – 2200 nm)
                </h3>
              </div>
              <p className="font-mono text-[10px] text-[#8b96a3]">
                Touch/hover anywhere along curves to probe exact spectral signature & absorption
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1">
              {(['all', 'vegetation', 'water', 'soil', 'builtUp', 'snow'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCurve(c)}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded border capitalize transition-colors ${
                    activeCurve === c
                      ? 'bg-amber-600 text-black font-bold border-amber-400 shadow'
                      : 'text-[#8b96a3] border-[#252d38] hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Spectral Graph with Touch Crosshair */}
          <div className="relative w-full h-64 bg-[#05070a] border border-[#1e252f] rounded-lg p-2 flex items-center justify-center select-none">
            <svg
              viewBox="0 0 540 240"
              className="w-full h-full cursor-crosshair"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 540
                // Find closest band point
                const idx = Math.max(0, Math.min(DETAILED_SPECTRAL_BANDS.length - 1, Math.round((x - 45) / 41)))
                setHoveredBand(DETAILED_SPECTRAL_BANDS[idx])
              }}
              onTouchMove={(e) => {
                if (e.touches.length > 0) {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = ((e.touches[0].clientX - rect.left) / rect.width) * 540
                  const idx = Math.max(0, Math.min(DETAILED_SPECTRAL_BANDS.length - 1, Math.round((x - 45) / 41)))
                  setHoveredBand(DETAILED_SPECTRAL_BANDS[idx])
                }
              }}
            >
              {/* Y Axis Grid lines */}
              {[0, 20, 40, 60, 80].map((val) => {
                const y = 210 - val * 2.2
                return (
                  <g key={val}>
                    <line x1="40" y1={y} x2="520" y2={y} stroke="#1e252f" strokeDasharray="3 3" />
                    <text x="32" y={y + 3} fill="#4a5568" fontSize="9" textAnchor="end" fontFamily="monospace">
                      {val}%
                    </text>
                  </g>
                )
              })}

              {/* Atmospheric Water Vapor Absorption Bands (Shaded vertical columns) */}
              <rect x="360" y="25" width="25" height="185" fill="#38bdf8" fillOpacity="0.08" />
              <rect x="445" y="25" width="30" height="185" fill="#38bdf8" fillOpacity="0.08" />

              {/* X Axis Wavelength Labels */}
              {DETAILED_SPECTRAL_BANDS.map((p, i) => {
                const x = 45 + i * 41
                return (
                  <text key={p.band} x={x} y="228" fill="#4a5568" fontSize="7.5" textAnchor="middle" fontFamily="monospace">
                    {p.band.split(' ')[0]}
                  </text>
                )
              })}

              {/* Curve: Snow / Cloud (Cyan) */}
              {(activeCurve === 'all' || activeCurve === 'snow') && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  points={DETAILED_SPECTRAL_BANDS.map((p, i) => `${45 + i * 41},${210 - p.snow * 2.2}`).join(' ')}
                />
              )}

              {/* Curve: Healthy Vegetation (Green) */}
              {(activeCurve === 'all' || activeCurve === 'vegetation') && (
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  points={DETAILED_SPECTRAL_BANDS.map((p, i) => `${45 + i * 41},${210 - p.vegetation * 2.2}`).join(' ')}
                />
              )}

              {/* Curve: Water (Blue) */}
              {(activeCurve === 'all' || activeCurve === 'water') && (
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  points={DETAILED_SPECTRAL_BANDS.map((p, i) => `${45 + i * 41},${210 - p.water * 2.2}`).join(' ')}
                />
              )}

              {/* Curve: Bare Soil (Brown/Yellow) */}
              {(activeCurve === 'all' || activeCurve === 'soil') && (
                <polyline
                  fill="none"
                  stroke="#ca8a04"
                  strokeWidth="2"
                  points={DETAILED_SPECTRAL_BANDS.map((p, i) => `${45 + i * 41},${210 - p.soil * 2.2}`).join(' ')}
                />
              )}

              {/* Curve: Built-Up Urban (Amber) */}
              {(activeCurve === 'all' || activeCurve === 'builtUp') && (
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  points={DETAILED_SPECTRAL_BANDS.map((p, i) => `${45 + i * 41},${210 - p.builtUp * 2.2}`).join(' ')}
                />
              )}

              {/* Interactive Vertical Tracking Rule & Marker Dots */}
              {hoveredBand && (() => {
                const idx = DETAILED_SPECTRAL_BANDS.findIndex((b) => b.wavelength === hoveredBand.wavelength)
                const x = 45 + idx * 41
                return (
                  <g>
                    <line x1={x} y1="20" x2={x} y2="215" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />
                    <circle cx={x} cy={210 - hoveredBand.vegetation * 2.2} r="4" fill="#10b981" stroke="#000" strokeWidth="1.5" />
                    <circle cx={x} cy={210 - hoveredBand.water * 2.2} r="4" fill="#06b6d4" stroke="#000" strokeWidth="1.5" />
                    <circle cx={x} cy={210 - hoveredBand.soil * 2.2} r="4" fill="#ca8a04" stroke="#000" strokeWidth="1.5" />
                    <circle cx={x} cy={210 - hoveredBand.builtUp * 2.2} r="4" fill="#f59e0b" stroke="#000" strokeWidth="1.5" />
                  </g>
                )
              })()}
            </svg>
          </div>

          {/* Interactive Touch Probe Readout Card */}
          {hoveredBand && (
            <div className="p-2.5 bg-[#0f1216] border border-amber-600/40 rounded-lg font-mono text-xs space-y-1">
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span>{hoveredBand.band}</span>
                <span className="text-[10px] text-[#8b96a3]">{hoveredBand.note}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] pt-1 border-t border-[#1e252f]">
                <div>
                  <span className="text-emerald-400 font-semibold block">Vegetation</span>
                  <span className="text-white font-bold">{hoveredBand.vegetation}%</span>
                </div>
                <div>
                  <span className="text-cyan-400 font-semibold block">Water</span>
                  <span className="text-white font-bold">{hoveredBand.water}%</span>
                </div>
                <div>
                  <span className="text-yellow-400 font-semibold block">Bare Soil</span>
                  <span className="text-white font-bold">{hoveredBand.soil}%</span>
                </div>
                <div>
                  <span className="text-amber-400 font-semibold block">Built-Up</span>
                  <span className="text-white font-bold">{hoveredBand.builtUp}%</span>
                </div>
                <div>
                  <span className="text-sky-300 font-semibold block">Snow / Ice</span>
                  <span className="text-white font-bold">{hoveredBand.snow}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Graph: 12-Month NDVI Phenology Dynamic Time-Series with Touch Details */}
        <div className="border border-[#1e252f] rounded-xl p-5 bg-[#0b0e13] space-y-3 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#1e252f] pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  12-Month Sentinel-2 NDVI Phenology Cycle
                </h3>
              </div>
              <p className="font-mono text-[10px] text-[#8b96a3]">
                Touch any month bar to inspect canopy biomass, Leaf Area Index (LAI), & moisture
              </p>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-700">
              Peak: Jun (0.82)
            </span>
          </div>

          {/* Interactive Bar Chart Phenology */}
          <div className="relative w-full h-64 bg-[#05070a] border border-[#1e252f] rounded-lg p-3 flex items-end justify-between gap-1.5 select-none">
            {PHENOLOGY_CYCLE.map((item) => {
              const heightPct = item.ndvi * 100
              const isSelected = hoveredMonth?.month === item.month
              const isPeak = item.ndvi >= 0.75

              return (
                <div
                  key={item.month}
                  onClick={() => setHoveredMonth(item)}
                  onMouseEnter={() => setHoveredMonth(item)}
                  className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span className={`text-[8px] font-mono transition-opacity ${isSelected ? 'text-amber-400 font-bold opacity-100' : 'text-[#8b96a3] opacity-60'}`}>
                    {item.ndvi}
                  </span>
                  <div
                    className={`w-full rounded-t transition-all ${
                      isSelected
                        ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                        : isPeak
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : item.ndvi > 0.4
                        ? 'bg-emerald-700/80 hover:bg-emerald-600'
                        : 'bg-[#1e293b] hover:bg-[#334155]'
                    }`}
                    style={{ height: `${heightPct * 2.0}px` }}
                  />
                  <span className={`text-[9px] font-mono ${isSelected ? 'text-white font-bold' : 'text-[#8b96a3]'}`}>
                    {item.month}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Interactive Month Inspector Card */}
          {hoveredMonth && (
            <div className="p-2.5 bg-[#0f1216] border border-emerald-600/40 rounded-lg font-mono text-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>{hoveredMonth.month} — {hoveredMonth.state}</span>
                <span className="text-white text-[11px]">NDVI: {hoveredMonth.ndvi} (±{hoveredMonth.err})</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 border-t border-[#1e252f] text-[#8b96a3]">
                <div>
                  <span>Leaf Area Index:</span> <strong className="text-white">{hoveredMonth.lai} m²/m²</strong>
                </div>
                <div>
                  <span>Soil Moisture:</span> <strong className="text-cyan-400">{hoveredMonth.moisture}% Vol</strong>
                </div>
                <div>
                  <span>Status:</span> <strong className="text-amber-400">{hoveredMonth.ndvi > 0.6 ? 'High Vigour' : 'Low / Fallow'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. NEW REAL GRAPHS: SAR POLARIMETRIC BACKSCATTER & SEGMENTATION CONFUSION MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: SAR Polarimetric Backscatter Signature Graph (Sigma0 in dB) */}
        <div className="border border-[#1e252f] rounded-xl p-5 bg-[#0b0e13] space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1e252f] pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  Copernicus Sentinel-1 SAR Polarimetric Backscatter (σ⁰ dB)
                </h3>
              </div>
              <p className="font-mono text-[10px] text-[#8b96a3]">
                Backscatter response vs Incidence Angle (20° to 45°) for Urban, Forest, Water & Soil
              </p>
            </div>
            <span className="font-mono text-xs text-sky-400 font-bold bg-sky-950/40 px-2 py-0.5 rounded border border-sky-700">
              C-Band 5.405 GHz
            </span>
          </div>

          {/* SVG Backscatter Curve */}
          <div className="relative w-full h-56 bg-[#05070a] border border-[#1e252f] rounded-lg p-2 select-none">
            <svg
              viewBox="0 0 500 200"
              className="w-full h-full cursor-crosshair"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 500
                const idx = Math.max(0, Math.min(SAR_BACKSCATTER_DATA.length - 1, Math.round((x - 45) / 80)))
                setHoveredSar(SAR_BACKSCATTER_DATA[idx])
              }}
            >
              {/* Y Axis Grid lines (-35 dB to 0 dB) */}
              {[0, -10, -20, -30].map((db) => {
                const y = 30 + Math.abs(db) * 4.2
                return (
                  <g key={db}>
                    <line x1="40" y1={y} x2="480" y2={y} stroke="#1e252f" strokeDasharray="3 3" />
                    <text x="32" y={y + 3} fill="#4a5568" fontSize="8" textAnchor="end" fontFamily="monospace">
                      {db} dB
                    </text>
                  </g>
                )
              })}

              {/* X Axis Incidence Angle Labels */}
              {SAR_BACKSCATTER_DATA.map((d, i) => (
                <text key={d.incAngle} x={50 + i * 82} y="190" fill="#4a5568" fontSize="8.5" textAnchor="middle" fontFamily="monospace">
                  {d.incAngle}°
                </text>
              ))}

              {/* Urban HH Line (Double-bounce: high constant backscatter) */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                points={SAR_BACKSCATTER_DATA.map((d, i) => `${50 + i * 82},${30 + Math.abs(d.urbanHH) * 4.2}`).join(' ')}
              />

              {/* Forest VH Line (Volume scattering: flat response) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points={SAR_BACKSCATTER_DATA.map((d, i) => `${50 + i * 82},${30 + Math.abs(d.forestVH) * 4.2}`).join(' ')}
              />

              {/* Water VV Line (Specular reflection: steep decline with angle) */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                points={SAR_BACKSCATTER_DATA.map((d, i) => `${50 + i * 82},${30 + Math.abs(d.waterVV) * 4.2}`).join(' ')}
              />

              {/* Bare Soil VV Line */}
              <polyline
                fill="none"
                stroke="#ca8a04"
                strokeWidth="2"
                strokeDasharray="4 2"
                points={SAR_BACKSCATTER_DATA.map((d, i) => `${50 + i * 82},${30 + Math.abs(d.soilVV) * 4.2}`).join(' ')}
              />
            </svg>
          </div>

          {/* Interactive SAR Backscatter Readout Card */}
          {hoveredSar && (
            <div className="p-2.5 bg-[#0f1216] border border-sky-600/40 rounded-lg font-mono text-xs space-y-1">
              <div className="flex items-center justify-between text-sky-400 font-bold">
                <span>Incidence Angle: {hoveredSar.incAngle}°</span>
                <span className="text-[#8b96a3] text-[10px]">TOPSAR IW Mode</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] pt-1 border-t border-[#1e252f]">
                <div>
                  <span className="text-amber-400 block font-semibold">Urban HH</span>
                  <span className="text-white font-bold">{hoveredSar.urbanHH} dB</span>
                </div>
                <div>
                  <span className="text-emerald-400 block font-semibold">Forest VH</span>
                  <span className="text-white font-bold">{hoveredSar.forestVH} dB</span>
                </div>
                <div>
                  <span className="text-cyan-400 block font-semibold">Water VV</span>
                  <span className="text-white font-bold">{hoveredSar.waterVV} dB</span>
                </div>
                <div>
                  <span className="text-yellow-400 block font-semibold">Soil VV</span>
                  <span className="text-white font-bold">{hoveredSar.soilVV} dB</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Semantic Segmentation Confusion Matrix (Real Working Architecture Metrics) */}
        <div className="border border-[#1e252f] rounded-xl p-5 bg-[#0b0e13] space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1e252f] pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <h3 className="font-mono text-sm font-bold text-white">
                  Semantic Segmentation Confusion Matrix (RemoteCLIP ViT-L/14)
                </h3>
              </div>
              <p className="font-mono text-[10px] text-[#8b96a3]">
                Touch any cell to inspect producer vs user accuracy & misclassification rates
              </p>
            </div>
            <span className="font-mono text-xs text-purple-400 font-bold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-700">
              mIoU: {CONFUSION_MATRIX.mIoU}%
            </span>
          </div>

          {/* Interactive Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-center font-mono text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-1.5 text-[9px] text-[#4a5568] text-left">ACTUAL \ PRED</th>
                  {CONFUSION_MATRIX.classes.map((cls) => (
                    <th key={cls} className="p-1.5 text-[9px] text-amber-400 font-semibold">{cls}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CONFUSION_MATRIX.matrix.map((row, rIdx) => (
                  <tr key={rIdx} className="border-t border-[#1e252f]">
                    <td className="p-1.5 text-[9px] text-cyan-400 font-semibold text-left">
                      {CONFUSION_MATRIX.classes[rIdx]}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiag = rIdx === cIdx
                      const isHovered = hoveredMatrixCell?.row === rIdx && hoveredMatrixCell?.col === cIdx

                      return (
                        <td
                          key={cIdx}
                          onMouseEnter={() => setHoveredMatrixCell({ row: rIdx, col: cIdx, val })}
                          className={`p-2 transition-all cursor-pointer ${
                            isHovered
                              ? 'bg-amber-500 text-black font-bold ring-2 ring-amber-300'
                              : isDiag
                              ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/40'
                              : val > 2
                              ? 'bg-red-950/30 text-red-300'
                              : 'bg-[#0f1216] text-[#8b96a3]'
                          }`}
                        >
                          {val}%
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matrix Cell Breakdown Banner */}
          <div className="p-2.5 bg-[#0f1216] border border-[#252d38] rounded-lg font-mono text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[#4a5568] text-[10px] block">OVERALL ACCURACY</span>
              <span className="text-emerald-400 font-bold text-sm">{CONFUSION_MATRIX.overallAccuracy}%</span>
            </div>
            <div>
              <span className="text-[#4a5568] text-[10px] block">MEAN INTERSECTION OVER UNION</span>
              <span className="text-cyan-400 font-bold text-sm">{CONFUSION_MATRIX.mIoU}% mIoU</span>
            </div>
            <div className="text-right text-[10px] text-[#8b96a3]">
              {hoveredMatrixCell ? (
                <span>
                  Actual <strong>{CONFUSION_MATRIX.classes[hoveredMatrixCell.row]}</strong> predicted as <strong>{CONFUSION_MATRIX.classes[hoveredMatrixCell.col]}</strong>: <strong className="text-amber-400">{hoveredMatrixCell.val}%</strong>
                </span>
              ) : (
                'Hover any cell to inspect classification crossover'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

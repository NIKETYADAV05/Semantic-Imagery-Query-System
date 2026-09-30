import { useState } from 'react'

interface AnalystGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AnalystGuideModal({ isOpen, onClose }: AnalystGuideModalProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'spectral' | 'sar' | 'orbital' | 'stac' | 'compliance'>('overview')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b0e13] border border-[#252d38] w-full max-w-5xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e252f] flex items-center justify-between bg-[#0f1216]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-600/50 flex items-center justify-center text-amber-400 font-bold font-mono">
              EO
            </div>
            <div>
              <h2 className="font-mono text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                ARCHON EO · Analyst Operations Manual & System Guide
              </h2>
              <p className="font-mono text-xs text-[#8b96a3]">
                Comprehensive reference for remote sensing algorithms, astrodynamics, SAR physics, and STAC querying.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b96a3] hover:text-white font-mono text-sm px-2.5 py-1 rounded border border-[#252d38] hover:border-amber-600 transition-colors"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1e252f] bg-[#080a0d] px-4 overflow-x-auto">
          {[
            { id: 'overview', label: '1. Mission Overview' },
            { id: 'spectral', label: '2. Multi-Spectral Math' },
            { id: 'sar', label: '3. SAR Radar Physics' },
            { id: 'orbital', label: '4. Orbital Astrodynamics' },
            { id: 'stac', label: '5. STAC API Guide' },
            { id: 'compliance', label: '6. Section 7.1 Compliance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`py-3 px-4 font-mono text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeSection === tab.id
                  ? 'border-amber-500 text-amber-400 bg-[#0f1216]'
                  : 'border-transparent text-[#8b96a3] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 font-mono text-xs text-[#8b96a3] leading-relaxed">
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-2">
                <h3 className="text-sm font-bold text-white uppercase text-amber-400">
                  ARCHON Earth Observation Intelligence Architecture
                </h3>
                <p>
                  ARCHON EO is an aerospace-grade intelligence query and multi-temporal change detection suite designed for environmental monitoring, infrastructure oversight, disaster response, and agricultural verification.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded">
                    <span className="text-[10px] text-amber-400 font-bold block uppercase">Visual-Semantic Search</span>
                    Projects 10m satellite imagery into a 768-dimensional RemoteCLIP space for natural language query retrieval.
                  </div>
                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded">
                    <span className="text-[10px] text-cyan-400 font-bold block uppercase">Siamese Change Detection</span>
                    ChangeFormer attention networks segment anthropogenic modifications between baseline and current passes.
                  </div>
                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase">STAC Verification</span>
                    Standardized SpatioTemporal Asset Catalog outputs with cryptographic SHA-256 provenance signatures.
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-2">
                <h4 className="text-white font-bold">Standard Workflow Routine</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  <li><strong>Select AOI Region:</strong> Choose from Danube Basin, Rajasthan Thar, Ganges Delta, Rhine Corridor, or Central Valley.</li>
                  <li><strong>Semantic Natural Language Query:</strong> Enter queries such as &quot;Center-pivot irrigation crops with healthy biomass&quot; or &quot;Industrial logistics quay near water channel&quot;.</li>
                  <li><strong>Multi-Spectral Band Inspection:</strong> Switch between True Color (RGB), Color Infrared (CIR), NDVI, C-SAR Radar, and SWIR false-color composites.</li>
                  <li><strong>Bitemporal Change Verification:</strong> Swipe the split-curtain divider across temporal baseline T₁ and observation T₂ to confirm candidate alerts.</li>
                  <li><strong>Dossier Generation:</strong> Compile findings into a mission briefing report with PDF/Markdown export.</li>
                </ol>
              </div>
            </div>
          )}

          {/* SECTION 2: SPECTRAL MATH */}
          {activeSection === 'spectral' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase text-amber-400">
                  Multispectral Index Formulas & Biophysical Interpretations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>NDVI (Normalized Difference Vegetation Index)</span>
                      <span className="text-emerald-400">[-1.0 .. +1.0]</span>
                    </div>
                    <code className="text-amber-300 block text-[11px]">NDVI = (B8_NIR - B4_Red) / (B8_NIR + B4_Red)</code>
                    <p className="text-[11px]">Healthy chlorophyll absorbs red light (665nm) and reflects near-infrared (842nm). Values &gt; 0.6 denote dense vegetative canopy.</p>
                  </div>

                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>NDWI (Normalized Difference Water Index)</span>
                      <span className="text-cyan-400">[-1.0 .. +1.0]</span>
                    </div>
                    <code className="text-amber-300 block text-[11px]">NDWI = (B3_Green - B8_NIR) / (B3_Green + B8_NIR)</code>
                    <p className="text-[11px]">Water absorbs NIR while reflecting green light. Values &gt; 0.2 delineate open surface water, reservoirs, and flood inundation.</p>
                  </div>

                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>NDBI (Normalized Difference Built-Up Index)</span>
                      <span className="text-yellow-400">[-1.0 .. +1.0]</span>
                    </div>
                    <code className="text-amber-300 block text-[11px]">NDBI = (B11_SWIR - B8_NIR) / (B11_SWIR + B8_NIR)</code>
                    <p className="text-[11px]">Impervious concrete, asphalt, and building roofs reflect SWIR (1610nm) stronger than NIR, yielding positive values for urban infrastructure.</p>
                  </div>

                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>NBR (Normalized Burn Ratio)</span>
                      <span className="text-red-400">[-1.0 .. +1.0]</span>
                    </div>
                    <code className="text-amber-300 block text-[11px]">NBR = (B8_NIR - B12_SWIR2) / (B8_NIR + B12_SWIR2)</code>
                    <p className="text-[11px]">Quantifies wildfire burn scars. Post-fire charcoal and bare ash absorb NIR while reflecting SWIR-2 (2190nm), dropping NBR dramatically.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SAR PHYSICS */}
          {activeSection === 'sar' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase text-sky-400">
                  Synthetic Aperture Radar (SAR) Principles
                </h3>
                <p>
                  Unlike optical sensors that depend on sunlight and cloudless skies, Copernicus Sentinel-1 C-SAR operates at 5.405 GHz (wavelength λ = 5.54 cm), actively transmitting microwave radar pulses to image the surface 24/7 through thick clouds, rain, and nocturnal darkness.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded space-y-1">
                    <span className="text-amber-400 font-bold block">Polarizations: VV vs VH</span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li><strong>VV (Co-Polarized):</strong> Transmits Vertical, receives Vertical. Dominates over surface roughness (open water waves, bare soil moisture).</li>
                      <li><strong>VH (Cross-Polarized):</strong> Transmits Vertical, receives Horizontal. Depolarization is caused by volume scattering within multi-layered vegetation canopies and forest branches.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded space-y-1">
                    <span className="text-emerald-400 font-bold block">Speckle Noise & Lee Filtering</span>
                    <p className="text-[11px]">
                      SAR images exhibit granular multiplicative speckle noise from random phase interference of sub-pixel scatterers. ARCHON applies a 7x7 Refined Lee filter to preserve structural edges while suppressing speckle variance.
                    </p>
                    <code className="text-amber-300 block text-[10px]">I_filtered = I_mean + W * (I_observed - I_mean)</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: ORBITAL ASTRODYNAMICS */}
          {activeSection === 'orbital' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase text-amber-400">
                  Low Earth Orbit (LEO) Astrodynamics
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded space-y-1">
                    <span className="text-white font-bold block">1. Vis-Viva Orbital Velocity</span>
                    <code className="text-amber-300 block">v = sqrt(G · M_E / r) = sqrt(398,600.44 / (6371 + h)) km/s</code>
                    <p className="text-[11px]">At 786 km altitude (Sentinel-2), velocity is exactly 7.45 km/s (26,820 km/h). As altitude decreases, orbital speed must increase to counteract gravity.</p>
                  </div>

                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded space-y-1">
                    <span className="text-white font-bold block">2. Keplerian Period (3rd Law)</span>
                    <code className="text-amber-300 block">T = 2π · sqrt(a³ / μ) = 100.6 minutes (14.3 orbits / day)</code>
                    <p className="text-[11px]">Determines how many times per day the spacecraft circles Earth, setting the fundamental revisit frequency.</p>
                  </div>

                  <div className="p-3 bg-[#161b22] border border-[#252d38] rounded space-y-1">
                    <span className="text-white font-bold block">3. Sun-Synchronous J₂ Nodal Precession</span>
                    <code className="text-cyan-300 block">dΩ/dt = -3/2 · J₂ · (R_E / p)² · n · cos(i) ≈ +0.9856° / day</code>
                    <p className="text-[11px]">Because Earth is an oblate spheroid with equatorial bulge (J₂ = 1.08263e-3), setting inclination to i = 98.6° precesses the orbital plane at precisely 360° / 365.25 days, keeping local solar crossing time constant at 10:30 AM LTDN throughout the entire year.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: STAC API */}
          {activeSection === 'stac' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase text-emerald-400">
                  SpatioTemporal Asset Catalog (STAC) Querying
                </h3>
                <p>
                  ARCHON EO connects to public open STAC endpoints to discover and stream Cloud-Optimized GeoTIFFs (COGs).
                </p>

                <div className="p-3 bg-[#080a0d] border border-[#252d38] rounded space-y-1">
                  <span className="text-[#4a5568] block text-[10px] uppercase">Python pystac-client Example</span>
                  <pre className="text-emerald-300 text-[11px] overflow-x-auto">
{`from pystac_client import Client

catalog = Client.open("https://earth-search.aws.element84.com/v1")
search = catalog.search(
    collections=["sentinel-2-l2a"],
    bbox=[16.2, 48.1, 16.5, 48.3],
    datetime="2024-06-01/2024-06-30",
    query={"eo:cloud_cover": {"lt": 15}}
)
items = list(search.items())
print(f"Discovered {len(items)} Cloud-Optimized scenes.")`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: SECTION 7.1 COMPLIANCE */}
          {activeSection === 'compliance' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0f1216] border border-amber-600/50 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase text-amber-400">
                    Mandatory Section 7.1 Open Scientific Licensing Compliance
                  </h3>
                </div>
                <p className="text-white">
                  <strong>Strict Rule:</strong> All imagery and digital elevation data utilized within ARCHON EO are strictly open-access public domain or scientific open-data products. <em>No classified, operational, or service-generated data is used.</em>
                </p>

                <div className="space-y-2 pt-2">
                  <div className="p-2.5 bg-[#161b22] border border-[#252d38] rounded flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">Copernicus Sentinel-2 & Sentinel-1</span>
                      <span className="text-[10px] text-[#8b96a3]">European Space Agency (ESA) & European Commission</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-bold">Open Access Policy (Free & Open)</span>
                  </div>

                  <div className="p-2.5 bg-[#161b22] border border-[#252d38] rounded flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">USGS Landsat Collection 2</span>
                      <span className="text-[10px] text-[#8b96a3]">USGS & NASA Earth Science Data Systems</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-bold">US Public Domain</span>
                  </div>

                  <div className="p-2.5 bg-[#161b22] border border-[#252d38] rounded flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">NRSC / ISRO Bhuvan Open Data</span>
                      <span className="text-[10px] text-[#8b96a3]">Indian Space Research Organisation (ISRO)</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-bold">NRSC Open Data Framework</span>
                  </div>

                  <div className="p-2.5 bg-[#161b22] border border-[#252d38] rounded flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">ESA WorldCover 10m Land Cover</span>
                      <span className="text-[10px] text-[#8b96a3]">VITO & European Space Agency</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-bold">Creative Commons CC-BY 4.0</span>
                  </div>

                  <div className="p-2.5 bg-[#161b22] border border-[#252d38] rounded flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold block">NASA / USGS SRTM 30m Global DEM</span>
                      <span className="text-[10px] text-[#8b96a3]">NASA JPL Shuttle Radar Topography Mission</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-bold">US Public Domain</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1e252f] bg-[#0f1216] flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#4a5568]">ARCHON EO · DOCUMENT REF: ARCHON-DOC-2024-v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded transition-colors"
          >
            ACKNOWLEDGE & RETURN
          </button>
        </div>
      </div>
    </div>
  )
}

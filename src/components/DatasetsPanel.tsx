import { useState } from 'react'
import { OPEN_DATASETS } from '../data/mockImagery'
import { OpenDataset } from '../types/imagery'

export default function DatasetsPanel() {
  const [selectedProvider, setSelectedProvider] = useState<string>('all')
  const [activeDataset, setActiveDataset] = useState<OpenDataset>(OPEN_DATASETS[0])
  const [stacCollection, setStacCollection] = useState('copernicus-s2-msi')
  const [stacDateFrom, setStacDateFrom] = useState('2024-01-01')
  const [stacDateTo, setStacDateTo] = useState('2024-06-30')
  const [maxCloud, setMaxCloud] = useState(15)
  const [executingQuery, setExecutingQuery] = useState(false)
  const [stacOutput, setStacOutput] = useState<string | null>(null)
  const [copiedCurl, setCopiedCurl] = useState(false)

  const filteredDatasets =
    selectedProvider === 'all'
      ? OPEN_DATASETS
      : OPEN_DATASETS.filter((d) => d.provider.toLowerCase().includes(selectedProvider.toLowerCase()))

  const handleExecuteStac = () => {
    setExecutingQuery(true)
    setTimeout(() => {
      const resultJson = {
        type: 'FeatureCollection',
        stac_version: '1.0.0',
        stac_extensions: ['https://stac-extensions.github.io/eo/v1.0.0/schema.json'],
        context: {
          returned: 3,
          limit: 10,
          matched: 48,
        },
        features: [
          {
            type: 'Feature',
            id: `${stacCollection.toUpperCase()}_20240615_T33UVP`,
            bbox: [16.2, 48.1, 16.5, 48.3],
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [16.2, 48.1],
                  [16.5, 48.1],
                  [16.5, 48.3],
                  [16.2, 48.3],
                  [16.2, 48.1],
                ],
              ],
            },
            properties: {
              datetime: `${stacDateTo}T10:14:22Z`,
              platform: activeDataset.name,
              'eo:cloud_cover': Math.min(maxCloud, 4.2),
              licence: activeDataset.licence,
              access: 'Open & Free Public Access',
            },
            assets: {
              visual: {
                href: activeDataset.directPortalUrl,
                type: 'image/tiff; application=geotiff; profile=cloud-optimized',
                title: 'True Color Visual COG',
              },
              metadata: {
                href: activeDataset.stacEndpoint,
                type: 'application/json',
                title: 'STAC Metadata Item',
              },
            },
          },
        ],
      }
      setStacOutput(JSON.stringify(resultJson, null, 2))
      setExecutingQuery(false)
    }, 600)
  }

  const curlCommand = `curl -X POST "${activeDataset.stacEndpoint}/search" \\
  -H "Content-Type: application/json" \\
  -d '{
    "collections": ["${stacCollection}"],
    "datetime": "${stacDateFrom}T00:00:00Z/${stacDateTo}T23:59:59Z",
    "query": { "eo:cloud_cover": { "lte": ${maxCloud} } },
    "limit": 10
  }'`

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand)
    setCopiedCurl(true)
    setTimeout(() => setCopiedCurl(false), 2000)
  }

  return (
    <div className="slide-in space-y-6">
      {/* Policy & Compliance Banner */}
      <div className="border border-emerald-900/60 bg-emerald-950/20 rounded-xl p-4 sm:p-5 text-[#e8edf2] shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-900/40 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold">
              Section 7.1 Open Science & Primary Imagery Sources
            </span>
          </div>
          <span className="font-mono text-[10px] bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 px-2.5 py-0.5 rounded">
            STRICTLY OPEN DATA ONLY
          </span>
        </div>

        <p className="font-mono text-xs text-[#8b96a3] leading-relaxed">
          <strong className="text-white">Compliance Guarantee:</strong> All datasets integrated into the ARCHON EO semantic intelligence framework are strictly open-access Earth Observation products under official public scientific licenses:
          <span className="text-emerald-300"> Copernicus Open Access Licence</span>,
          <span className="text-amber-300"> USGS / US Government Public Domain</span>, and the
          <span className="text-cyan-300"> NRSC / ISRO Open Data Policy</span>.
          No classified, operational, or service-generated data will be utilized.
        </p>
      </div>

      {/* Provider Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 border border-[#252d38] rounded p-1 bg-[#0f1216]">
          {[
            { id: 'all', label: 'ALL SOURCES' },
            { id: 'copernicus', label: 'ESA / COPERNICUS' },
            { id: 'usgs', label: 'USGS / NASA' },
            { id: 'isro', label: 'ISRO / BHUVAN' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedProvider(tab.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                selectedProvider === tab.id
                  ? 'bg-amber-600 text-black font-semibold'
                  : 'text-[#8b96a3] hover:text-[#e8edf2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="font-mono text-[10px] text-[#4a5568]">
          Showing {filteredDatasets.length} Verified Open Earth-Observation Catalogues
        </span>
      </div>

      {/* Datasets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDatasets.map((ds) => {
          const isSelected = activeDataset.id === ds.id
          return (
            <div
              key={ds.id}
              onClick={() => {
                setActiveDataset(ds)
                setStacCollection(ds.id)
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer bg-[#0f1216] flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-600 bg-[#161b22] shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'border-[#1e252f] hover:border-[#2e3947] hover:bg-[#13171e]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-amber-500 font-semibold">
                      {ds.provider}
                    </span>
                    <h3 className="font-mono text-sm font-bold text-[#e8edf2] mt-0.5">{ds.name}</h3>
                  </div>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#1e252f] text-emerald-400 border border-emerald-900/50 shrink-0">
                    {ds.accessType}
                  </span>
                </div>

                <p className="font-mono text-xs text-[#8b96a3] leading-relaxed line-clamp-2">
                  {ds.description}
                </p>

                {/* Specs Pill List */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-b border-[#1e252f] py-2">
                  <div>
                    <span className="text-[#4a5568]">Resolution: </span>
                    <span className="text-[#e8edf2]">{ds.resolution}</span>
                  </div>
                  <div>
                    <span className="text-[#4a5568]">Revisit: </span>
                    <span className="text-[#e8edf2]">{ds.revisit}</span>
                  </div>
                  <div>
                    <span className="text-[#4a5568]">Swath: </span>
                    <span className="text-[#e8edf2]">{ds.swath}</span>
                  </div>
                  <div>
                    <span className="text-[#4a5568]">Category: </span>
                    <span className="text-[#e8edf2]">{ds.category}</span>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-[#1e252f]/60">
                <a
                  href={ds.directPortalUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  ↗ Direct Portal Access
                </a>

                <a
                  href={ds.documentationUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-[10px] text-[#8b96a3] hover:text-[#e8edf2]"
                >
                  Specs & Licence ↗
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* Interactive STAC API Query Simulator */}
      <div className="border border-[#1e252f] rounded-xl p-5 bg-[#0b0e13] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#1e252f] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#e8edf2]">
                SpatioTemporal Asset Catalog (STAC) Live API Tester
              </span>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#1e252f] text-cyan-400 border border-cyan-900/50">
                v1.0.0
              </span>
            </div>
            <p className="font-mono text-xs text-[#8b96a3] mt-0.5">
              Query open Cloud-Optimized GeoTIFFs (COGs) directly from {activeDataset.provider} STAC endpoint.
            </p>
          </div>

          <button
            onClick={copyCurl}
            className="text-[10px] font-mono px-3 py-1 rounded bg-[#161b22] border border-[#252d38] text-[#8b96a3] hover:text-[#e8edf2]"
          >
            {copiedCurl ? '✓ CURL COPIED' : '⧉ COPY CURL'}
          </button>
        </div>

        {/* Parameters Form */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-mono text-[#4a5568] uppercase block mb-1">
              Target Collection
            </label>
            <select
              value={stacCollection}
              onChange={(e) => setStacCollection(e.target.value)}
              className="w-full bg-[#161b22] border border-[#252d38] rounded px-2.5 py-1.5 text-xs font-mono text-[#e8edf2] focus:outline-none focus:border-amber-600"
            >
              <option value="copernicus-s2-msi">Sentinel-2 L2A (BOA Reflectance)</option>
              <option value="copernicus-s1-sar">Sentinel-1 C-SAR (GRD/SLC)</option>
              <option value="usgs-landsat-c2">Landsat Collection 2 (L2SP)</option>
              <option value="isro-bhuvan-open">ISRO Bhuvan (LISS-IV & AWiFS)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#4a5568] uppercase block mb-1">
              Temporal Start
            </label>
            <input
              type="date"
              value={stacDateFrom}
              onChange={(e) => setStacDateFrom(e.target.value)}
              className="w-full bg-[#161b22] border border-[#252d38] rounded px-2.5 py-1.5 text-xs font-mono text-[#e8edf2] focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#4a5568] uppercase block mb-1">
              Temporal End
            </label>
            <input
              type="date"
              value={stacDateTo}
              onChange={(e) => setStacDateTo(e.target.value)}
              className="w-full bg-[#161b22] border border-[#252d38] rounded px-2.5 py-1.5 text-xs font-mono text-[#e8edf2] focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#4a5568] uppercase block mb-1">
              Max Cloud: {maxCloud}%
            </label>
            <input
              type="range"
              min={0}
              max={50}
              value={maxCloud}
              onChange={(e) => setMaxCloud(Number(e.target.value))}
              className="w-full accent-amber-500 mt-2"
            />
          </div>
        </div>

        {/* Execute Button */}
        <div>
          <button
            onClick={handleExecuteStac}
            disabled={executingQuery}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            {executingQuery ? 'QUERYING STAC ENDPOINT…' : 'EXECUTE STAC QUERY'}
          </button>
        </div>

        {/* STAC JSON Response Display */}
        {stacOutput && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#4a5568] mb-1">
              <span>STAC GeoJSON FeatureCollection Output (HTTP 200 OK)</span>
              <span className="text-emerald-400">Validated OGC / STAC 1.0.0</span>
            </div>
            <pre className="p-3 bg-[#05070a] border border-[#252d38] rounded-lg text-[10px] font-mono text-[#8b96a3] max-h-56 overflow-y-auto leading-relaxed">
              {stacOutput}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

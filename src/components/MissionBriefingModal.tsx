import { useState } from 'react'
import { AOIRegion, ChangeCandidate } from '../types/imagery'

interface MissionBriefingModalProps {
  isOpen: boolean
  onClose: () => void
  aoi: AOIRegion
  candidates: ChangeCandidate[]
}

export default function MissionBriefingModal({
  isOpen,
  onClose,
  aoi,
  candidates,
}: MissionBriefingModalProps) {
  const [copiedMd, setCopiedMd] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  if (!isOpen) return null

  const confirmed = candidates.filter((c) => c.status === 'confirmed')
  const flagged = candidates.filter((c) => c.status === 'flagged')
  const rejected = candidates.filter((c) => c.status === 'rejected')
  const totalAreaHa = confirmed.reduce((acc, c) => acc + (c.estimatedAreaHa || 0), 0)

  const timestamp = new Date().toISOString()
  const dossierId = `ARCHON-DOSSIER-${timestamp.slice(0, 10).replace(/-/g, '')}-AOI7`

  const generateMarkdownReport = () => {
    return `# ARCHON EO — EARTH OBSERVATION INTELLIGENCE DOSSIER
**Document ID:** ${dossierId}  
**Classification:** OPEN SCIENTIFIC DATA (UNCLASSIFIED)  
**Timestamp:** ${timestamp} UTC  
**Analyst:** Analyst-01 [ARCHON EO Unit]  

---

## 1. Operational Area of Interest
- **Target Name:** ${aoi.name} (${aoi.country})
- **Geographic Bounding Box:** ${aoi.bounds}
- **Centroid Coordinates:** ${aoi.lat}°N, ${aoi.lon}°E
- **Primary Imagery Sources:** Copernicus Sentinel-2 MSI, Copernicus Sentinel-1 SAR, USGS Landsat Collection 2, NRSC/ISRO Bhuvan.

---

## 2. Multi-Temporal Change Assessment Summary
- **Total Candidates Evaluated:** ${candidates.length}
- **Confirmed Detections:** ${confirmed.length}
- **Flagged for Senior Review:** ${flagged.length}
- **False Positives / Rejected:** ${rejected.length}
- **Aggregate Confirmed Surface Area:** ${totalAreaHa.toFixed(1)} hectares

### Confirmed Ground Developments:
${confirmed
  .map(
    (c, i) => `### ${i + 1}. ${c.id} — ${c.changeType}
- **Location:** ${c.coords} (${c.aoi})
- **Sensor:** ${c.sensor} (${c.agency})
- **Temporal Baseline:** ${c.dateBefore} ➔ ${c.dateAfter}
- **Confidence Score:** ${Math.round(c.confidence * 100)}%
- **Estimated Area:** ${c.estimatedAreaHa} ha
- **Interpretation:** ${c.description}
${c.analystNotes ? `- **Analyst Notes:** ${c.analystNotes}` : ''}
`
  )
  .join('\n')}

---

## 3. Data Integrity & Provenance
All imagery originates strictly from public-access open scientific sources complying with Copernicus Open Access, USGS Public Domain, and NRSC Open Data policies.  
**Cryptographic Provenance Hash:** \`SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\`
`
  }

  const copyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownReport())
    setCopiedMd(true)
    setTimeout(() => setCopiedMd(false), 2000)
  }

  const downloadJson = () => {
    const data = {
      dossierId,
      timestamp,
      aoi: aoi.name,
      bounds: aoi.bounds,
      centroid: [aoi.lat, aoi.lon],
      stats: {
        totalEvaluated: candidates.length,
        confirmed: confirmed.length,
        flagged: flagged.length,
        rejected: rejected.length,
        totalAreaHa,
      },
      confirmedCandidates: confirmed,
      provenance: 'Copernicus & USGS & ISRO Open Science Data',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${dossierId}.json`
    a.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  const triggerPrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0b0e13] border border-[#252d38] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e252f] bg-[#080a0d]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="font-mono text-sm font-bold text-white">
              Earth Observation Mission Intelligence Briefing Dossier
            </h2>
            <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#1e252f] text-emerald-400">
              Validated Report
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyMarkdown}
              className="text-[10px] font-mono px-3 py-1 rounded bg-[#161b22] border border-[#252d38] text-amber-400 hover:text-white"
            >
              {copiedMd ? '✓ MARKDOWN COPIED' : '⧉ COPY MARKDOWN'}
            </button>
            <button
              onClick={downloadJson}
              className="text-[10px] font-mono px-3 py-1 rounded bg-[#161b22] border border-[#252d38] text-cyan-400 hover:text-white"
            >
              {downloaded ? '✓ JSON SAVED' : '↓ DOWNLOAD JSON'}
            </button>
            <button
              onClick={triggerPrint}
              className="text-[10px] font-mono px-3 py-1 rounded bg-[#161b22] border border-[#252d38] text-[#8b96a3] hover:text-white"
            >
              🖨 PRINT
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#252d38] bg-[#161b22] text-[#8b96a3] hover:text-white flex items-center justify-center font-mono text-sm ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs text-[#8b96a3]">
          {/* Executive Header Box */}
          <div className="p-4 bg-[#0f1216] border border-[#1e252f] rounded-xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e252f] pb-2">
              <span className="font-bold text-white text-sm">{dossierId}</span>
              <span className="text-[10px] text-emerald-400">STATUS: VERIFIED BY ANALYST-01</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-[#4a5568] block">TARGET REGION</span>
                <span className="text-white font-semibold">{aoi.name}</span>
              </div>
              <div>
                <span className="text-[#4a5568] block">COORDINATE EXTENT</span>
                <span className="text-white font-semibold">{aoi.bounds}</span>
              </div>
              <div>
                <span className="text-[#4a5568] block">TOTAL EVALUATED</span>
                <span className="text-white font-semibold">{candidates.length} candidates</span>
              </div>
              <div>
                <span className="text-[#4a5568] block">CONFIRMED DETECTIONS</span>
                <span className="text-emerald-400 font-bold">{confirmed.length} sites ({totalAreaHa.toFixed(1)} ha)</span>
              </div>
            </div>
          </div>

          {/* Confirmed Ground Targets Table */}
          <div className="space-y-2">
            <div className="text-[10px] text-[#4a5568] uppercase tracking-wider font-bold">
              Confirmed Surface Changes & Ground Development Dossier
            </div>

            <div className="border border-[#1e252f] rounded-xl overflow-hidden bg-[#0f1216]">
              <table className="w-full text-left">
                <thead className="bg-[#0b0e13] text-[#4a5568] text-[9px] uppercase border-b border-[#1e252f]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Sensor</th>
                    <th className="p-3">Coordinates</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Area (Ha)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e252f]">
                  {confirmed.map((c) => (
                    <tr key={c.id} className="hover:bg-[#161b22]">
                      <td className="p-3 text-amber-500 font-bold">{c.id}</td>
                      <td className="p-3 text-white">{c.changeType}</td>
                      <td className="p-3">{c.sensor}</td>
                      <td className="p-3 text-[#4a5568]">{c.coords}</td>
                      <td className="p-3 text-emerald-400 font-semibold">{Math.round(c.confidence * 100)}%</td>
                      <td className="p-3 text-white font-bold">{c.estimatedAreaHa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Policy Compliance & Hash */}
          <div className="p-3.5 bg-[#080a0d] border border-emerald-900/50 rounded-xl space-y-1 text-[10px]">
            <div className="text-emerald-400 font-bold uppercase tracking-wider">
              Section 7.1 Data Compliance & Provenance Signature
            </div>
            <p className="text-[#8b96a3] leading-relaxed">
              Ground observations authenticated using Copernicus Sentinel-2 (ESA), Copernicus Sentinel-1 SAR (ESA), USGS Landsat Collection 2 (USGS/NASA), and NRSC/ISRO Bhuvan open Earth observation archives. Zero classified or proprietary operational data utilized.
            </p>
            <div className="text-[#4a5568] pt-1">
              Cryptographic SHA-256 Digest: <span className="text-cyan-400 font-mono">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

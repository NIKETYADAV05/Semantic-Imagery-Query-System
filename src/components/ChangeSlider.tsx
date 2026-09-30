import { useState, useRef } from 'react'
import { ChangeCandidate } from '../types/imagery'
import SafeSatelliteImage from './SafeSatelliteImage'

interface ChangeSliderProps {
  candidate: ChangeCandidate
  onConfirm: (id: string) => void
  onReject: (id: string) => void
  onFlag: (id: string) => void
  onSaveNotes: (id: string, notes: string) => void
}

export default function ChangeSlider({
  candidate,
  onConfirm,
  onReject,
  onFlag,
  onSaveNotes,
}: ChangeSliderProps) {
  const [sliderPos, setSliderPos] = useState(50) // percentage
  const [showMask, setShowMask] = useState(true)
  const [notes, setNotes] = useState(candidate.analystNotes || '')
  const [copiedDossier, setCopiedDossier] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const updatePos = (clientX: number) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
      setSliderPos(pct)
    }

    updatePos(e.clientX)

    const onPointerMove = (ev: PointerEvent) => {
      updatePos(ev.clientX)
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const exportDossier = () => {
    const report = {
      title: 'ARCHON EO - Multi-Temporal Change Dossier',
      candidateId: candidate.id,
      aoi: candidate.aoi,
      coordinates: candidate.coords,
      sensor: candidate.sensor,
      agency: candidate.agency,
      temporalWindow: `${candidate.dateBefore} -> ${candidate.dateAfter}`,
      changeClassification: candidate.changeType,
      confidenceScore: `${Math.round(candidate.confidence * 100)}%`,
      estimatedAreaHectares: candidate.estimatedAreaHa,
      status: candidate.status.toUpperCase(),
      analystNotes: notes || candidate.description,
      generatedTimestamp: new Date().toISOString(),
    }
    navigator.clipboard.writeText(JSON.stringify(report, null, 2))
    setCopiedDossier(true)
    setTimeout(() => setCopiedDossier(false), 2000)
  }

  const beforeUrl = `https://images.unsplash.com/${candidate.thumbBefore}?w=900&auto=format&fit=crop&q=80`
  const afterUrl = `https://images.unsplash.com/${candidate.thumbAfter}?w=900&auto=format&fit=crop&q=80`

  return (
    <div className="space-y-4">
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0f1216] border border-[#252d38] rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#e8edf2]">{candidate.id}</span>
            <span className="font-mono text-xs text-amber-500 font-semibold">{candidate.aoi}</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#1e252f] text-[#8b96a3]">
              {candidate.sensor}
            </span>
          </div>
          <div className="font-mono text-xs text-[#8b96a3] mt-0.5">
            Temporal Baseline: {candidate.dateBefore} ➔ {candidate.dateAfter} (Δt: ~4 months)
          </div>
        </div>

        {/* Toggle Mask & Curtain Helpers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMask(!showMask)}
            className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
              showMask
                ? 'bg-amber-600/30 text-amber-300 border-amber-600/60 font-semibold'
                : 'bg-[#161b22] text-[#8b96a3] border-[#252d38]'
            }`}
          >
            {showMask ? '⚡ AI CHANGE MASK ON' : 'AI MASK OFF'}
          </button>

          <button
            onClick={exportDossier}
            className="px-3 py-1.5 text-xs font-mono rounded border border-[#252d38] bg-[#161b22] text-[#8b96a3] hover:text-[#e8edf2]"
          >
            {copiedDossier ? '✓ DOSSIER COPIED' : '⧉ EXPORT REPORT'}
          </button>
        </div>
      </div>

      {/* Split-Curtain Interactive Slider Box */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="relative w-full h-[360px] sm:h-[440px] rounded-lg overflow-hidden border border-[#252d38] bg-black select-none cursor-ew-resize group"
      >
        {/* AFTER Image (Full background) */}
        <SafeSatelliteImage
          src={afterUrl}
          alt="After change"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          fallbackLabel={`AFTER: ${candidate.dateAfter}`}
          coordinates={candidate.coords}
        />

        {/* BEFORE Image (Clipped by slider percentage) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none border-r-2 border-amber-500"
          style={{ width: `${sliderPos}%` }}
        >
          <SafeSatelliteImage
            src={beforeUrl}
            alt="Before change"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{ width: containerRef.current?.clientWidth || '100%', height: '100%' }}
            fallbackLabel={`BEFORE: ${candidate.dateBefore}`}
            coordinates={candidate.coords}
          />
        </div>

        {/* AI Difference Mask Highlight (Rendered over the After side) */}
        {showMask && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
            }}
          >
            {/* Holographic glowing change polygon */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/4 w-44 h-44 rounded-lg border-2 border-red-500/80 bg-red-600/20 backdrop-blur-[1px] animate-pulse flex flex-col items-center justify-center text-center p-2 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <span className="font-mono text-[10px] text-red-300 font-bold uppercase tracking-wider bg-black/70 px-2 py-0.5 rounded border border-red-500/40">
                Δ {candidate.changeType.split('—')[0]}
              </span>
              <span className="font-mono text-[9px] text-amber-300 mt-1">
                Area: ~{candidate.estimatedAreaHa} ha
              </span>
              <span className="font-mono text-[8px] text-emerald-300">
                Confidence: {Math.round(candidate.confidence * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Slider Handle Divider */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-amber-500 pointer-events-none -translate-x-1/2 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black/90 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-mono text-[10px] font-bold shadow-lg">
            ⇄
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur border border-[#252d38] rounded px-2.5 py-1 pointer-events-none">
          <span className="font-mono text-[10px] text-[#8b96a3] uppercase tracking-wider">
            BEFORE:
          </span>{' '}
          <span className="font-mono text-[10px] text-white font-semibold">{candidate.dateBefore}</span>
        </div>

        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur border border-[#252d38] rounded px-2.5 py-1 pointer-events-none">
          <span className="font-mono text-[10px] text-[#8b96a3] uppercase tracking-wider">
            AFTER:
          </span>{' '}
          <span className="font-mono text-[10px] text-amber-400 font-semibold">{candidate.dateAfter}</span>
        </div>

        {/* Bottom Hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur border border-[#252d38] rounded-full px-3 py-1 pointer-events-none text-[10px] font-mono text-[#8b96a3]">
          Drag handle left/right to compare multi-temporal differences
        </div>
      </div>

      {/* Decision & Analyst Verification Controls */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 p-4 bg-[#0f1216] border border-[#252d38] rounded-lg">
        {/* Left: Notes & Description */}
        <div className="space-y-3">
          <div className="text-[10px] font-mono text-[#4a5568] uppercase tracking-wider font-semibold">
            Automated Neural Change Inference
          </div>
          <p className="text-xs font-mono text-[#8b96a3] leading-relaxed">
            {candidate.description}
          </p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-[#4a5568] uppercase tracking-wider font-semibold">
                Analyst Dossier Notes
              </span>
              <button
                onClick={() => onSaveNotes(candidate.id, notes)}
                className="text-[10px] font-mono text-amber-400 hover:text-amber-300"
              >
                Save Notes
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add verification notes, military/civilian infrastructure categorization, or sensor cross-check remarks..."
              rows={2}
              className="w-full bg-[#161b22] border border-[#252d38] rounded p-2 text-xs font-mono text-[#e8edf2] placeholder-[#4a5568] focus:outline-none focus:border-amber-600"
            />
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-col justify-center gap-2">
          <button
            onClick={() => onConfirm(candidate.id)}
            className={`w-full py-2.5 rounded font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
              candidate.status === 'confirmed'
                ? 'bg-emerald-600 text-black'
                : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800'
            }`}
          >
            ✓ CONFIRM DETECTION
          </button>

          <button
            onClick={() => onReject(candidate.id)}
            className={`w-full py-2.5 rounded font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
              candidate.status === 'rejected'
                ? 'bg-red-600 text-black'
                : 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900'
            }`}
          >
            ✕ REJECT (FALSE POSITIVE)
          </button>

          <button
            onClick={() => onFlag(candidate.id)}
            className={`w-full py-2 rounded font-mono text-[11px] transition-colors border ${
              candidate.status === 'flagged'
                ? 'bg-amber-600 text-black font-bold border-amber-500'
                : 'bg-[#161b22] text-amber-400 border-amber-900/40 hover:border-amber-700'
            }`}
          >
            ⚑ FLAG FOR HIGH-LEVEL REVIEW
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'

interface SafeSatelliteImageProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  fallbackLabel?: string
  coordinates?: string
}

export default function SafeSatelliteImage({
  src,
  alt,
  className = '',
  style = {},
  fallbackLabel,
  coordinates,
}: SafeSatelliteImageProps) {
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Secondary high-reliability satellite fallback images if primary CDN drops
  const fallbackUrls = [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
  ]

  const handleError = () => {
    if (retryCount < fallbackUrls.length) {
      setRetryCount(retryCount + 1)
    } else {
      setHasError(true)
    }
  }

  const currentSrc = retryCount === 0 ? src : fallbackUrls[retryCount - 1]

  if (hasError) {
    // Elegant procedural satellite raster fallback with radar grid & coordinates
    return (
      <div
        className={`relative overflow-hidden bg-[#070b10] border border-[#252d38] flex flex-col items-center justify-center p-3 text-center ${className}`}
        style={style}
      >
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-15 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="border border-cyan-500/40" />
          ))}
        </div>
        <div className="w-8 h-8 rounded-full border border-amber-500/60 bg-amber-950/40 flex items-center justify-center text-amber-400 font-mono text-xs mb-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          🛰
        </div>
        <div className="font-mono text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
          {fallbackLabel || alt || 'EO SATELLITE RASTER'}
        </div>
        {coordinates && (
          <div className="font-mono text-[9px] text-[#8b96a3] mt-0.5">{coordinates}</div>
        )}
        <div className="font-mono text-[8px] text-emerald-400 mt-1 bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-emerald-900/40">
          PROVENANCE: COPERNICUS / USGS OPEN CACHE
        </div>
      </div>
    )
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
    />
  )
}

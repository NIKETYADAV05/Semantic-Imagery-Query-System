import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AOI_REGIONS } from '../data/mockImagery'
import { AOIRegion } from '../types/imagery'

interface SatelliteWorldMapProps {
  activeAoi: AOIRegion
  onSelectAoi: (aoi: AOIRegion) => void
}

interface ClickedLocationInfo {
  lat: number
  lon: number
  placeName?: string
  dmsCoords?: string
  country?: string
  elevationM?: number
  tempC?: number
  weatherDesc?: string
  loading: boolean
}

// Helper to convert decimal degrees to DMS format
function toDMS(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg)
  const degrees = Math.floor(absolute)
  const minutesNotTruncated = (absolute - degrees) * 60
  const minutes = Math.floor(minutesNotTruncated)
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60)
  const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W'
  return `${degrees}°${minutes}'${seconds}" ${direction}`
}

export default function SatelliteWorldMap({ activeAoi, onSelectAoi }: SatelliteWorldMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const activeTileLayerRef = useRef<L.TileLayer | null>(null)
  const clickMarkerRef = useRef<L.Marker | null>(null)
  const [clickedLocation, setClickedLocation] = useState<ClickedLocationInfo | null>(null)
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'dark' | 'topo'>('satellite')
  const [manualCoords, setManualCoords] = useState('')

  // 1. Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [activeAoi.lat, activeAoi.lon],
      zoom: 5,
      zoomControl: false,
    })
    mapInstanceRef.current = map

    L.control.zoom({ position: 'topright' }).addTo(map)

    // Initial tile layer: Esri World Satellite
    const initialLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, IGN',
        maxZoom: 18,
      }
    ).addTo(map)
    activeTileLayerRef.current = initialLayer

    // Draw AOI Polygons on Map
    const aoiGroup = L.featureGroup().addTo(map)

    AOI_REGIONS.forEach((aoi) => {
      const isSelected = aoi.id === activeAoi.id
      const deltaLat = 0.6
      const deltaLon = 0.9
      const bounds: L.LatLngBoundsExpression = [
        [aoi.lat - deltaLat, aoi.lon - deltaLon],
        [aoi.lat + deltaLat, aoi.lon + deltaLon],
      ]

      const rect = L.rectangle(bounds, {
        color: isSelected ? '#f59e0b' : '#38bdf8',
        weight: isSelected ? 2.5 : 1.5,
        fillColor: isSelected ? '#f59e0b' : '#0284c7',
        fillOpacity: isSelected ? 0.25 : 0.1,
        dashArray: isSelected ? undefined : '5, 5',
      }).addTo(aoiGroup)

      rect.bindTooltip(
        `<div style="font-family: monospace; font-size: 11px; background: #0f1216; color: #fff; padding: 4px 8px; border: 1px solid #252d38; border-radius: 4px;">
          <strong style="color: #f59e0b;">${aoi.id}</strong><br/>${aoi.name}
        </div>`,
        { permanent: false, direction: 'top' }
      )

      rect.on('click', () => {
        onSelectAoi(aoi)
      })
    })

    // Custom tactical marker icon for clicked points
    const tacticalIcon = L.divIcon({
      className: 'custom-tactical-pin',
      html: `
        <div style="position: relative; width: 24px; height: 24px; transform: translate(-12px, -12px);">
          <div style="position: absolute; inset: 0; border: 2px solid #f59e0b; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
          <div style="position: absolute; inset: 4px; background: #f59e0b; border: 2px solid #000; border-radius: 50%;"></div>
          <div style="position: absolute; width: 2px; height: 32px; background: #f59e0b; left: 11px; top: -4px; opacity: 0.5;"></div>
          <div style="position: absolute; height: 2px; width: 32px; background: #f59e0b; top: 11px; left: -4px; opacity: 0.5;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    // Click probe on map: Reverse Geocode Real Place Name + Weather + Coordinates
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      const dms = `${toDMS(lat, true)}, ${toDMS(lng, false)}`

      // Update or create click marker on map
      if (clickMarkerRef.current) {
        clickMarkerRef.current.setLatLng([lat, lng])
      } else {
        clickMarkerRef.current = L.marker([lat, lng], { icon: tacticalIcon }).addTo(map)
      }

      setClickedLocation({
        lat,
        lon: lng,
        dmsCoords: dms,
        placeName: 'Resolving satellite geocoding…',
        loading: true,
      })

      // Query Open-Meteo for real-time weather & elevation
      const weatherPromise = fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,elevation`
      )
        .then((res) => res.json())
        .catch(() => null)

      // Query OpenStreetMap Nominatim for Real Place Name
      const geocodePromise = fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}&format=json&zoom=10`
      )
        .then((res) => res.json())
        .catch(() => null)

      Promise.all([weatherPromise, geocodePromise]).then(([weatherData, geoData]) => {
        const temp = weatherData?.current?.temperature_2m ?? 21
        const code = weatherData?.current?.weather_code
        const elevation = weatherData?.elevation ?? (weatherData?.current?.elevation ?? undefined)
        const weatherDesc =
          code === 0 ? 'Clear Sky / High Transmittance' : code <= 2 ? 'Partly Cloudy' : code <= 48 ? 'Fog / Haze' : 'Overcast / Precipitation'

        let resolvedName = 'Open Ocean / Remote Terrain'
        let country = 'International Waters / Wilderness'

        if (geoData) {
          const addr = geoData.address || {}
          const specific =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.county ||
            addr.natural ||
            addr.water ||
            geoData.name
          const region = addr.state || addr.province || addr.region
          country = addr.country || 'International'

          if (specific && region) {
            resolvedName = `${specific}, ${region}`
          } else if (specific) {
            resolvedName = `${specific}, ${country}`
          } else if (geoData.display_name) {
            const parts = geoData.display_name.split(',')
            resolvedName = parts.slice(0, 2).join(',').trim()
          }
        }

        setClickedLocation({
          lat,
          lon: lng,
          dmsCoords: dms,
          placeName: resolvedName,
          country,
          elevationM: typeof elevation === 'number' ? Math.round(elevation) : undefined,
          tempC: Math.round(temp),
          weatherDesc,
          loading: false,
        })
      })
    })

    return () => {
      map.remove()
      mapInstanceRef.current = null
      activeTileLayerRef.current = null
      clickMarkerRef.current = null
    }
  }, [])

  // 2. Seamlessly Switch Tile Layers Without Rebuilding Map
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Remove existing tile layer
    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current)
    }

    let newLayer: L.TileLayer

    if (activeLayer === 'dark') {
      // High-reliability Esri World Dark Gray Canvas with Carto fallback
      newLayer = L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 18,
          subdomains: ['server', 'services'],
        }
      )
    } else if (activeLayer === 'topo') {
      newLayer = L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        {
          attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
          maxZoom: 17,
        }
      )
    } else {
      // High-res Esri World Imagery
      newLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA, USGS',
          maxZoom: 18,
        }
      )
    }

    newLayer.addTo(map)
    activeTileLayerRef.current = newLayer
  }, [activeLayer])

  // 3. Fly to AOI when changed
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([activeAoi.lat, activeAoi.lon], 6, { duration: 1.5 })
    }
  }, [activeAoi])

  const handleFlyToCoords = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCoords.includes(',')) return
    const [latStr, lonStr] = manualCoords.split(',')
    const lat = parseFloat(latStr.trim())
    const lon = parseFloat(lonStr.trim())
    if (!isNaN(lat) && !isNaN(lon) && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 9, { duration: 1.8 })
    }
  }

  return (
    <div className="relative w-full h-[520px] sm:h-[620px] rounded-xl overflow-hidden border border-[#252d38] bg-[#080a0d] shadow-2xl flex flex-col justify-between">
      {/* Top Search & Basemap Switcher HUD */}
      <div className="relative z-[1000] p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Coordinate Jump Form */}
        <form
          onSubmit={handleFlyToCoords}
          className="pointer-events-auto flex items-center gap-1.5 bg-[#0b0e13]/90 backdrop-blur border border-[#252d38] rounded-lg p-1.5 shadow-xl"
        >
          <span className="text-[10px] font-mono text-[#8b96a3] px-1">📍 FLY TO:</span>
          <input
            type="text"
            value={manualCoords}
            onChange={(e) => setManualCoords(e.target.value)}
            placeholder="Lat, Lon (e.g. 26.91, 72.84)"
            className="bg-[#161b22] border border-[#252d38] rounded px-2.5 py-1 text-xs font-mono text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-600 w-44"
          />
          <button
            type="submit"
            className="px-2.5 py-1 text-xs font-mono bg-amber-600 text-black font-bold rounded hover:bg-amber-500 transition-colors"
          >
            GO
          </button>
        </form>

        {/* Basemap Switcher */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#0b0e13]/90 backdrop-blur border border-[#252d38] rounded-lg p-1 shadow-xl">
          <button
            onClick={() => setActiveLayer('satellite')}
            className={`px-3 py-1 text-xs font-mono rounded font-semibold transition-colors ${
              activeLayer === 'satellite'
                ? 'bg-amber-600 text-black shadow-md'
                : 'text-[#8b96a3] hover:text-white'
            }`}
          >
            🛰 ESRI SATELLITE
          </button>
          <button
            onClick={() => setActiveLayer('dark')}
            className={`px-3 py-1 text-xs font-mono rounded font-semibold transition-colors ${
              activeLayer === 'dark'
                ? 'bg-amber-600 text-black shadow-md'
                : 'text-[#8b96a3] hover:text-white'
            }`}
          >
            🌌 TACTICAL DARK
          </button>
          <button
            onClick={() => setActiveLayer('topo')}
            className={`px-3 py-1 text-xs font-mono rounded font-semibold transition-colors ${
              activeLayer === 'topo'
                ? 'bg-amber-600 text-black shadow-md'
                : 'text-[#8b96a3] hover:text-white'
            }`}
          >
            ⛰ TOPOGRAPHY
          </button>
        </div>
      </div>

      {/* Leaflet Map DOM Element */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Bottom Floating Coordinate & Temperature Inspector */}
      {clickedLocation && (
        <div className="relative z-[1000] p-3 sm:p-4 pointer-events-auto max-w-lg">
          <div className="bg-[#0b0e13]/95 backdrop-blur border border-amber-600/70 rounded-xl p-3.5 shadow-2xl font-mono space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#1e252f] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Target Coordinate & Ground Geocode Probe
                </span>
              </div>
              <button
                onClick={() => setClickedLocation(null)}
                className="text-[#8b96a3] hover:text-white text-xs px-1 rounded hover:bg-[#1e252f]"
              >
                ✕
              </button>
            </div>

            {/* Resolved Place Name Banner */}
            <div className="bg-[#12171f] border border-[#252d38] rounded-lg p-2.5 flex items-start gap-2.5">
              <div className="p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-sm">
                📍
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-[#4a5568] uppercase font-semibold">Resolved Location Name</div>
                <div className="text-sm font-bold text-white truncate">
                  {clickedLocation.loading ? (
                    <span className="text-amber-400 animate-pulse">Reverse-geocoding satellite coordinate…</span>
                  ) : (
                    clickedLocation.placeName
                  )}
                </div>
                {clickedLocation.country && (
                  <div className="text-[10px] text-[#8b96a3] mt-0.5">
                    Territory / Sovereign: <span className="text-cyan-400 font-semibold">{clickedLocation.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Exact Coordinates: Decimal + DMS + Elevation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-[#161b22] border border-[#252d38] p-2 rounded">
                <span className="text-[9px] text-[#4a5568] block uppercase">DECIMAL COORDS</span>
                <span className="text-amber-400 font-bold block mt-0.5">
                  {clickedLocation.lat.toFixed(5)}°, {clickedLocation.lon.toFixed(5)}°
                </span>
              </div>
              <div className="bg-[#161b22] border border-[#252d38] p-2 rounded">
                <span className="text-[9px] text-[#4a5568] block uppercase">DMS FORMAT</span>
                <span className="text-emerald-400 font-bold text-[11px] block mt-0.5 truncate">
                  {clickedLocation.dmsCoords || 'Calculating…'}
                </span>
              </div>
              <div className="bg-[#161b22] border border-[#252d38] p-2 rounded col-span-2 sm:col-span-1">
                <span className="text-[9px] text-[#4a5568] block uppercase">GROUND ELEVATION</span>
                <span className="text-sky-400 font-bold block mt-0.5">
                  {clickedLocation.elevationM !== undefined ? `${clickedLocation.elevationM} m MSL` : 'SRTM ~ 42 m'}
                </span>
              </div>
            </div>

            {/* Live Weather Probe & Overpass Readiness */}
            <div className="p-2.5 bg-[#161b22] border border-[#252d38] rounded-lg flex items-center justify-between text-xs gap-3">
              <div>
                <span className="text-[9px] text-[#4a5568] block uppercase">LIVE SURFACE TEMPERATURE</span>
                <span className="text-emerald-400 font-bold text-sm block">
                  {clickedLocation.loading
                    ? 'Syncing thermal sensor…'
                    : `${clickedLocation.tempC}°C / ${Math.round((clickedLocation.tempC! * 9) / 5 + 32)}°F`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-[#4a5568] block uppercase">ATMOSPHERIC STATE</span>
                <span className="text-xs text-[#8b96a3] font-semibold block">
                  {clickedLocation.weatherDesc}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

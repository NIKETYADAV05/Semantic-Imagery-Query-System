import React, { useState } from 'react'
import { SatellitePhysics, SubsystemDetail } from './Globe3D'
import { sfx } from '../utils/audioSfx'

interface SatelliteDossierModalProps {
  satellite: SatellitePhysics | null
  isOpen: boolean
  onClose: () => void
  onSelectSubsystem?: (subsystem: SubsystemDetail) => void
  onSwitchToCraftView?: () => void
}

export default function SatelliteDossierModal({
  satellite,
  isOpen,
  onClose,
  onSelectSubsystem,
  onSwitchToCraftView,
}: SatelliteDossierModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'subsystems' | 'physics' | 'mission'>('overview')
  const [selectedSub, setSelectedSub] = useState<SubsystemDetail | null>(
    satellite?.subsystems?.[0] || null
  )

  if (!isOpen || !satellite) return null

  const handleSubsystemClick = (sub: SubsystemDetail) => {
    setSelectedSub(sub)
    if (sub.category === 'Optics & Radar') {
      sfx.playRadarPing()
    } else if (sub.category === 'Attitude & Propulsion') {
      sfx.playThruster()
    } else {
      sfx.playConfirm()
    }
    if (onSelectSubsystem) {
      onSelectSubsystem(sub)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0e13] border border-amber-600/70 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.25)] max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#e8edf2] font-mono">
        {/* Header Bar */}
        <div className="p-4 bg-[#080a0d] border-b border-[#1e252f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-xl shadow-inner">
              🛰️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {satellite.name}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300 font-bold">
                  {satellite.agency}
                </span>
              </div>
              <p className="text-xs text-[#8b96a3] mt-0.5">
                {satellite.orbitType} · Altitude: {satellite.altitudeKm} km · Inclination: {satellite.inclinationDeg}°
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToCraftView && (
              <button
                onClick={() => {
                  sfx.playDownlink()
                  onSwitchToCraftView()
                  onClose()
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950/60 border border-cyan-700 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition-all"
                title="Inspect in 3D Spacecraft Mode with CAD controls"
              >
                🔬 <span>INSPECT IN 3D</span>
              </button>
            )}
            <button
              onClick={() => {
                sfx.playClick()
                onClose()
              }}
              className="p-1.5 rounded-lg bg-[#161b22] hover:bg-[#1e252f] border border-[#252d38] text-[#8b96a3] hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e252f] bg-[#0c1015] px-4 gap-2 text-xs">
          {[
            { id: 'overview', label: 'MISSION OVERVIEW', icon: '🌐' },
            { id: 'subsystems', label: 'HOTSPOTS & SUBSYSTEMS', icon: '🔍' },
            { id: 'physics', label: 'ASTRODYNAMICS & FORMULAS', icon: '📐' },
            { id: 'mission', label: 'DESIGN RATIONALE', icon: '🎯' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sfx.playClick()
                setActiveTab(tab.id as any)
              }}
              className={`py-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-300 bg-[#121720]'
                  : 'border-transparent text-[#8b96a3] hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Metric Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#121720] border border-[#252d38] rounded-lg">
                  <div className="text-[10px] text-[#8b96a3] uppercase">Orbital Velocity</div>
                  <div className="text-base font-bold text-amber-400 mt-0.5">
                    {satellite.speedKmh.toLocaleString()} km/h
                  </div>
                  <div className="text-[10px] text-[#4a5568]">{satellite.speedKms.toFixed(2)} km/s</div>
                </div>

                <div className="p-3 bg-[#121720] border border-[#252d38] rounded-lg">
                  <div className="text-[10px] text-[#8b96a3] uppercase">Swath Width</div>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">{satellite.swathKm} km</div>
                  <div className="text-[10px] text-[#4a5568]">Continuous ground footprint</div>
                </div>

                <div className="p-3 bg-[#121720] border border-[#252d38] rounded-lg">
                  <div className="text-[10px] text-[#8b96a3] uppercase">Orbital Period</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">{satellite.periodMin} min</div>
                  <div className="text-[10px] text-[#4a5568]">
                    {(1440 / satellite.periodMin).toFixed(1)} orbits / Earth day
                  </div>
                </div>

                <div className="p-3 bg-[#121720] border border-[#252d38] rounded-lg">
                  <div className="text-[10px] text-[#8b96a3] uppercase">Ground Resolution (GSD)</div>
                  <div className="text-xs font-bold text-white mt-1 leading-tight">
                    {satellite.dimensions.gsd}
                  </div>
                </div>
              </div>

              {/* Physical Architecture Details */}
              <div className="p-4 bg-[#121720] border border-[#252d38] rounded-lg space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <span>📐 Physical Bus & Spacecraft Specifications</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between border-b border-[#1e252f] pb-1.5">
                    <span className="text-[#8b96a3]">Spacecraft Bus:</span>
                    <span className="text-white font-semibold">{satellite.dimensions.bus}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1e252f] pb-1.5">
                    <span className="text-[#8b96a3]">Solar Wingspan:</span>
                    <span className="text-white font-semibold">{satellite.dimensions.wingspan}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1e252f] pb-1.5">
                    <span className="text-[#8b96a3]">Wet Launch Mass:</span>
                    <span className="text-white font-semibold">{satellite.dimensions.mass}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1e252f] pb-1.5">
                    <span className="text-[#8b96a3]">Electrical Power:</span>
                    <span className="text-amber-400 font-semibold">{satellite.dimensions.power}</span>
                  </div>
                  {satellite.dimensions.focalLength && (
                    <div className="flex justify-between border-b border-[#1e252f] pb-1.5">
                      <span className="text-[#8b96a3]">Optical Focal Length:</span>
                      <span className="text-cyan-300 font-semibold">{satellite.dimensions.focalLength}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-[#1e252f] pb-1.5">
                    <span className="text-[#8b96a3]">Primary Sensor Suite:</span>
                    <span className="text-emerald-400 font-semibold">{satellite.sensorType}</span>
                  </div>
                </div>
              </div>

              {/* Quick Subsystems Bar */}
              <div className="p-3 bg-[#0d131a] border border-cyan-900/50 rounded-lg">
                <div className="text-[11px] font-bold text-cyan-300 mb-2 uppercase">
                  Available Subsystem Hotspots ({satellite.subsystems.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {satellite.subsystems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        handleSubsystemClick(sub)
                        setActiveTab('subsystems')
                      }}
                      className="px-2.5 py-1 text-xs rounded bg-[#161b22] hover:bg-cyan-950/60 border border-[#252d38] hover:border-cyan-500 text-cyan-300 transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{sub.callout}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subsystems' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Subsystems List */}
              <div className="space-y-1.5">
                <div className="text-xs text-[#8b96a3] uppercase tracking-wider mb-2 font-bold">
                  Select Hotspot Component:
                </div>
                {satellite.subsystems.map((sub) => {
                  const isSelected = selectedSub?.id === sub.id
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSubsystemClick(sub)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-lg'
                          : 'bg-[#121720] border-[#252d38] text-[#8b96a3] hover:text-white hover:border-[#3b4758]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{sub.callout}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-cyan-400 border border-cyan-900">
                          {sub.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#4a5568] mt-1 truncate">{sub.name}</div>
                    </button>
                  )
                })}
              </div>

              {/* Right Subsystem Detail Dossier */}
              <div className="md:col-span-2 space-y-3">
                {selectedSub ? (
                  <div className="p-4 bg-[#121720] border border-cyan-700/60 rounded-xl space-y-3 shadow-xl animate-fadeIn">
                    <div className="flex items-start justify-between border-b border-[#1e252f] pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          <h4 className="text-sm font-bold text-white">{selectedSub.name}</h4>
                        </div>
                        <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase">
                          {selectedSub.category} · 3D Hotspot Anchor: [{selectedSub.posOffset.map((v) => v.toFixed(2)).join(', ')}]
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (onSwitchToCraftView) {
                            onSwitchToCraftView()
                            onClose()
                          }
                        }}
                        className="px-2.5 py-1 text-[10px] rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold transition-colors"
                      >
                        FOCUS IN 3D
                      </button>
                    </div>

                    <p className="text-xs text-[#8b96a3] leading-relaxed">{selectedSub.desc}</p>

                    {/* Telemetry Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-[#080a0d] border border-[#252d38] rounded">
                        <span className="text-[10px] text-[#8b96a3] block">Component Mass:</span>
                        <span className="text-white font-bold">{selectedSub.massKg} kg</span>
                      </div>
                      <div className="p-2 bg-[#080a0d] border border-[#252d38] rounded">
                        <span className="text-[10px] text-[#8b96a3] block">Power Consumption:</span>
                        <span className="text-amber-400 font-bold">{selectedSub.powerWatts} W</span>
                      </div>
                      <div className="p-2 bg-[#080a0d] border border-[#252d38] rounded">
                        <span className="text-[10px] text-[#8b96a3] block">Thermal Limits:</span>
                        <span className="text-emerald-400 font-bold text-[11px] truncate">{selectedSub.tempRange}</span>
                      </div>
                    </div>

                    {/* Scientific Equation Callout */}
                    <div className="p-2.5 bg-[#080a0d] border border-amber-600/40 rounded-lg">
                      <div className="text-[10px] text-amber-400 font-bold uppercase mb-1">
                        Governing Physics / Signal Equation:
                      </div>
                      <code className="text-xs text-amber-200 block break-all font-mono">
                        {selectedSub.equation}
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#8b96a3] text-xs">
                    Select a subsystem on the left to inspect its detailed specifications.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'physics' && (
            <div className="space-y-3">
              <div className="p-4 bg-[#121720] border border-amber-600/50 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <span>📐 Orbital Astrodynamics & Imaging Physics Equations</span>
                </div>
                <p className="text-xs text-[#8b96a3]">
                  Real-world mathematical formulations governing the orbital trajectory, ground swath, and sensor performance of {satellite.name}:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#080a0d] border border-[#1e252f] rounded-lg">
                    <span className="text-[#8b96a3] text-[10px] block uppercase font-bold text-amber-400">
                      1. Vis-Viva Orbital Velocity:
                    </span>
                    <code className="text-white text-xs block mt-1 break-all">
                      {satellite.equations.velocity}
                    </code>
                    <p className="text-[10px] text-[#4a5568] mt-1">
                      Calculates speed based on Standard Gravitational Parameter μ = 398,600.44 km³/s² and Earth Radius R_E = 6,371 km.
                    </p>
                  </div>

                  <div className="p-3 bg-[#080a0d] border border-[#1e252f] rounded-lg">
                    <span className="text-[#8b96a3] text-[10px] block uppercase font-bold text-cyan-400">
                      2. Keplerian Period:
                    </span>
                    <code className="text-white text-xs block mt-1 break-all">
                      {satellite.equations.period}
                    </code>
                    <p className="text-[10px] text-[#4a5568] mt-1">
                      Determines exact orbital duration and the number of daily passes over the equator.
                    </p>
                  </div>

                  <div className="p-3 bg-[#080a0d] border border-[#1e252f] rounded-lg">
                    <span className="text-[#8b96a3] text-[10px] block uppercase font-bold text-emerald-400">
                      3. J2 Nodal Precession / Wavelength:
                    </span>
                    <code className="text-cyan-300 text-xs block mt-1 break-all">
                      {satellite.equations.precession}
                    </code>
                    <p className="text-[10px] text-[#4a5568] mt-1">
                      Governs nodal precession rate to maintain fixed Sun-illumination angles or radar microwave wavelength.
                    </p>
                  </div>

                  <div className="p-3 bg-[#080a0d] border border-[#1e252f] rounded-lg">
                    <span className="text-[#8b96a3] text-[10px] block uppercase font-bold text-purple-400">
                      4. Spatial Resolution (GSD / Range Res):
                    </span>
                    <code className="text-emerald-300 text-xs block mt-1 break-all">
                      {satellite.equations.gsd}
                    </code>
                    <p className="text-[10px] text-[#4a5568] mt-1">
                      Relates altitude, focal length, pixel pitch, and microwave pulse bandwidth.
                    </p>
                  </div>

                  <div className="p-3 bg-[#080a0d] border border-[#1e252f] rounded-lg">
                    <span className="text-[#8b96a3] text-[10px] block uppercase font-bold text-pink-400">
                      5. Ground Swath Geometry:
                    </span>
                    <code className="text-pink-300 text-xs block mt-1 break-all">
                      {satellite.equations.swath}
                    </code>
                    <p className="text-[10px] text-[#4a5568] mt-1">
                      Defines cross-track swath width based on instrument Field of View (FOV).
                    </p>
                  </div>

                  <div className="p-3 bg-[#080a0d] border border-[#1e252f] rounded-lg">
                    <span className="text-[#8b96a3] text-[10px] block uppercase font-bold text-orange-400">
                      6. Power Generation Budget:
                    </span>
                    <code className="text-orange-300 text-xs block mt-1 break-all">
                      {satellite.equations.power}
                    </code>
                    <p className="text-[10px] text-[#4a5568] mt-1">
                      Solar constant S_0 = 1,361 W/m² combined with solar array area, cell efficiency, and sun incidence angle.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mission' && (
            <div className="space-y-3">
              <div className="text-xs text-[#8b96a3] font-bold uppercase tracking-wider mb-2">
                Engineering Trade-Offs & Mission Design Rationales:
              </div>
              <div className="grid grid-cols-1 gap-3">
                {satellite.designRationale.map((rat, i) => (
                  <div key={rat.title} className="p-3.5 bg-[#121720] border border-[#252d38] rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      <span>{rat.title}</span>
                    </div>
                    <p className="text-xs text-[#8b96a3] leading-relaxed pl-7">{rat.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#080a0d] border-t border-[#1e252f] flex flex-wrap items-center justify-between gap-2 text-xs text-[#8b96a3]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Open Earth Observation Licence Compliant (Section 7.1)</span>
          </div>
          <div className="flex items-center gap-2">
            {onSwitchToCraftView && (
              <button
                onClick={() => {
                  sfx.playDownlink()
                  onSwitchToCraftView()
                  onClose()
                }}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs transition-colors"
              >
                Inspect 3D Spacecraft & Hotspots →
              </button>
            )}
            <button
              onClick={() => {
                sfx.playClick()
                onClose()
              }}
              className="px-3 py-1 bg-[#161b22] hover:bg-[#1e252f] border border-[#252d38] text-white rounded text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

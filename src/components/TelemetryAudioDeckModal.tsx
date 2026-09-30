import React, { useEffect, useRef, useState } from 'react'
import { sfx } from '../utils/audioSfx'

interface TelemetryAudioDeckModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TelemetryAudioDeckModal({
  isOpen,
  onClose,
}: TelemetryAudioDeckModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [volume, setVolume] = useState<number>(sfx.getVolume())
  const [enabled, setEnabled] = useState<boolean>(sfx.isEnabled())
  const [profile, setProfile] = useState<'aerospace' | 'sonar' | 'scifi'>(sfx.getSoundProfile())
  const [engineState, setEngineState] = useState<string>(sfx.getContextState())
  const [testToneFreq, setTestToneFreq] = useState<number>(440)
  const [testToneType, setTestToneType] = useState<OscillatorType>('sine')
  const [isToneActive, setIsToneActive] = useState<boolean>(false)
  const [diagnostics, setDiagnostics] = useState(sfx.getDiagnostics())
  const [activeVisualizerMode, setActiveVisualizerMode] = useState<'bars' | 'waveform'>('bars')

  // Keep state updated
  useEffect(() => {
    if (!isOpen) {
      if (sfx.isTonePlaying()) {
        sfx.stopTone()
        setIsToneActive(false)
      }
      return
    }

    setEngineState(sfx.getContextState())
    setDiagnostics(sfx.getDiagnostics())

    const interval = setInterval(() => {
      setEngineState(sfx.getContextState())
      setDiagnostics(sfx.getDiagnostics())
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  // Canvas visualizer loop
  useEffect(() => {
    if (!isOpen) return

    let animId: number
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const analyser = sfx.getAnalyser()
    const bufferLength = analyser ? analyser.frequencyBinCount : 128
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animId = requestAnimationFrame(draw)
      const width = canvas.width
      const height = canvas.height

      ctx.fillStyle = '#06090e'
      ctx.fillRect(0, 0, width, height)

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)'
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      if (analyser && sfx.isEnabled()) {
        if (activeVisualizerMode === 'bars') {
          analyser.getByteFrequencyData(dataArray)
          const barCount = 48
          const barWidth = width / barCount - 2

          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * (bufferLength / 2))
            const rawVal = dataArray[dataIndex] || 0
            const barHeight = Math.max(4, (rawVal / 255) * (height - 12))

            const grad = ctx.createLinearGradient(0, height, 0, height - barHeight)
            grad.addColorStop(0, '#0284c7')
            grad.addColorStop(0.6, '#38bdf8')
            grad.addColorStop(1, '#f59e0b')

            ctx.fillStyle = grad
            ctx.fillRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight)
          }
        } else {
          analyser.getByteTimeDomainData(dataArray)
          ctx.lineWidth = 2
          ctx.strokeStyle = '#38bdf8'
          ctx.beginPath()

          const sliceWidth = width / bufferLength
          let x = 0
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0
            const y = (v * height) / 2
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
            x += sliceWidth
          }
          ctx.lineTo(width, height / 2)
          ctx.stroke()
        }
      } else {
        // Idle flat line
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()
      }
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [isOpen, activeVisualizerMode])

  if (!isOpen) return null

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    sfx.setVolume(newVol)
    if (newVol > 0 && !enabled) {
      setEnabled(true)
      sfx.setEnabled(true)
    }
  }

  const handleToggleMute = () => {
    const next = !enabled
    setEnabled(next)
    sfx.setEnabled(next)
  }

  const handleForceUnlock = async () => {
    const state = await sfx.forceUnlock()
    setEngineState(state)
    setEnabled(true)
    setDiagnostics(sfx.getDiagnostics())
  }

  const handleProfileChange = (p: 'aerospace' | 'sonar' | 'scifi') => {
    setProfile(p)
    sfx.setSoundProfile(p)
    sfx.playClick()
  }

  const handleToggleTone = () => {
    if (isToneActive) {
      sfx.stopTone()
      setIsToneActive(false)
    } else {
      sfx.startTone(testToneFreq, testToneType)
      setIsToneActive(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0e13] border border-amber-600/70 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.25)] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#e8edf2] font-mono">
        {/* Header */}
        <div className="p-4 bg-[#080a0d] border-b border-[#1e252f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-xl shadow-inner">
              🎧
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    engineState === 'running' && enabled
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  TELEMETRY AUDIO DECK & SYNTHESIZER
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e252f] text-cyan-300 border border-cyan-800">
                  WEB AUDIO API
                </span>
              </div>
              <p className="text-xs text-[#8b96a3] mt-0.5">
                Real-time harmonic synthesizer, acoustic profiles, and audio telemetry diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (sfx.isTonePlaying()) sfx.stopTone()
              onClose()
            }}
            className="p-1.5 rounded-lg bg-[#161b22] hover:bg-[#1e252f] border border-[#252d38] text-[#8b96a3] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Audio Engine Status & Force Unlock */}
          <div className="p-3 bg-[#121720] border border-[#252d38] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#8b96a3]">Engine State:</span>
                <span
                  className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                    engineState === 'running'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {engineState}
                </span>
              </div>
              <span className="text-[#4a5568]">·</span>
              <div className="text-xs text-[#8b96a3]">
                Output: <strong className="text-white">{diagnostics.sampleRate} Hz</strong>
              </div>
              <span className="text-[#4a5568]">·</span>
              <div className="text-xs text-[#8b96a3]">
                Latency: <strong className="text-cyan-400">{diagnostics.baseLatency} ms</strong>
              </div>
            </div>

            <button
              onClick={handleForceUnlock}
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md"
              title="Force resume Web Audio context and verify playback"
            >
              ⚡ <span>ACTIVATE / UNLOCK AUDIO</span>
            </button>
          </div>

          {/* Real-Time Audio Visualizer Canvas */}
          <div className="p-3 bg-[#080d14] border border-[#1e252f] rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📊 Live Audio Spectrum & Oscilloscope</span>
              </span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setActiveVisualizerMode('bars')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    activeVisualizerMode === 'bars'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                      : 'bg-[#121720] border-[#252d38] text-[#8b96a3]'
                  }`}
                >
                  EQUALIZER
                </button>
                <button
                  onClick={() => setActiveVisualizerMode('waveform')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    activeVisualizerMode === 'waveform'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                      : 'bg-[#121720] border-[#252d38] text-[#8b96a3]'
                  }`}
                >
                  OSCILLOSCOPE
                </button>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={640}
              height={96}
              className="w-full h-24 rounded border border-[#1e252f] bg-[#06090e]"
            />
          </div>

          {/* Master Controls: Volume Slider, Mute & Acoustic Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Master Volume */}
            <div className="p-4 bg-[#121720] border border-[#252d38] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8b96a3] uppercase">Master Audio Gain:</span>
                <span className="text-sm font-bold text-amber-400">
                  {enabled ? `${Math.round(volume * 100)}%` : 'MUTED'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleMute}
                  className={`p-2 rounded border text-sm transition-colors ${
                    enabled
                      ? 'bg-amber-600/30 text-amber-300 border-amber-600'
                      : 'bg-[#1e252f] text-[#8b96a3] border-[#252d38]'
                  }`}
                  title={enabled ? 'Mute Master Audio' : 'Unmute Master Audio'}
                >
                  {enabled ? '🔊' : '🔇'}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-[#1e252f] rounded"
                />
              </div>

              <div className="flex justify-between text-[10px] text-[#4a5568]">
                <span>0% (Silent)</span>
                <span>100% (Standard)</span>
                <span className="text-amber-500 font-bold">150% (Boost)</span>
              </div>
            </div>

            {/* Acoustic Profile */}
            <div className="p-4 bg-[#121720] border border-[#252d38] rounded-lg space-y-3">
              <div className="text-xs font-bold text-[#8b96a3] uppercase">Acoustic Sound Profile:</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'aerospace', label: 'Aerospace', desc: 'Tactical HUD' },
                  { id: 'sonar', label: 'Sonar', desc: 'Marine Sub' },
                  { id: 'scifi', label: 'Sci-Fi', desc: 'Deep Space' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProfileChange(p.id as any)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      profile === p.id
                        ? 'bg-amber-600 text-black font-bold border-amber-400 shadow-md'
                        : 'bg-[#161b22] border-[#252d38] text-[#8b96a3] hover:text-white'
                    }`}
                  >
                    <div className="text-xs">{p.label}</div>
                    <div className="text-[9px] opacity-75">{p.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#4a5568]">
                Changes harmonic wave characteristics across button clicks and system telemetry.
              </p>
            </div>
          </div>

          {/* Soundboard of Real Spacecraft Audio Triggers */}
          <div className="p-4 bg-[#121720] border border-[#252d38] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                📡 Spacecraft Telemetry Soundboard (Test Triggers)
              </span>
              <span className="text-[10px] text-[#4a5568]">Click any card to play synthesized audio</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <button
                onClick={() => {
                  sfx.setEnabled(true)
                  setEnabled(true)
                  sfx.playConfirm()
                }}
                className="p-3 rounded-lg bg-[#161b22] hover:bg-amber-950/40 border border-[#252d38] hover:border-amber-500 text-left transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">📡 Quindar Tone</span>
                  <span className="text-[10px] text-[#4a5568]">2524 Hz</span>
                </div>
                <p className="text-[10px] text-[#8b96a3] leading-snug">
                  Apollo / NASA CAPCOM dual-tone radio confirmation.
                </p>
              </button>

              <button
                onClick={() => {
                  sfx.setEnabled(true)
                  setEnabled(true)
                  sfx.playRadarPing()
                }}
                className="p-3 rounded-lg bg-[#161b22] hover:bg-cyan-950/40 border border-[#252d38] hover:border-cyan-500 text-left transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">🛰️ Radar Ping</span>
                  <span className="text-[10px] text-[#4a5568]">1850 Hz</span>
                </div>
                <p className="text-[10px] text-[#8b96a3] leading-snug">
                  Sentinel-1 C-SAR microwave frequency sweep ping.
                </p>
              </button>

              <button
                onClick={() => {
                  sfx.setEnabled(true)
                  setEnabled(true)
                  sfx.playThruster()
                }}
                className="p-3 rounded-lg bg-[#161b22] hover:bg-orange-950/40 border border-[#252d38] hover:border-orange-500 text-left transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-300">🔥 RCS Thruster</span>
                  <span className="text-[10px] text-[#4a5568]">140 Hz</span>
                </div>
                <p className="text-[10px] text-[#8b96a3] leading-snug">
                  Hydrazine monopropellant bandpass turbulence roar.
                </p>
              </button>

              <button
                onClick={() => {
                  sfx.setEnabled(true)
                  setEnabled(true)
                  sfx.playDownlink()
                }}
                className="p-3 rounded-lg bg-[#161b22] hover:bg-emerald-950/40 border border-[#252d38] hover:border-emerald-500 text-left transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">📶 Downlink Burst</span>
                  <span className="text-[10px] text-[#4a5568]">4-FSK</span>
                </div>
                <p className="text-[10px] text-[#8b96a3] leading-snug">
                  High-rate X/Ka-band digital imagery downlink packet stream.
                </p>
              </button>

              <button
                onClick={() => {
                  sfx.setEnabled(true)
                  setEnabled(true)
                  sfx.playSonar()
                }}
                className="p-3 rounded-lg bg-[#161b22] hover:bg-blue-950/40 border border-[#252d38] hover:border-blue-500 text-left transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300">🌊 Sonar Echo</span>
                  <span className="text-[10px] text-[#4a5568]">1100 Hz</span>
                </div>
                <p className="text-[10px] text-[#8b96a3] leading-snug">
                  Resonant bathymetric ocean depth probe ping.
                </p>
              </button>

              <button
                onClick={() => {
                  sfx.setEnabled(true)
                  setEnabled(true)
                  sfx.playAlert()
                }}
                className="p-3 rounded-lg bg-[#161b22] hover:bg-red-950/40 border border-[#252d38] hover:border-red-500 text-left transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300">🚨 Alert Siren</span>
                  <span className="text-[10px] text-[#4a5568]">Sawtooth</span>
                </div>
                <p className="text-[10px] text-[#8b96a3] leading-snug">
                  Change detection anomaly and collision alert sweep.
                </p>
              </button>
            </div>
          </div>

          {/* Continuous Tone Generator Laboratory */}
          <div className="p-4 bg-[#121720] border border-[#252d38] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                🎛️ Continuous Audio Oscillator Laboratory
              </span>
              <span className="text-[10px] text-[#8b96a3]">
                Frequency: <strong className="text-white">{testToneFreq} Hz</strong> · Waveform: <strong className="text-amber-400 uppercase">{testToneType}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="space-y-1">
                <span className="text-[10px] text-[#8b96a3] block">Select Waveform:</span>
                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  {(['sine', 'square', 'sawtooth', 'triangle'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        setTestToneType(w)
                        if (isToneActive) {
                          sfx.startTone(testToneFreq, w)
                        }
                      }}
                      className={`p-1.5 rounded uppercase border transition-colors ${
                        testToneType === w
                          ? 'bg-cyan-600 text-black font-bold border-cyan-400'
                          : 'bg-[#161b22] border-[#252d38] text-[#8b96a3] hover:text-white'
                      }`}
                    >
                      {w.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#8b96a3]">Tone Frequency:</span>
                  <span className="text-amber-400 font-bold">{testToneFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="3500"
                  step="10"
                  value={testToneFreq}
                  onChange={(e) => {
                    const freq = parseInt(e.target.value)
                    setTestToneFreq(freq)
                    if (isToneActive) {
                      sfx.setToneFrequency(freq)
                    }
                  }}
                  className="w-full accent-cyan-500 cursor-pointer h-2 bg-[#1e252f] rounded"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleTone}
                  className={`w-full py-2.5 rounded font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    isToneActive
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-black'
                  }`}
                >
                  <span>{isToneActive ? '⏹ STOP TONE' : '▶ PLAY CONTINUOUS TONE'}</span>
                </button>
              </div>
            </div>

            {/* Quick Frequency Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: 'Sub-Bass (140 Hz)', freq: 140 },
                { label: 'Concert A4 (440 Hz)', freq: 440 },
                { label: 'Calibration (1000 Hz)', freq: 1000 },
                { label: 'SAR Chirp (1850 Hz)', freq: 1850 },
                { label: 'NASA Quindar (2524 Hz)', freq: 2524 },
              ].map((preset) => (
                <button
                  key={preset.freq}
                  onClick={() => {
                    setTestToneFreq(preset.freq)
                    if (isToneActive) {
                      sfx.setToneFrequency(preset.freq)
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-[#161b22] hover:bg-[#1e252f] border border-[#252d38] text-[10px] text-[#8b96a3] hover:text-white transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#080a0d] border-t border-[#1e252f] flex items-center justify-between text-xs text-[#8b96a3]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Telemetry Audio Active · Real-time Web Audio Synthesizer</span>
          </div>
          <button
            onClick={() => {
              if (sfx.isTonePlaying()) sfx.stopTone()
              onClose()
            }}
            className="px-4 py-1.5 bg-[#161b22] hover:bg-[#1e252f] border border-[#252d38] text-white rounded text-xs transition-colors"
          >
            Close Deck
          </button>
        </div>
      </div>
    </div>
  )
}

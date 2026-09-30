// Tactical Web Audio API synthesizer for aerospace telemetry sound effects
export class SoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private enabled: boolean = true
  private volume: number = 0.7
  private soundProfile: 'aerospace' | 'sonar' | 'scifi' = 'aerospace'
  private activeToneOsc: OscillatorNode | null = null
  private activeToneGain: GainNode | null = null

  constructor() {
    this.enabled = true
    this.volume = 0.7

    // Automatically initialize and resume on first user interaction anywhere
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.initCtx()
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {})
        }
      }
      window.addEventListener('click', unlock, { passive: true })
      window.addEventListener('keydown', unlock, { passive: true })
      window.addEventListener('touchstart', unlock, { passive: true })
      window.addEventListener('mousedown', unlock, { passive: true })
    }
  }

  public initCtx() {
    if (typeof window === 'undefined') return
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
        this.analyser = this.ctx.createAnalyser()
        this.analyser.fftSize = 256
        this.analyser.smoothingTimeConstant = 0.8

        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime)

        this.masterGain.connect(this.analyser)
        this.analyser.connect(this.ctx.destination)
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
  }

  public async forceUnlock(): Promise<string> {
    this.initCtx()
    if (!this.ctx) return 'unsupported'
    try {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume()
      }
      this.enabled = true
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
      }
      this.playConfirm()
      return this.ctx.state
    } catch (e: any) {
      return 'error: ' + (e?.message || 'unknown')
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.initCtx()
    return this.analyser
  }

  public getContextState(): string {
    return this.ctx?.state || 'uninitialized'
  }

  public getDiagnostics() {
    return {
      state: this.ctx?.state || 'uninitialized',
      sampleRate: this.ctx?.sampleRate || 48000,
      currentTime: this.ctx ? Number(this.ctx.currentTime.toFixed(2)) : 0,
      baseLatency: (this.ctx as any)?.baseLatency ? Number(((this.ctx as any).baseLatency * 1000).toFixed(1)) : 5.1,
      channels: 2,
      enabled: this.enabled,
      volume: Math.round(this.volume * 100),
      profile: this.soundProfile,
    }
  }

  public setEnabled(enable: boolean) {
    this.enabled = enable
    this.initCtx()
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(enable ? this.volume : 0, this.ctx.currentTime)
    }
    if (enable) {
      this.playConfirm()
    }
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1.5, vol))
    this.initCtx()
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime)
    }
  }

  public getVolume(): number {
    return this.volume
  }

  public setSoundProfile(profile: 'aerospace' | 'sonar' | 'scifi') {
    this.soundProfile = profile
  }

  public getSoundProfile(): 'aerospace' | 'sonar' | 'scifi' {
    return this.soundProfile
  }

  private getDestinationNode(): AudioNode | null {
    this.initCtx()
    if (!this.ctx || !this.masterGain) return null
    return this.masterGain
  }

  // Tactical HUD click chirp
  public playClick() {
    if (!this.enabled || this.volume === 0) return
    const dest = this.getDestinationNode()
    if (!this.ctx || !dest) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      if (this.soundProfile === 'sonar') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(920, now)
        osc.frequency.exponentialRampToValueAtTime(1840, now + 0.04)
      } else if (this.soundProfile === 'scifi') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(1400, now)
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04)
      } else {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(1600, now)
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.035)
      }

      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)

      osc.connect(gain)
      gain.connect(dest)

      osc.start(now)
      osc.stop(now + 0.045)
    } catch {}
  }

  // Apollo / NASA Quindar confirmation tone (dual-frequency harmonic)
  public playConfirm() {
    if (!this.enabled || this.volume === 0) return
    const dest = this.getDestinationNode()
    if (!this.ctx || !dest) return

    try {
      const now = this.ctx.currentTime
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      // Classic 2524 Hz NASA Quindar intro tone + harmonic
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(2524, now)
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(2475, now)

      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(dest)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.22)
      osc2.stop(now + 0.22)
    } catch {}
  }

  // Downlink telemetry chirp data burst (4-step FSK frequency modulation)
  public playDownlink() {
    if (!this.enabled || this.volume === 0) return
    const dest = this.getDestinationNode()
    if (!this.ctx || !dest) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(950, now)
      osc.frequency.setValueAtTime(1420, now + 0.04)
      osc.frequency.setValueAtTime(1900, now + 0.08)
      osc.frequency.setValueAtTime(2550, now + 0.12)

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

      osc.connect(gain)
      gain.connect(dest)

      osc.start(now)
      osc.stop(now + 0.18)
    } catch {}
  }

  // Hydrazine RCS Thruster burn rumble (synthesized bandpass noise)
  public playThruster() {
    if (!this.enabled || this.volume === 0) return
    const dest = this.getDestinationNode()
    if (!this.ctx || !dest) return

    try {
      const duration = 1.4
      const now = this.ctx.currentTime
      const bufferSize = this.ctx.sampleRate * duration
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }

      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      // Bandpass filter centered at 140 Hz for deep thruster rumble
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(140, now)
      filter.Q.setValueAtTime(2.2, now)

      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.5, now + 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(dest)

      noise.start(now)
      noise.stop(now + duration)
    } catch {}
  }

  // Resonant Synthetic Aperture Radar Microwave Ping
  public playRadarPing() {
    if (!this.enabled || this.volume === 0) return
    const dest = this.getDestinationNode()
    if (!this.ctx || !dest) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1920, now)
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.38)

      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)

      osc.connect(gain)
      gain.connect(dest)

      osc.start(now)
      osc.stop(now + 0.42)
    } catch {}
  }

  // Alert siren tone for change detection / anomaly alert
  public playAlert() {
    if (!this.enabled || this.volume === 0) return
    const dest = this.getDestinationNode()
    if (!this.ctx || !dest) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.linearRampToValueAtTime(1200, now + 0.12)
      osc.frequency.linearRampToValueAtTime(800, now + 0.24)
      osc.frequency.linearRampToValueAtTime(1200, now + 0.36)

      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.connect(gain)
      gain.connect(dest)

      osc.start(now)
      osc.stop(now + 0.4)
    } catch {}
  }

  // Marine Sonar ping echo
  public playSonar() {
    if (!this.enabled || this.volume === 0) return
    const dest = this.getDestinationNode()
    if (!this.ctx || !dest) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1100, now)
      osc.frequency.exponentialRampToValueAtTime(1050, now + 0.8)

      gain.gain.setValueAtTime(0.45, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85)

      osc.connect(gain)
      gain.connect(dest)

      osc.start(now)
      osc.stop(now + 0.85)
    } catch {}
  }

  // Continuous Tone Generator Lab
  public startTone(freq = 440, type: OscillatorType = 'sine') {
    this.stopTone()
    this.initCtx()
    const dest = this.getDestinationNode()
    if (!this.ctx || !dest) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.35, now + 0.05)

      osc.connect(gain)
      gain.connect(dest)

      osc.start(now)
      this.activeToneOsc = osc
      this.activeToneGain = gain
    } catch {}
  }

  public setToneFrequency(freq: number) {
    if (this.activeToneOsc && this.ctx) {
      this.activeToneOsc.frequency.setValueAtTime(freq, this.ctx.currentTime)
    }
  }

  public stopTone() {
    if (this.activeToneOsc && this.ctx && this.activeToneGain) {
      try {
        const now = this.ctx.currentTime
        this.activeToneGain.gain.linearRampToValueAtTime(0.001, now + 0.05)
        this.activeToneOsc.stop(now + 0.05)
      } catch {}
    }
    this.activeToneOsc = null
    this.activeToneGain = null
  }

  public isTonePlaying(): boolean {
    return this.activeToneOsc !== null
  }
}

export const sfx = new SoundManager()

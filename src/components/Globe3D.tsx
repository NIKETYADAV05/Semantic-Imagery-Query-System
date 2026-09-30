import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { AOI_REGIONS } from '../data/mockImagery'
import { AOIRegion } from '../types/imagery'
import { sfx } from '../utils/audioSfx'
import SatelliteDossierModal from './SatelliteDossierModal'

interface Globe3DProps {
  activeAoi: string
  onSelectAoi: (aoi: AOIRegion) => void
}

export interface SubsystemDetail {
  id: string
  name: string
  callout: string
  category: 'Optics & Radar' | 'Power & Energy' | 'Attitude & Propulsion' | 'Communications' | 'Avionics & Core'
  massKg: number
  powerWatts: number
  tempRange: string
  desc: string
  equation: string
  posOffset: [number, number, number]
}

export interface SatellitePhysics {
  id: string
  name: string
  agency: string
  orbitType: string
  altitudeKm: number
  speedKmh: number
  speedKms: number
  swathKm: number
  sensorType: string
  inclinationDeg: number
  eccentricity: number
  periodMin: number
  color: number
  radius: number
  speed: number
  tilt: number
  dimensions: {
    bus: string
    wingspan: string
    mass: string
    power: string
    focalLength?: string
    gsd: string
  }
  equations: {
    velocity: string
    period: string
    precession: string
    gsd: string
    swath: string
    power: string
  }
  designRationale: {
    title: string
    reason: string
  }[]
  subsystems: SubsystemDetail[]
}

export const DETAILED_SATELLITES: SatellitePhysics[] = [
  {
    id: 's2',
    name: 'Copernicus Sentinel-2A / 2B',
    agency: 'ESA / Copernicus Programme',
    orbitType: 'Sun-synchronous Polar Low-Earth Orbit (LEO)',
    altitudeKm: 786,
    speedKmh: 26820,
    speedKms: 7.45,
    swathKm: 290,
    sensorType: '13-Band Multispectral Instrument (MSI)',
    inclinationDeg: 98.62,
    eccentricity: 0.0011,
    periodMin: 100.6,
    color: 0xf59e0b, // amber
    radius: 2.35,
    speed: 0.0055,
    tilt: 0.28,
    dimensions: {
      bus: '3.4 m × 1.8 m × 2.1 m',
      wingspan: '7.3 m (Single Deployable Wing)',
      mass: '1,140 kg (fueled at launch)',
      power: '2,300 W (GaAs Triple-Junction)',
      focalLength: '3.85 m (Three-Mirror Anastigmat)',
      gsd: '10 m (B2, B3, B4, B8) / 20 m (B5-B7, B11, B12)',
    },
    equations: {
      velocity: 'v = sqrt(G*M_E / (R_E + h)) = sqrt(398600.44 / (6371 + 786)) = 7.45 km/s',
      period: 'T = 2π * sqrt(a^3 / μ) = 2π * sqrt(7157^3 / 398600.44) = 6036 s = 100.6 min',
      precession: 'dΩ/dt = -3/2 * J2 * (R_E/p)^2 * n * cos(i) ≈ +0.9856°/day (Sun-synchronous)',
      gsd: 'GSD = (pixel_pitch * h) / f = (15 μm * 786 km) / 3.85 m = 10.0 m (Sub-satellite nadir)',
      swath: 'Swath = 2 * h * tan(FOV/2) = 2 * 786 * tan(10.3°) = 290 km',
      power: 'P_solar = S_0 * A * η * cos(θ) = 1361 * 7.1 m² * 0.30 * cos(22°) = 2,300 W',
    },
    designRationale: [
      {
        title: 'Why Sun-Synchronous at 10:30 AM (LTDN)?',
        reason: 'Crossing the equator at 10:30 AM Mean Local Solar Time guarantees identical sun illumination angles across seasons, minimizing convective cloud buildup typical of early afternoon.',
      },
      {
        title: 'Why Single-Wing Solar Array?',
        reason: 'Mounted exclusively on the cold anti-Sun side to prevent any thermal back-reflection or stray solar irradiance from entering the sensitive MSI telescope aperture.',
      },
      {
        title: 'Why Silicon Carbide (SiC) Optics?',
        reason: 'SiC maintains isotropic thermal expansion with zero outgassing, ensuring ultra-stable focal plane geometry through extreme -100°C to +80°C orbital transitions.',
      },
    ],
    subsystems: [
      {
        id: 's2-tma',
        name: 'Three-Mirror Anastigmat (TMA) Telescope',
        callout: 'Optics Barrel',
        category: 'Optics & Radar',
        massKg: 135,
        powerWatts: 45,
        tempRange: '+18°C to +22°C (Actively controlled)',
        desc: 'All-Silicon-Carbide (SiC) optical barrel with primary (M1), secondary (M2), and tertiary (M3) mirrors feeding VNIR and SWIR focal planes.',
        equation: 'NA = D / (2 * f) = 0.150 m / (2 * 3.85 m) = 0.0195 (f/25.6)',
        posOffset: [0, 0.28, 0.35],
      },
      {
        id: 's2-fpa',
        name: '13-Band Optical Focal Plane Array (FPA)',
        callout: 'Detectors',
        category: 'Optics & Radar',
        massKg: 42,
        powerWatts: 180,
        tempRange: '-30°C to -10°C (Thermoelectric cooled)',
        desc: '12 detector modules with stripe dielectric interference filters covering 443 nm to 2190 nm across 13 spectral channels.',
        equation: 'SNR = S_signal / sqrt(S_signal + N_dark + N_readout^2) > 175',
        posOffset: [0, -0.05, 0.42],
      },
      {
        id: 's2-solar',
        name: 'Single-Wing Deployable Solar Array',
        callout: 'Solar Wing',
        category: 'Power & Energy',
        massKg: 85,
        powerWatts: 2300,
        tempRange: '-85°C to +110°C',
        desc: '3 hinged panels with Gallium-Arsenide (GaAs) triple-junction cells and Solar Array Drive Mechanism (SADM).',
        equation: 'E_orbit = P_gen * t_sun = 2300 W * 65.4 min = 150 kJ/orbit',
        posOffset: [-0.95, 0, 0],
      },
      {
        id: 's2-xband',
        name: 'Dual X-Band Downlink Gimbal Dish',
        callout: 'Comms Dish',
        category: 'Communications',
        massKg: 28,
        powerWatts: 120,
        tempRange: '-40°C to +60°C',
        desc: 'Two redundant 280 Mbps steerable RF horns transmitting compressed imagery to Svalbard and Matera ground stations.',
        equation: 'DataRate = 2 * 280 Mbps = 560 Mbps (CCSDS Reed-Solomon)',
        posOffset: [0, 0.32, -0.25],
      },
      {
        id: 's2-rcs',
        name: 'Hydrazine Monopropellant RCS Thrusters',
        callout: 'Thruster Pods',
        category: 'Attitude & Propulsion',
        massKg: 145,
        powerWatts: 24,
        tempRange: '+15°C to +45°C (Catalytic bed preheated)',
        desc: '8x 1N hydrazine thrusters and titanium propellant tank for orbital drag makeup and end-of-life deorbit disposal.',
        equation: 'Δv = I_sp * g_0 * ln(m_0 / m_f) = 220 s * 9.81 * ln(1140 / 1017) = 246 m/s',
        posOffset: [0, -0.32, -0.28],
      },
      {
        id: 's2-star',
        name: 'Autonomous Dual Star Trackers',
        callout: 'Star Trackers',
        category: 'Avionics & Core',
        massKg: 7.2,
        powerWatts: 14,
        tempRange: '-20°C to +40°C',
        desc: 'Two optical camera heads matching celestial star constellations with onboard Hipparcos catalog to determine 3-axis attitude to < 2 arcseconds.',
        equation: 'Attitude Accuracy = σ_pitch_yaw < 1.5 arcsec, σ_roll < 3.0 arcsec',
        posOffset: [0.26, 0.22, 0.05],
      },
    ],
  },
  {
    id: 's1',
    name: 'Copernicus Sentinel-1A / 1B C-SAR',
    agency: 'ESA / Copernicus Programme',
    orbitType: 'Near-Polar Sun-synchronous Frozen Orbit',
    altitudeKm: 693,
    speedKmh: 27500,
    speedKms: 7.64,
    swathKm: 250,
    sensorType: 'C-Band Synthetic Aperture Radar (5.405 GHz)',
    inclinationDeg: 98.18,
    eccentricity: 0.0015,
    periodMin: 98.6,
    color: 0x38bdf8, // sky cyan
    radius: 2.18,
    speed: 0.0068,
    tilt: -0.32,
    dimensions: {
      bus: '4.4 m × 2.5 m × 2.3 m',
      wingspan: '12.0 m × 1.3 m (Deployable SAR Antenna)',
      mass: '2,300 kg (with radar payload)',
      power: '4,800 W (Peak SAR transmission)',
      gsd: '5 m × 20 m (Single Look Complex) / 10 m (GRD)',
    },
    equations: {
      velocity: 'v = sqrt(398600.44 / (6371 + 693)) = 7.64 km/s (27,500 km/h)',
      period: 'T = 2π * sqrt(7064^3 / 398600.44) = 5916 s = 98.6 min (14.6 orbits/day)',
      precession: 'Wavelength λ = c / f = 299792458 / 5.405 GHz = 5.54 cm (C-band microwave)',
      gsd: 'SAR Range Res: δr = c / (2 * B * sin(θ)) = 3e8 / (2 * 100MHz * sin(37°)) ≈ 5.0 m',
      swath: 'Interferometric Wide (IW) Swath = 250 km (Burst synchronization)',
      power: 'RF Peak Power = 560 T/R Modules * 8.5 W = 4,760 W RF Burst',
    },
    designRationale: [
      {
        title: 'Why C-Band (5.405 GHz, λ = 5.54 cm)?',
        reason: 'Microwave wavelength penetrates thick cloud cover, smoke, haze, and rainstorm cells, providing day-and-night active illumination independent of sunlight.',
      },
      {
        title: 'Why 12-Metre Planar Phased Array?',
        reason: '560 active Transmit/Receive (T/R) modules electronically steer the radar beam across 250 km swath without mechanical movement, enabling Interferometric Wide (IW) TOPSAR mode.',
      },
      {
        title: 'Why Frozen Repeat Orbit?',
        reason: 'Maintains exact 12-day orbital repeat ground tracks within a 50-metre orbital tube, enabling millimetric differential interferometry (DInSAR) for earthquake and subsidence tracking.',
      },
    ],
    subsystems: [
      {
        id: 's1-sar',
        name: '12-Metre Planar Active Phased Array Antenna',
        callout: 'C-SAR Boom',
        category: 'Optics & Radar',
        massKg: 880,
        powerWatts: 4800,
        tempRange: '-60°C to +75°C',
        desc: '5 deployable panels with 560 dual-polarization (H/V) slotted waveguide radiators generating 5.54 cm microwave radar pulses.',
        equation: 'Synthetic Aperture L_eff = v * T_dwell = 7640 m/s * 0.7 s = 5,348 m virtual aperture',
        posOffset: [0, -0.45, 0.15],
      },
      {
        id: 's1-solar',
        name: 'Dual Multi-Panel Solar Arrays',
        callout: 'Solar Array',
        category: 'Power & Energy',
        massKg: 195,
        powerWatts: 5900,
        tempRange: '-80°C to +100°C',
        desc: 'Twin solar wings extending 10 meters each to supply the severe pulse power demands of the C-SAR amplifier bank.',
        equation: 'Capacitor Bank Discharge = 450 J per radar pulse burst',
        posOffset: [0.85, 0, 0],
      },
      {
        id: 's1-ses',
        name: 'SAR Electronics Subsystem (SES)',
        callout: 'Radar Processor',
        category: 'Avionics & Core',
        massKg: 120,
        powerWatts: 420,
        tempRange: '-10°C to +50°C',
        desc: 'Generates linear frequency modulated (LFM) chirp pulses and applies onboard Flexible Dynamic Block Adaptive Quantization (FDBAQ).',
        equation: 'Chirp Bandwidth B = 100 MHz, Sampling Rate = 120 MS/s',
        posOffset: [0, 0.22, 0],
      },
      {
        id: 's1-prop',
        name: 'Hydrazine Orbital Maintenance System',
        callout: 'Hydrazine Bus',
        category: 'Attitude & Propulsion',
        massKg: 210,
        powerWatts: 30,
        tempRange: '+20°C to +40°C',
        desc: 'Maintains orbital tube consistency within ±50 m deadband to ensure interferometric phase coherence across repeat passes.',
        equation: 'Orbital Tube Radius r_tube = sqrt(Δx^2 + Δz^2) < 50 m',
        posOffset: [0, -0.25, -0.32],
      },
    ],
  },
  {
    id: 's3',
    name: 'Copernicus Sentinel-3A / 3B',
    agency: 'ESA / EUMETSAT',
    orbitType: 'High-Inclination Sun-Synchronous Frozen Orbit',
    altitudeKm: 814.5,
    speedKmh: 27150,
    speedKms: 7.54,
    swathKm: 1270,
    sensorType: 'OLCI (21 Bands) + SLSTR + SRAL Radar Altimeter',
    inclinationDeg: 98.65,
    eccentricity: 0.0011,
    periodMin: 100.99,
    color: 0x06b6d4, // cyan
    radius: 2.42,
    speed: 0.0052,
    tilt: 0.25,
    dimensions: {
      bus: '3.71 m × 2.2 m × 2.2 m',
      wingspan: '10.5 m (Single Deployable Wing)',
      mass: '1,150 kg',
      power: '2,070 W',
      gsd: '300 m (OLCI) / 500 m (SLSTR) / 3 cm (SRAL Altimeter)',
    },
    equations: {
      velocity: 'v = sqrt(398600.44 / (6371 + 814.5)) = 7.54 km/s',
      period: 'T = 100.99 min (14.26 orbits/day, 27-day exact repeat track)',
      precession: 'Sun-synchronous nodal drift: 0.9856°/day (10:00 AM crossing at equator)',
      gsd: 'SRAL Altimeter Range: R = c * Δt / 2 ≈ sub-centimeter sea surface topography',
      swath: 'OLCI Swath = 1,270 km (5 fan camera modules tilted 12.6° west)',
      power: 'GaAs Triple-Junction Solar Generation = 2,070 W EOL',
    },
    designRationale: [
      {
        title: 'Why 5-Camera OLCI Fan Array?',
        reason: '5 camera heads arranged in an arc provide a massive 1,270 km swath tilted 12.6° west to mitigate sun glint from ocean surfaces.',
      },
      {
        title: 'Why Dual-View SLSTR Radiometer?',
        reason: 'Observes the same ground point through two distinct atmospheric path lengths (nadir and 55° oblique view) to mathematically eliminate atmospheric moisture errors in sea surface temperatures.',
      },
      {
        title: 'Why Dual-Frequency SRAL Altimeter?',
        reason: 'Combines Ku-band (13.575 GHz) and C-band (5.41 GHz) radar echoes to measure ionospheric electron delay and ocean wave height.',
      },
    ],
    subsystems: [
      {
        id: 's3-olci',
        name: 'Ocean and Land Colour Instrument (OLCI)',
        callout: 'OLCI 5-Cam Fan',
        category: 'Optics & Radar',
        massKg: 153,
        powerWatts: 140,
        tempRange: '+15°C to +25°C',
        desc: '21 spectral bands from 400 nm to 1020 nm for ocean biological productivity, red-tide algal blooms, and terrestrial chlorophyll index.',
        equation: 'OLCI Terrestrial Chlorophyll Index: OTCI = (B5 - B4) / (B5 - B3) = (λ709 - λ681) / (λ709 - λ665)',
        posOffset: [0, 0.35, 0.32],
      },
      {
        id: 's3-slstr',
        name: 'Sea & Land Surface Temperature Radiometer (SLSTR)',
        callout: 'SLSTR Scanner',
        category: 'Optics & Radar',
        massKg: 160,
        powerWatts: 130,
        tempRange: '80 K (-193°C) Stirling cooled infrared channels',
        desc: 'Dual conical scanners measuring thermal infrared radiance to determine global ocean temperatures to < 0.2 K precision.',
        equation: 'Dual-View SST = a0 + a1 * T_nadir(11μm) + a2 * T_oblique(11μm) - a3 * T_nadir(12μm)',
        posOffset: [0, -0.32, 0.35],
      },
      {
        id: 's3-sral',
        name: 'SAR Radar Altimeter (SRAL)',
        callout: 'SRAL Altimeter',
        category: 'Optics & Radar',
        massKg: 60,
        powerWatts: 110,
        tempRange: '-20°C to +45°C',
        desc: 'Ku/C-band dual-frequency altimeter measuring sea surface height and ice shelf topography to 3 cm vertical accuracy.',
        equation: 'Sea Surface Height: SSH = Altitude - Range - ΔR_wet - ΔR_dry - ΔR_iono',
        posOffset: [0, 0, -0.38],
      },
      {
        id: 's3-solar',
        name: 'Single Deployable Solar Array Wing',
        callout: 'Solar Array',
        category: 'Power & Energy',
        massKg: 95,
        powerWatts: 2070,
        tempRange: '-80°C to +105°C',
        desc: 'Single articulated wing oriented toward the Sun while maintaining sensor thermal radiators toward deep space.',
        equation: 'Array Area = 10.5 m² (Efficiency 29.5%)',
        posOffset: [-0.95, 0, 0],
      },
    ],
  },
  {
    id: 'iss',
    name: 'ISS Earth Science Observation Platform',
    agency: 'NASA / ESA / JAXA / ISRO Joint',
    orbitType: 'Non-Sun-Synchronous Low Earth Orbit (LEO)',
    altitudeKm: 420,
    speedKmh: 27600,
    speedKms: 7.67,
    swathKm: 400,
    sensorType: 'ECOSTRESS (Thermal) + EMIT (Hyperspectral) + GEDI (LiDAR)',
    inclinationDeg: 51.64,
    eccentricity: 0.0004,
    periodMin: 92.9,
    color: 0xec4899, // pink/magenta
    radius: 1.95,
    speed: 0.0085,
    tilt: 0.12,
    dimensions: {
      bus: '108.5 m Truss × 72.8 m Pressurized Modules',
      wingspan: '73.0 m (8 Massive Photovoltaic Array Wings)',
      mass: '450,000 kg (Largest Artificial Earth Satellite)',
      power: '120,000 W (120 kW Microgrid)',
      gsd: '38 m (ECOSTRESS) / 60 m (EMIT) / 25 m footprint (GEDI LiDAR)',
    },
    equations: {
      velocity: 'v = sqrt(398600.44 / (6371 + 420)) = 7.67 km/s (27,600 km/h)',
      period: 'T = 2π * sqrt(6791^3 / 398600.44) = 5574 s = 92.9 min (15.5 orbits/day)',
      precession: 'Precession: Rapid orbital plane drift (enables diurnal day-to-night thermal sampling)',
      gsd: 'GEDI LiDAR: 3 lasers split into 8 ground tracks pulsing 242 times per second',
      swath: 'Multi-sensor Earth observation suite mounted on JEM-EF & Columbus-EPF',
      power: 'Generated Power: 120 kW from 8 dual-gimbaled photovoltaic wings',
    },
    designRationale: [
      {
        title: 'Why Non-Sun-Synchronous Orbit (51.6°)?',
        reason: 'Because the orbit precesses across different hours of the day, instruments like ECOSTRESS can measure evapotranspiration and thermal plant stress in early morning, noon, and late afternoon rather than fixed 10:30 AM.',
      },
      {
        title: 'Why Hyperspectral Mineral Dust (EMIT)?',
        reason: 'EMIT covers 381 to 2493 nm across 288 contiguous spectral bands, mapping mineral composition (iron oxides, clays) in arid dust source regions that impact global climate forcing.',
      },
      {
        title: 'Why Multi-Beam Spaceborne LiDAR (GEDI)?',
        reason: 'Fires 1064 nm Nd:YAG laser pulses down to Earth to measure the 3D vertical canopy height profile and above-ground carbon biomass with sub-meter vertical precision.',
      },
    ],
    subsystems: [
      {
        id: 'iss-emit',
        name: 'EMIT Imaging Spectrometer',
        callout: 'EMIT Hyperspectral',
        category: 'Optics & Radar',
        massKg: 250,
        powerWatts: 360,
        tempRange: '150 K (-123°C) Cryocooled Dyson Spectrometer',
        desc: '288 contiguous spectral channels across 381–2493 nm measuring surface mineralogy, agricultural crop traits, and methane super-emitters.',
        equation: 'Continuum-Removed Absorption Depth: D = 1 - R_band / R_continuum',
        posOffset: [0.15, -0.32, 0.42],
      },
      {
        id: 'iss-gedi',
        name: 'GEDI High-Resolution Canopy LiDAR',
        callout: 'GEDI Laser Lidar',
        category: 'Optics & Radar',
        massKg: 350,
        powerWatts: 620,
        tempRange: '+10°C to +30°C',
        desc: '3 Nd:YAG 1064 nm lasers producing 8 ground tracks measuring 3D forest canopy heights and vertical carbon biomass structure.',
        equation: 'Canopy Height: H_canopy = (t_ground - t_canopy_top) * c / 2',
        posOffset: [-0.15, -0.32, 0.42],
      },
      {
        id: 'iss-ecostress',
        name: 'ECOSTRESS Thermal Multispectral Radiometer',
        callout: 'ECOSTRESS Thermal',
        category: 'Optics & Radar',
        massKg: 130,
        powerWatts: 240,
        tempRange: '65 K (-208°C) Cryocooled Focal Plane',
        desc: '5 thermal infrared channels (8–12.5 μm) measuring plant water stress, evapotranspiration, and urban heat island microclimates.',
        equation: 'Evaporative Stress Index: ESI = 1 - (Actual_ET / Potential_ET)',
        posOffset: [0.28, -0.22, 0.3],
      },
      {
        id: 'iss-arrays',
        name: '8x Integrated Truss Photovoltaic Arrays',
        callout: '120kW Solar Truss',
        category: 'Power & Energy',
        massKg: 16000,
        powerWatts: 120000,
        tempRange: '-100°C to +110°C',
        desc: 'Eight 35-metre solar array wings mounted on the main truss with continuous alpha and beta joint Sun tracking.',
        equation: 'Array Power Output = 8 wings * 15 kW = 120 kW Peak',
        posOffset: [1.2, 0, 0],
      },
    ],
  },
  {
    id: 'landsat',
    name: 'USGS / NASA Landsat 9',
    agency: 'USGS / NASA',
    orbitType: 'Worldwide Reference System-2 (WRS-2) Sun-synchronous',
    altitudeKm: 705,
    speedKmh: 27450,
    speedKms: 7.62,
    swathKm: 185,
    sensorType: 'Operational Land Imager-2 (OLI-2) & TIRS-2',
    inclinationDeg: 98.2,
    eccentricity: 0.0012,
    periodMin: 99.0,
    color: 0x10b981, // emerald
    radius: 2.45,
    speed: 0.005,
    tilt: 0.15,
    dimensions: {
      bus: '3.1 m × 2.4 m × 2.4 m',
      wingspan: '9.8 m (Single Solar Wing)',
      mass: '2,713 kg',
      power: '1,550 W',
      gsd: '15 m (Pan) / 30 m (VNIR/SWIR) / 100 m resampled to 30 m (TIRS)',
    },
    equations: {
      velocity: 'v = sqrt(398600.44 / (6371 + 705)) = 7.62 km/s',
      period: 'T = 99.0 min (14.5 orbits/day, 16-day full Earth repeat)',
      precession: 'Nodal Precession: 0.9856°/day (10:00 AM crossing at equator)',
      gsd: 'Quantization: 14-bit radiometric resolution (16,384 dynamic gray levels)',
      swath: 'WRS-2 Swath = 185 km cross-track width',
      power: 'Generated Solar Power = 1,550 W baseline load',
    },
    designRationale: [
      {
        title: 'Why Dual Pushbroom (OLI-2 + TIRS-2)?',
        reason: 'Replaces mechanical scanning mirrors with over 7,000 detectors per band, boosting sensor dwell time and signal-to-noise ratio by a factor of 10 over early Landsat missions.',
      },
      {
        title: 'Why Cryocooled Thermal Infrared (TIRS-2)?',
        reason: 'Stirling cryocooler maintains QWIP thermal detectors at 43 Kelvin (-230°C) to measure subtle land surface temperatures and evapotranspiration without thermal detector noise.',
      },
      {
        title: 'Why WRS-2 Worldwide Reference System?',
        reason: 'Strict 16-day repeat coverage (8-day combined with Landsat 8) guarantees identical Path/Row framing going back 50+ years for historical decadal analysis.',
      },
    ],
    subsystems: [
      {
        id: 'l9-oli',
        name: 'Operational Land Imager-2 (OLI-2)',
        callout: 'OLI-2 Imager',
        category: 'Optics & Radar',
        massKg: 432,
        powerWatts: 172,
        tempRange: '+20°C (Athermal telescope assembly)',
        desc: 'Four-mirror anastigmat telescope with 14-bit radiometric depth across 9 VNIR and SWIR spectral bands.',
        equation: 'Focal Length f = 890 mm, Detector Pitch = 30 μm',
        posOffset: [0, 0.35, 0.28],
      },
      {
        id: 'l9-tirs',
        name: 'Thermal Infrared Sensor-2 (TIRS-2)',
        callout: 'Thermal Instrument',
        category: 'Optics & Radar',
        massKg: 236,
        powerWatts: 220,
        tempRange: '43 K (-230°C) at Focal Plane Array',
        desc: 'Two thermal infrared bands (10.8 μm and 12.0 μm) cooled by a two-stage pulse tube mechanical cryocooler.',
        equation: 'Planck Blackbody Radiance L(λ, T) = (2hc^2 / λ^5) / (exp(hc/λkT) - 1)',
        posOffset: [0, -0.32, 0.28],
      },
      {
        id: 'l9-solar',
        name: 'Single-Axis Articulated Solar Array',
        callout: 'Solar Array',
        category: 'Power & Energy',
        massKg: 110,
        powerWatts: 1550,
        tempRange: '-75°C to +90°C',
        desc: 'Single solar wing articulated with elevation and azimuth tracking to follow the Sun vector throughout the 705 km orbit.',
        equation: 'Array Area = 9.8 m², Efficiency η = 29.5%',
        posOffset: [-0.95, 0, 0],
      },
      {
        id: 'l9-mda',
        name: 'Mission Data Antenna (MDA)',
        callout: 'Downlink Gimbal',
        category: 'Communications',
        massKg: 35,
        powerWatts: 95,
        tempRange: '-30°C to +60°C',
        desc: 'Gimbaled high-gain X-band dish transmitting 3.14 Gbps data to USGS EROS International Cooperator ground stations.',
        equation: 'Data Throughput = 3.14 Gbps (QPSK Modulation)',
        posOffset: [0, 0.28, -0.28],
      },
    ],
  },
  {
    id: 'isro',
    name: 'ISRO Resourcesat-2 (LISS-IV & AWiFS)',
    agency: 'ISRO / NRSC',
    orbitType: 'Polar Sun-synchronous Indian Remote Sensing (IRS)',
    altitudeKm: 817,
    speedKmh: 27100,
    speedKms: 7.53,
    swathKm: 70,
    sensorType: 'LISS-IV (5.8m Multispectral) & AWiFS (56m Swath)',
    inclinationDeg: 98.69,
    eccentricity: 0.001,
    periodMin: 101.35,
    color: 0xfacc15, // gold
    radius: 2.55,
    speed: 0.0045,
    tilt: -0.18,
    dimensions: {
      bus: '2.8 m × 2.2 m × 2.0 m (IRS Bus)',
      wingspan: '6.4 m (Dual Solar Panels)',
      mass: '1,206 kg',
      power: '1,250 W',
      gsd: '5.8 m (LISS-IV) / 23.5 m (LISS-III) / 56 m (AWiFS)',
    },
    equations: {
      velocity: 'v = sqrt(398600.44 / (6371 + 817)) = 7.53 km/s',
      period: 'T = 101.35 min (14.2 orbits/day, 24-day ground repeat for LISS-IV)',
      precession: 'AWiFS Revisit: 5 days with 740 km wide swath coverage',
      gsd: 'LISS-IV Steerability: ±26° cross-track roll steering for 5-day emergency revisit',
      swath: 'AWiFS Swath = 740 km (Twin camera heads tilted ±11.9°)',
      power: 'ISRO Silicon/GaAs Solar Array = 1,250 W EOL',
    },
    designRationale: [
      {
        title: 'Why Simultaneous LISS-IV and AWiFS?',
        reason: 'Combines ultra-wide 740 km agricultural dynamics monitoring (AWiFS) with high-detail 5.8m cadastre and urban zoning inspection (LISS-IV) in a single orbital platform.',
      },
      {
        title: 'Why ±26° Off-Nadir Cross-Track Steering?',
        reason: 'Allows the spacecraft to roll cross-track, reducing revisit time over disaster zones (floods, cyclones) from 24 days to under 5 days.',
      },
      {
        title: 'Why Solid-State Mass Recorder (SSMR)?',
        reason: '200 GB high-speed memory buffers imagery over global territories, downlinking at 105 Mbps when passing NRSC Shadnagar ground station.',
      },
    ],
    subsystems: [
      {
        id: 'isro-liss',
        name: 'LISS-IV High-Resolution Camera',
        callout: 'LISS-IV Camera',
        category: 'Optics & Radar',
        massKg: 110,
        powerWatts: 85,
        tempRange: '+18°C to +24°C',
        desc: 'Three 12,000-pixel linear CCD arrays capturing B2 (Green), B3 (Red), and B4 (NIR) at 5.8m resolution with ±26° roll steering.',
        equation: 'Ground Pixel Footprint = 5.8 m nadir (12,000 pixels / line)',
        posOffset: [0, 0.32, 0.3],
      },
      {
        id: 'isro-awifs',
        name: 'AWiFS Wide-Field Sensor',
        callout: 'AWiFS Optics',
        category: 'Optics & Radar',
        massKg: 95,
        powerWatts: 65,
        tempRange: '+15°C to +25°C',
        desc: 'Twin optical camera assemblies tilted at ±11.9° delivering a massive 740 km swath for national agricultural forecasting.',
        equation: 'Combined Swath = 2 * (h * tan(11.9°) + nadir) = 740 km',
        posOffset: [0, -0.28, 0.3],
      },
      {
        id: 'isro-solar',
        name: 'Dual Symmetric Solar Wings',
        callout: 'Solar Array',
        category: 'Power & Energy',
        massKg: 80,
        powerWatts: 1250,
        tempRange: '-70°C to +80°C',
        desc: 'Two wings with 3 solar panels each providing 1.25 kW to power the high-throughput video digitizers.',
        equation: 'Solar Cell Efficiency = 28% Triple-Junction InGaP/InGaAs/Ge',
        posOffset: [0.75, 0, 0],
      },
      {
        id: 'isro-rcs',
        name: 'Hydrazine Monopropellant AOCS System',
        callout: 'AOCS Thrusters',
        category: 'Attitude & Propulsion',
        massKg: 130,
        powerWatts: 18,
        tempRange: '+20°C to +35°C',
        desc: 'Mono-propellant thrusters and reaction wheels providing 0.05° pointing accuracy for targeted disaster passes.',
        equation: 'Pointing Precision = 0.05° (3-axis stabilized via Star Trackers)',
        posOffset: [0, -0.35, -0.25],
      },
    ],
  },
  {
    id: 'nisar',
    name: 'NASA-ISRO SAR (NISAR)',
    agency: 'NASA / JPL & ISRO',
    orbitType: 'Sun-synchronous Dawn-Dusk Frozen Orbit',
    altitudeKm: 747,
    speedKmh: 27350,
    speedKms: 7.60,
    swathKm: 242,
    sensorType: 'Dual-Frequency L-Band & S-Band SweepSAR',
    inclinationDeg: 98.4,
    eccentricity: 0.001,
    periodMin: 100.0,
    color: 0xa855f7, // purple
    radius: 2.28,
    speed: 0.0058,
    tilt: 0.22,
    dimensions: {
      bus: '3.5 m × 2.0 m × 2.0 m (ISRO I-3K Bus)',
      wingspan: '12.0 m Deployable Wire Mesh Reflector',
      mass: '2,800 kg',
      power: '4,000 W (Peak SAR sweep)',
      gsd: '3 m to 10 m (Dual Frequency SweepSAR)',
    },
    equations: {
      velocity: 'v = sqrt(398600.44 / (6371 + 747)) = 7.60 km/s',
      period: 'T = 100.0 min (12-day exact repeat ground track)',
      precession: 'L-band λ = 24 cm (NASA JPL), S-band λ = 9.3 cm (ISRO SAC)',
      gsd: 'SweepSAR Technique: Transmits wide beam, receives narrow scan beam',
      swath: 'Continuous Swath = 242 km at 3–10 m spatial resolution',
      power: 'Peak Radar Transmission = 4.0 kW from 24 T/R modules',
    },
    designRationale: [
      {
        title: 'Why Dual L-Band (24cm) & S-Band (9.3cm)?',
        reason: 'L-band penetrates dense tropical forest canopies to measure woody biomass and ground deformation, while S-band is sensitive to light vegetation, soil moisture, and coastal sea ice.',
      },
      {
        title: 'Why 12-Metre Deployable Mesh Reflector?',
        reason: 'Large aperture reflector provides high antenna gain across a wide 242 km swath without suffering from classical SAR pulse repetition frequency (PRF) ambiguities.',
      },
      {
        title: 'Why SweepSAR Architecture?',
        reason: 'SweepSAR illuminates the entire swath with a broad transmit beam, then synthesizes a dynamically tracking narrow receive beam, achieving high resolution over large swaths.',
      },
    ],
    subsystems: [
      {
        id: 'nisar-dish',
        name: '12-Metre Deployable Wire Mesh Reflector Boom',
        callout: '12m Mesh Boom',
        category: 'Optics & Radar',
        massKg: 320,
        powerWatts: 4000,
        tempRange: '-100°C to +110°C',
        desc: 'AstroMesh deployable gold-plated molybdenum mesh reflector unfolded by a 9-metre carbon composite boom.',
        equation: 'Antenna Directivity D = 4π * A_eff / λ^2 ≈ 44 dBi (L-band)',
        posOffset: [0, 0.45, 0.35],
      },
      {
        id: 'nisar-feed',
        name: 'Dual-Band SweepSAR Feed Array',
        callout: 'Radar Feeds',
        category: 'Optics & Radar',
        massKg: 180,
        powerWatts: 500,
        tempRange: '-20°C to +60°C',
        desc: 'Separate linear arrays of L-band (JPL) and S-band (ISRO) patch feeds with digital beam-forming receivers.',
        equation: 'Sweep Receive Beam Tracking = 24 independent channels',
        posOffset: [0, 0.15, 0.15],
      },
      {
        id: 'nisar-solar',
        name: 'ISRO High-Power Solar Array',
        callout: 'Solar Array',
        category: 'Power & Energy',
        massKg: 140,
        powerWatts: 4000,
        tempRange: '-80°C to +90°C',
        desc: 'Multi-panel solar array generating 4 kW to recharge the 120 Ah lithium-ion battery during active radar sweeps.',
        equation: 'Battery Storage = 120 Ah @ 50 V = 6.0 kWh energy reserve',
        posOffset: [-0.85, 0, 0],
      },
      {
        id: 'nisar-comm',
        name: 'Ka-Band High-Rate Telemetry Downlink',
        callout: 'Ka-Band Dish',
        category: 'Communications',
        massKg: 45,
        powerWatts: 140,
        tempRange: '-35°C to +65°C',
        desc: 'Transmits 4 Gbps downlink to NASA Near Earth Network and ISRO Ground Station at Shadnagar.',
        equation: 'Daily Science Volume = 35 Terabytes / day (Downlinked at 4 Gbps)',
        posOffset: [0, -0.35, -0.3],
      },
    ],
  },
]

export default function Globe3D({ activeAoi, onSelectAoi }: Globe3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [selectedSat, setSelectedSat] = useState<SatellitePhysics>(DETAILED_SATELLITES[0])
  const [selectedSubsystem, setSelectedSubsystem] = useState<SubsystemDetail | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [showTrails, setShowTrails] = useState(true)
  const [viewMode, setViewMode] = useState<'orbit' | 'craft'>('orbit')
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(1)
  const [hudCollapsed, setHudCollapsed] = useState(false)
  
  // Interactive Dossier & Hotspot Inspection State
  const [dossierModalOpen, setDossierModalOpen] = useState(false)
  const [dossierSat, setDossierSat] = useState<SatellitePhysics>(DETAILED_SATELLITES[0])
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const selectedSubsystemRef = useRef<SubsystemDetail | null>(null)
  selectedSubsystemRef.current = selectedSubsystem
  
  // Interactive 3D Model Enhancements:
  const [explodedFactor, setExplodedFactor] = useState<number>(0)
  const [renderShader, setRenderShader] = useState<'realistic' | 'wireframe' | 'xray' | 'thermal'>('realistic')
  const [activeAnimations, setActiveAnimations] = useState(true)
  const [thrusterFiring, setThrusterFiring] = useState(false)
  const [simAltitude, setSimAltitude] = useState<number>(selectedSat.altitudeKm)
  const [simInclination, setSimInclination] = useState<number>(selectedSat.inclinationDeg)

  // Custom User-Uploaded GLTF/GLB Model State
  const [customModelGroup, setCustomModelGroup] = useState<THREE.Group | null>(null)
  const [customModelName, setCustomModelName] = useState<string | null>(null)
  const [customModelMetrics, setCustomModelMetrics] = useState<{ triangles: number; dimensions: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [liveCoords, setLiveCoords] = useState<{
    lat: string
    lon: string
    alt: number
    speed: number
    period: number
    gsd: number
  }>({
    lat: '48.21° N',
    lon: '16.37° E',
    alt: 786,
    speed: 7.45,
    period: 100.6,
    gsd: 10.0,
  })

  // Camera zoom ref
  const cameraZRef = useRef(4.6)

  // Update sim parameters when selected satellite changes
  useEffect(() => {
    setSimAltitude(selectedSat.altitudeKm)
    setSimInclination(selectedSat.inclinationDeg)
    setSelectedSubsystem(selectedSat.subsystems[0] || null)
  }, [selectedSat])

  // Fire Delta-V thruster burst with synthesized bandpass white noise
  const handleFireThrusters = () => {
    sfx.playThruster()
    setThrusterFiring(true)
    setTimeout(() => {
      setThrusterFiring(false)
    }, 2800)
  }

  // Handle custom GLTF/GLB file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    sfx.playDownlink()
    const reader = new FileReader()
    reader.onload = (event) => {
      const contents = event.target?.result
      if (!contents) return

      const loader = new GLTFLoader()
      loader.parse(
        contents,
        '',
        (gltf) => {
          const loadedGroup = gltf.scene

          // Compute bounding box and scale to ~2.5 units
          const box = new THREE.Box3().setFromObject(loadedGroup)
          const size = box.getSize(new THREE.Vector3())
          const center = box.getCenter(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z) || 1
          const scaleFactor = 2.4 / maxDim

          loadedGroup.scale.set(scaleFactor, scaleFactor, scaleFactor)
          loadedGroup.position.sub(center.multiplyScalar(scaleFactor))

          // Count triangles
          let triCount = 0
          loadedGroup.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              if (mesh.geometry) {
                triCount += (mesh.geometry.index ? mesh.geometry.index.count / 3 : mesh.geometry.attributes.position?.count / 3) || 0
              }
            }
          })

          setCustomModelGroup(loadedGroup)
          setCustomModelName(file.name)
          setCustomModelMetrics({
            triangles: Math.round(triCount),
            dimensions: `${size.x.toFixed(2)}m × ${size.y.toFixed(2)}m × ${size.z.toFixed(2)}m`,
          })
          setViewMode('craft')
          sfx.playConfirm()
        },
        (error) => {
          console.error('Error loading GLTF:', error)
        }
      )
    }
    reader.readAsArrayBuffer(file)
  }

  // Interactive Live Physics calculations based on user sliders
  const G = 6.6743e-11
  const M_E = 5.9722e24
  const R_E = 6371 // km
  const r_km = R_E + simAltitude
  const r_m = r_km * 1000
  const liveVelocityKms = Math.sqrt((G * M_E) / r_m) / 1000
  const liveVelocityKmh = liveVelocityKms * 3600
  const livePeriodSec = 2 * Math.PI * Math.sqrt(Math.pow(r_m, 3) / (G * M_E))
  const livePeriodMin = livePeriodSec / 60
  const liveDailyOrbits = (86400 / livePeriodSec).toFixed(1)
  const focalLengthM = selectedSat.dimensions.focalLength ? parseFloat(selectedSat.dimensions.focalLength) : 3.85
  const liveGSD = ((15e-6 * (simAltitude * 1000)) / focalLengthM).toFixed(1)
  const liveSwath = (2 * simAltitude * Math.tan((selectedSat.swathKm / (2 * selectedSat.altitudeKm)))).toFixed(0)

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 800
    const height = container.clientHeight || 560

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, cameraZRef.current)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0f172a, 3.2)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 4.2)
    sunLight.position.set(6, 4, 6)
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2)
    rimLight.position.set(-6, -3, -4)
    scene.add(rimLight)

    // Master Groups
    const orbitViewRoot = new THREE.Group()
    const craftViewRoot = new THREE.Group()
    scene.add(orbitViewRoot)
    scene.add(craftViewRoot)

    // -------------------------------------------------------------
    // 1. GLOBE & ORBIT SYSTEM
    // -------------------------------------------------------------
    const earthGroup = new THREE.Group()
    orbitViewRoot.add(earthGroup)

    const globeRadius = 1.5
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64)

    // Procedural Earth texture
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 1024)
      grad.addColorStop(0, '#030812')
      grad.addColorStop(0.5, '#07162c')
      grad.addColorStop(1, '#030812')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 2048, 1024)

      // Graticule grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)'
      ctx.lineWidth = 1.5
      for (let lat = 0; lat <= 1024; lat += 64) {
        ctx.beginPath()
        ctx.moveTo(0, lat)
        ctx.lineTo(2048, lat)
        ctx.stroke()
      }
      for (let lon = 0; lon <= 2048; lon += 128) {
        ctx.beginPath()
        ctx.moveTo(lon, 0)
        ctx.lineTo(lon, 1024)
        ctx.stroke()
      }

      // Continents
      ctx.fillStyle = '#102a45'
      const drawCont = (x: number, y: number, rx: number, ry: number) => {
        ctx.beginPath()
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      drawCont(1050, 400, 220, 120)
      drawCont(1060, 580, 120, 180)
      drawCont(520, 400, 140, 120)
      drawCont(640, 660, 100, 160)
      ctx.fillStyle = '#164e63'
      drawCont(1360, 500, 90, 80)
      drawCont(1560, 720, 100, 70)

      ctx.fillStyle = 'rgba(245, 158, 11, 0.6)'
      for (let i = 0; i < 60; i++) {
        const px = (i * 73) % 2048
        const py = (i * 47 + 80) % 1024
        ctx.fillRect(px, py, 3, 3)
      }
    }

    const globeTexture = new THREE.CanvasTexture(canvas)
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: globeTexture,
      shininess: 35,
      specular: new THREE.Color(0x2563eb),
    })
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial)
    earthGroup.add(globeMesh)

    // Atmospheric Glow Shell
    const atmosphereGeom = new THREE.SphereGeometry(globeRadius * 1.05, 48, 48)
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    })
    earthGroup.add(new THREE.Mesh(atmosphereGeom, atmosphereMat))

    const latLonToVector3 = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lon + 180) * (Math.PI / 180)
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      )
    }

    // AOI Markers on Globe
    const aoiMarkers: { id: string; ringMesh: THREE.Mesh }[] = []
    AOI_REGIONS.forEach((aoi) => {
      const pos = latLonToVector3(aoi.lat, aoi.lon, globeRadius * 1.02)
      const isSelected = aoi.id === activeAoi

      const pinGeom = new THREE.CylinderGeometry(0.015, 0.002, 0.15, 8)
      pinGeom.rotateX(Math.PI / 2)
      const pinMesh = new THREE.Mesh(
        pinGeom,
        new THREE.MeshBasicMaterial({ color: isSelected ? 0xf59e0b : 0x38bdf8 })
      )
      pinMesh.position.copy(pos)
      pinMesh.lookAt(0, 0, 0)

      const ringGeom = new THREE.RingGeometry(0.04, 0.065, 16)
      const ringMesh = new THREE.Mesh(
        ringGeom,
        new THREE.MeshBasicMaterial({
          color: isSelected ? 0xf59e0b : 0x06b6d4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        })
      )
      ringMesh.position.copy(pos.clone().multiplyScalar(1.02))
      ringMesh.lookAt(0, 0, 0)

      earthGroup.add(pinMesh)
      earthGroup.add(ringMesh)
      aoiMarkers.push({ id: aoi.id, ringMesh })
    })

    // -------------------------------------------------------------
    // 2. DYNAMIC MATERIAL FACTORY (Shader Modes)
    // -------------------------------------------------------------
    const getMaterial = (baseColor: number, metalness = 0.8, roughness = 0.2) => {
      if (renderShader === 'wireframe') {
        return new THREE.MeshBasicMaterial({
          color: baseColor === 0xd97706 ? 0xf59e0b : 0x38bdf8,
          wireframe: true,
        })
      }
      if (renderShader === 'xray') {
        return new THREE.MeshStandardMaterial({
          color: baseColor,
          transparent: true,
          opacity: 0.28,
          roughness: 0.1,
          metalness: 0.9,
          wireframe: false,
        })
      }
      if (renderShader === 'thermal') {
        const thermalColor = baseColor === 0x1d4ed8 ? 0xff3b30 : baseColor === 0xd97706 ? 0xff9500 : 0x007aff
        return new THREE.MeshStandardMaterial({
          color: thermalColor,
          roughness: 0.3,
          metalness: 0.6,
          emissive: thermalColor,
          emissiveIntensity: 0.2,
        })
      }
      return new THREE.MeshStandardMaterial({
        color: baseColor,
        metalness,
        roughness,
      })
    }

    // -------------------------------------------------------------
    // 3. ADVANCED DETAILED 3D SPACECRAFT BUILDER
    // -------------------------------------------------------------
    const animatedRadarRings: THREE.Mesh[] = []
    const thrusterParticles: THREE.Mesh[] = []
    const lidarBeamLines: THREE.Line[] = []
    let opticalBeamMesh: THREE.Mesh | null = null

    const createDetailedSatellite = (sat: SatellitePhysics, isSolo = false) => {
      const craft = new THREE.Group()

      const exp = isSolo ? explodedFactor : 0
      const expPayloadY = exp * 0.45
      const expSolarX = exp * 0.65
      const expAvionicsY = -exp * 0.35
      const expThrusterZ = -exp * 0.4

      // --- INTERNAL CORE (Visible in Exploded / X-Ray Mode) ---
      const coreGroup = new THREE.Group()
      coreGroup.position.set(0, 0, 0)
      craft.add(coreGroup)

      const tankGeom = new THREE.SphereGeometry(0.065, 16, 16)
      const tankMat = getMaterial(0x94a3b8, 0.95, 0.1)
      const tank1 = new THREE.Mesh(tankGeom, tankMat)
      tank1.position.set(0, 0.03, -0.02)
      const tank2 = new THREE.Mesh(tankGeom, tankMat)
      tank2.position.set(0, -0.05, -0.02)
      coreGroup.add(tank1)
      coreGroup.add(tank2)

      const wheelGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.015, 16)
      const wheelMat = getMaterial(0x38bdf8, 0.9, 0.2)
      const wheelX = new THREE.Mesh(wheelGeom, wheelMat)
      wheelX.rotation.z = Math.PI / 2
      wheelX.position.set(0.05, 0, 0.04)
      const wheelY = new THREE.Mesh(wheelGeom, wheelMat)
      wheelY.position.set(-0.05, 0.05, 0.04)
      const wheelZ = new THREE.Mesh(wheelGeom, wheelMat)
      wheelZ.rotation.x = Math.PI / 2
      wheelZ.position.set(-0.05, -0.05, 0.04)
      coreGroup.add(wheelX)
      coreGroup.add(wheelY)
      coreGroup.add(wheelZ)

      // --- EXTERNAL MAIN BUS CHASSIS ---
      const busGroup = new THREE.Group()
      busGroup.position.set(0, expAvionicsY, 0)
      craft.add(busGroup)

      // Gold MLI Kapton thermal blanket
      const bodyGeom = new THREE.BoxGeometry(0.24, 0.24, 0.32)
      const bodyMat = getMaterial(0xd97706, 0.92, 0.15)
      const body = new THREE.Mesh(bodyGeom, bodyMat)
      busGroup.add(body)

      const ribGeom = new THREE.BoxGeometry(0.25, 0.25, 0.02)
      const ribMat = getMaterial(0x1e293b, 0.8, 0.5)
      const ribFront = new THREE.Mesh(ribGeom, ribMat)
      ribFront.position.set(0, 0, 0.15)
      const ribBack = new THREE.Mesh(ribGeom, ribMat)
      ribBack.position.set(0, 0, -0.15)
      busGroup.add(ribFront)
      busGroup.add(ribBack)

      // --- PAYLOAD SPECIFIC ARCHITECTURES ---
      const payloadGroup = new THREE.Group()
      payloadGroup.position.set(0, expPayloadY, 0)
      craft.add(payloadGroup)

      if (sat.id === 's1') {
        // Copernicus Sentinel-1 C-SAR 12m Planar Phased Array Boom
        const sarGeom = new THREE.BoxGeometry(0.04, 0.42, 1.05)
        const sarMat = getMaterial(0x0284c7, 0.85, 0.2)
        const sar = new THREE.Mesh(sarGeom, sarMat)
        sar.position.set(0, -0.22, 0)
        payloadGroup.add(sar)

        // 5 Phased Array Joint Panels
        const sepGeom = new THREE.BoxGeometry(0.045, 0.43, 0.01)
        const sepMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        for (let p = -0.4; p <= 0.4; p += 0.2) {
          const m = new THREE.Mesh(sepGeom, sepMat)
          m.position.set(0, -0.22, p)
          payloadGroup.add(m)
        }

        if (isSolo && activeAnimations) {
          for (let r = 0; r < 4; r++) {
            const ringGeom = new THREE.TorusGeometry(0.2 + r * 0.15, 0.008, 8, 32)
            ringGeom.rotateX(Math.PI / 2)
            const ringMat = new THREE.MeshBasicMaterial({
              color: 0x38bdf8,
              transparent: true,
              opacity: 0.6 - r * 0.14,
            })
            const pulse = new THREE.Mesh(ringGeom, ringMat)
            pulse.position.set(0, -0.35 - r * 0.12, 0)
            payloadGroup.add(pulse)
            animatedRadarRings.push(pulse)
          }
        }
      } else if (sat.id === 's3') {
        // Sentinel-3 OLCI 5-Cam Fan Array + SLSTR Conical Scanner + SRAL Altimeter
        // OLCI 5-camera fan arc
        const fanGroup = new THREE.Group()
        fanGroup.position.set(0, 0.25, 0.25)
        for (let c = -2; c <= 2; c++) {
          const camGeom = new THREE.CylinderGeometry(0.02, 0.03, 0.08, 12)
          camGeom.rotateX(Math.PI / 2)
          const cam = new THREE.Mesh(camGeom, getMaterial(0x0f172a, 0.9, 0.1))
          cam.rotation.y = c * 0.18
          cam.position.set(c * 0.05, 0, 0)
          fanGroup.add(cam)
        }
        payloadGroup.add(fanGroup)

        // SLSTR Conical Scanner cylinder
        const slstrGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.12, 16)
        slstrGeom.rotateZ(Math.PI / 3)
        const slstr = new THREE.Mesh(slstrGeom, getMaterial(0x0284c7, 0.8, 0.2))
        slstr.position.set(0, -0.2, 0.22)
        payloadGroup.add(slstr)

        // SRAL Altimeter Dish pointing nadir
        const sralGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 24)
        sralGeom.rotateX(Math.PI / 2)
        const sral = new THREE.Mesh(sralGeom, getMaterial(0xf8fafc, 0.9, 0.1))
        sral.position.set(0, 0, -0.25)
        payloadGroup.add(sral)
      } else if (sat.id === 'iss') {
        // ISS 108m Integrated Truss Structure + Pressurized Modules + 8 Solar Wings
        const trussGeom = new THREE.BoxGeometry(1.6, 0.06, 0.06)
        const truss = new THREE.Mesh(trussGeom, getMaterial(0x94a3b8, 0.9, 0.2))
        payloadGroup.add(truss)

        // Central Pressurized Module stack (Destiny, Unity, Zvezda)
        const modGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.55, 16)
        modGeom.rotateX(Math.PI / 2)
        const modules = new THREE.Mesh(modGeom, getMaterial(0xf1f5f9, 0.85, 0.15))
        modules.position.set(0, -0.08, 0.05)
        payloadGroup.add(modules)

        // Cupola Nadir Observation Window
        const cupolaGeom = new THREE.SphereGeometry(0.04, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
        cupolaGeom.rotateX(-Math.PI / 2)
        const cupola = new THREE.Mesh(cupolaGeom, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 }))
        cupola.position.set(0, -0.18, 0.12)
        payloadGroup.add(cupola)

        // GEDI Green Pulsed LiDAR Laser Beams emitting to Earth
        if (isSolo && activeAnimations) {
          for (let l = -0.06; l <= 0.06; l += 0.06) {
            const lineGeom = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(l, -0.2, 0.1),
              new THREE.Vector3(l * 2.5, -0.2, 1.4),
            ])
            const lineMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.8 })
            const beam = new THREE.Line(lineGeom, lineMat)
            payloadGroup.add(beam)
            lidarBeamLines.push(beam)
          }
        }
      } else if (sat.id === 'nisar') {
        // NISAR 12m Deployable Wire Mesh Reflector
        const boomGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8)
        boomGeom.rotateZ(Math.PI / 4)
        const boom = new THREE.Mesh(boomGeom, getMaterial(0x475569, 0.9, 0.2))
        boom.position.set(0.18, 0.22, 0.1)
        payloadGroup.add(boom)

        const dishGeom = new THREE.SphereGeometry(0.35, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3)
        dishGeom.rotateX(-Math.PI / 2)
        const dishMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.95,
          roughness: 0.1,
          wireframe: true,
        })
        const dish = new THREE.Mesh(dishGeom, dishMat)
        dish.position.set(0.35, 0.38, 0.15)
        payloadGroup.add(dish)

        const feedGeom = new THREE.BoxGeometry(0.06, 0.06, 0.12)
        const feeds = new THREE.Mesh(feedGeom, getMaterial(0x94a3b8, 0.9, 0.2))
        feeds.position.set(0.12, 0.12, 0.15)
        payloadGroup.add(feeds)
      } else {
        // Optical Telescopes (Sentinel-2 TMA, Landsat-9 OLI, Resourcesat LISS-4)
        const lensGeom = new THREE.CylinderGeometry(0.075, 0.075, 0.24, 24)
        lensGeom.rotateX(Math.PI / 2)
        const lensMat = getMaterial(0x0f172a, 0.95, 0.05)
        const lens = new THREE.Mesh(lensGeom, lensMat)
        lens.position.set(0, 0.02, 0.26)
        payloadGroup.add(lens)

        const hoodGeom = new THREE.TorusGeometry(0.08, 0.01, 8, 24)
        const hood = new THREE.Mesh(hoodGeom, getMaterial(0xf59e0b, 0.9, 0.2))
        hood.position.set(0, 0.02, 0.38)
        payloadGroup.add(hood)

        const spiderGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.15)
        const spiderMat = new THREE.MeshBasicMaterial({ color: 0x475569 })
        const sp1 = new THREE.Mesh(spiderGeom, spiderMat)
        sp1.position.set(0, 0.02, 0.37)
        const sp2 = new THREE.Mesh(spiderGeom, spiderMat)
        sp2.rotation.z = Math.PI / 2
        sp2.position.set(0, 0.02, 0.37)
        payloadGroup.add(sp1)
        payloadGroup.add(sp2)

        if (isSolo && activeAnimations) {
          const coneGeom = new THREE.ConeGeometry(0.42, 1.2, 24, 1, true)
          coneGeom.rotateX(Math.PI / 2)
          const coneMat = new THREE.MeshBasicMaterial({
            color: sat.color,
            transparent: true,
            opacity: 0.14,
            wireframe: true,
          })
          opticalBeamMesh = new THREE.Mesh(coneGeom, coneMat)
          opticalBeamMesh.position.set(0, 0.02, 0.98)
          payloadGroup.add(opticalBeamMesh)
        }
      }

      // --- SOLAR ARRAY WINGS ---
      const solarGroup = new THREE.Group()
      craft.add(solarGroup)

      const panelSpan = sat.id === 's2' || sat.id === 's3' ? 0.95 : 0.75
      const panelGeom = new THREE.BoxGeometry(panelSpan, 0.02, 0.28)
      const panelMat = getMaterial(0x1d4ed8, 0.9, 0.1)

      if (sat.id === 'iss') {
        // 8 Massive Solar Array Wings on ISS Truss
        for (let side = -1; side <= 1; side += 2) {
          for (let w = 0; w < 4; w++) {
            const wingGeom = new THREE.BoxGeometry(0.18, 0.01, 0.42)
            const issWing = new THREE.Mesh(wingGeom, getMaterial(0x1d4ed8, 0.9, 0.1))
            issWing.position.set(side * (0.45 + w * 0.16 + expSolarX), 0, 0)
            solarGroup.add(issWing)
          }
        }
      } else if (sat.id === 's2' || sat.id === 's3' || sat.id === 'landsat') {
        // Single-Wing Array
        const leftWing = new THREE.Group()
        leftWing.position.set(-0.62 - expSolarX, 0, 0)
        leftWing.add(new THREE.Mesh(panelGeom, panelMat))
        solarGroup.add(leftWing)
      } else {
        // Dual Symmetric Wings
        const leftWing = new THREE.Group()
        leftWing.position.set(-0.55 - expSolarX, 0, 0)
        leftWing.add(new THREE.Mesh(panelGeom, panelMat))

        const rightWing = new THREE.Group()
        rightWing.position.set(0.55 + expSolarX, 0, 0)
        rightWing.add(new THREE.Mesh(panelGeom, panelMat))

        solarGroup.add(leftWing)
        solarGroup.add(rightWing)
      }

      // --- HYDRAZINE RCS THRUSTER PODS ---
      const thrusterGroup = new THREE.Group()
      thrusterGroup.position.set(0, 0, expThrusterZ)
      craft.add(thrusterGroup)

      const tGeom = new THREE.ConeGeometry(0.022, 0.045, 8)
      tGeom.rotateX(Math.PI)
      const tMat = getMaterial(0x334155, 0.95, 0.1)

      const tPositions: [number, number, number][] = [
        [-0.09, -0.09, -0.18],
        [0.09, -0.09, -0.18],
        [-0.09, 0.09, -0.18],
        [0.09, 0.09, -0.18],
      ]

      tPositions.forEach((pos) => {
        const noz = new THREE.Mesh(tGeom, tMat)
        noz.position.set(...pos)
        thrusterGroup.add(noz)

        if (isSolo) {
          const plumeGeom = new THREE.ConeGeometry(0.02, 0.12, 8)
          plumeGeom.rotateX(Math.PI)
          const plumeMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: thrusterFiring ? 0.85 : 0.0,
          })
          const plume = new THREE.Mesh(plumeGeom, plumeMat)
          plume.position.set(pos[0], pos[1], pos[2] - 0.08)
          thrusterGroup.add(plume)
          thrusterParticles.push(plume)
        }
      })

      return craft
    }

    // Populate Satellites in Orbit View
    const satObjects: {
      info: SatellitePhysics
      craft: THREE.Group
      orbitGroup: THREE.Group
      angle: number
      orbitLine: THREE.Line
    }[] = []

    DETAILED_SATELLITES.forEach((sat, idx) => {
      const orbitGroup = new THREE.Group()
      orbitGroup.rotation.z = sat.tilt
      orbitGroup.rotation.y = (idx * Math.PI) / 3
      orbitViewRoot.add(orbitGroup)

      const curve = new THREE.EllipseCurve(0, 0, sat.radius, sat.radius, 0, 2 * Math.PI, false, 0)
      const points = curve.getPoints(80)
      const lineGeom = new THREE.BufferGeometry().setFromPoints(
        points.map((p) => new THREE.Vector3(p.x, 0, p.y))
      )
      const lineMat = new THREE.LineBasicMaterial({
        color: sat.color,
        transparent: true,
        opacity: 0.4,
      })
      const orbitLine = new THREE.Line(lineGeom, lineMat)
      orbitGroup.add(orbitLine)

      const craft = createDetailedSatellite(sat, false)
      craft.userData = { type: 'satellite', sat }
      craft.traverse((child) => {
        child.userData = { type: 'satellite', sat }
      })

      // Sensitive click hit volume
      const hitSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      )
      hitSphere.userData = { type: 'satellite', sat }
      craft.add(hitSphere)

      const initialAngle = (idx * Math.PI) / 3
      craft.position.set(
        Math.cos(initialAngle) * sat.radius,
        0,
        Math.sin(initialAngle) * sat.radius
      )
      orbitGroup.add(craft)

      satObjects.push({
        info: sat,
        craft,
        orbitGroup,
        angle: initialAngle,
        orbitLine,
      })
    })

    // Solo Craft Explorer Model (for the 3D Spacecraft Mode)
    const soloCraftGroup = new THREE.Group()
    craftViewRoot.add(soloCraftGroup)
    soloCraftGroup.scale.set(3.2, 3.2, 3.2)

    if (customModelGroup) {
      soloCraftGroup.add(customModelGroup)
    } else {
      const soloCraft = createDetailedSatellite(selectedSat, true)
      soloCraftGroup.add(soloCraft)
    }

    // 3D Interactive Hotspot Beacons & Reticle Calipers
    const hotspotBeacons: {
      sub: SubsystemDetail
      beaconMesh: THREE.Group
      ringMesh: THREE.Mesh
    }[] = []

    if (!customModelGroup) {
      selectedSat.subsystems.forEach((sub) => {
        const beaconGroup = new THREE.Group()
        beaconGroup.position.set(...sub.posOffset)
        beaconGroup.userData = { type: 'subsystem', subsystem: sub }

        const sphereColor =
          sub.category === 'Optics & Radar'
            ? 0x38bdf8
            : sub.category === 'Power & Energy'
            ? 0xf59e0b
            : sub.category === 'Attitude & Propulsion'
            ? 0xf97316
            : 0x10b981

        const sphereGeom = new THREE.SphereGeometry(0.026, 16, 16)
        const sphereMat = new THREE.MeshBasicMaterial({ color: sphereColor })
        const sphere = new THREE.Mesh(sphereGeom, sphereMat)
        sphere.userData = { type: 'subsystem', subsystem: sub }
        beaconGroup.add(sphere)

        const ringGeom = new THREE.RingGeometry(0.038, 0.052, 24)
        const ringMat = new THREE.MeshBasicMaterial({
          color: sphereColor,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        })
        const ring = new THREE.Mesh(ringGeom, ringMat)
        ring.userData = { type: 'subsystem', subsystem: sub }
        beaconGroup.add(ring)

        const stalkGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.08, 0),
        ])
        const stalk = new THREE.Line(
          stalkGeom,
          new THREE.LineBasicMaterial({ color: sphereColor, transparent: true, opacity: 0.6 })
        )
        beaconGroup.add(stalk)

        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 64
        const bctx = canvas.getContext('2d')
        if (bctx) {
          bctx.fillStyle = 'rgba(8, 12, 18, 0.92)'
          bctx.strokeStyle =
            sub.category === 'Optics & Radar'
              ? '#38bdf8'
              : sub.category === 'Power & Energy'
              ? '#f59e0b'
              : '#10b981'
          bctx.lineWidth = 3
          bctx.beginPath()
          bctx.roundRect(4, 4, 248, 56, 10)
          bctx.fill()
          bctx.stroke()

          bctx.fillStyle = '#ffffff'
          bctx.font = 'bold 22px monospace'
          bctx.textAlign = 'center'
          bctx.textBaseline = 'middle'
          bctx.fillText(sub.callout.toUpperCase(), 128, 32)
        }
        const texture = new THREE.CanvasTexture(canvas)
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true })
        const sprite = new THREE.Sprite(spriteMat)
        sprite.position.set(0, 0.12, 0)
        sprite.scale.set(0.24, 0.06, 1)
        sprite.userData = { type: 'subsystem', subsystem: sub }
        beaconGroup.add(sprite)

        soloCraftGroup.add(beaconGroup)
        hotspotBeacons.push({ sub, beaconMesh: beaconGroup, ringMesh: ring })
      })
    }

    // 3D Animated Reticle Calipers
    const reticleGroup = new THREE.Group()
    soloCraftGroup.add(reticleGroup)
    const boxGeom = new THREE.BoxGeometry(0.18, 0.18, 0.18)
    const edges = new THREE.EdgesGeometry(boxGeom)
    const reticleLine = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 })
    )
    reticleGroup.add(reticleLine)

    // Raycaster for Hover & Click Events
    const raycaster = new THREE.Raycaster()
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0
    let startX = 0
    let startY = 0

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
      startX = e.clientX
      startY = e.clientY
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX
        const deltaY = e.clientY - prevMouseY

        if (viewMode === 'orbit') {
          earthGroup.rotation.y += deltaX * 0.007
          earthGroup.rotation.x += deltaY * 0.007
        } else {
          soloCraftGroup.rotation.y += deltaX * 0.01
          soloCraftGroup.rotation.x += deltaY * 0.01
        }
        prevMouseX = e.clientX
        prevMouseY = e.clientY
      } else {
        // Hover Raycast Detection
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        )
        raycaster.setFromCamera(mouse, camera)

        let hitFound = false
        if (viewMode === 'orbit') {
          const intersects = raycaster.intersectObjects(orbitViewRoot.children, true)
          for (const hit of intersects) {
            let curr: THREE.Object3D | null = hit.object
            while (curr && !curr.userData?.sat) {
              curr = curr.parent
            }
            if (curr?.userData?.sat) {
              const sat = curr.userData.sat as SatellitePhysics
              container.style.cursor = 'pointer'
              setHoveredLabel(sat.name)
              setHoveredCategory(sat.agency)
              setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
              hitFound = true
              break
            }
          }
        } else {
          const intersects = raycaster.intersectObjects(soloCraftGroup.children, true)
          for (const hit of intersects) {
            let curr: THREE.Object3D | null = hit.object
            while (curr && !curr.userData?.subsystem) {
              curr = curr.parent
            }
            if (curr?.userData?.subsystem) {
              const sub = curr.userData.subsystem as SubsystemDetail
              container.style.cursor = 'pointer'
              setHoveredLabel(`${sub.callout}: ${sub.name}`)
              setHoveredCategory(sub.category)
              setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
              hitFound = true
              break
            }
          }
        }

        if (!hitFound) {
          container.style.cursor = 'grab'
          setHoveredLabel(null)
          setHoveredCategory(null)
          setCursorPos(null)
        }
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      isDragging = false
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY)
      if (dist < 6) {
        // High-precision Click detection
        const rect = container.getBoundingClientRect()
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        )
        raycaster.setFromCamera(mouse, camera)

        if (viewMode === 'orbit') {
          const intersects = raycaster.intersectObjects(orbitViewRoot.children, true)
          for (const hit of intersects) {
            let curr: THREE.Object3D | null = hit.object
            while (curr && !curr.userData?.sat) {
              curr = curr.parent
            }
            if (curr?.userData?.sat) {
              const sat = curr.userData.sat as SatellitePhysics
              setSelectedSat(sat)
              setDossierSat(sat)
              setDossierModalOpen(true)
              sfx.playDownlink()
              break
            }
          }
        } else {
          const intersects = raycaster.intersectObjects(soloCraftGroup.children, true)
          for (const hit of intersects) {
            let curr: THREE.Object3D | null = hit.object
            while (curr && !curr.userData?.subsystem) {
              curr = curr.parent
            }
            if (curr?.userData?.subsystem) {
              const sub = curr.userData.subsystem as SubsystemDetail
              setSelectedSubsystem(sub)
              if (sub.category === 'Optics & Radar') sfx.playRadarPing()
              else if (sub.category === 'Attitude & Propulsion') sfx.playThruster()
              else sfx.playConfirm()
              break
            }
          }
        }
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cameraZRef.current = Math.max(2.2, Math.min(8.5, cameraZRef.current + e.deltaY * 0.003))
      camera.position.z = cameraZRef.current
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true
        prevMouseX = e.touches[0].clientX
        prevMouseY = e.touches[0].clientY
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return
      const deltaX = e.touches[0].clientX - prevMouseX
      const deltaY = e.touches[0].clientY - prevMouseY
      if (viewMode === 'orbit') {
        earthGroup.rotation.y += deltaX * 0.009
        earthGroup.rotation.x += deltaY * 0.009
      } else {
        soloCraftGroup.rotation.y += deltaX * 0.012
        soloCraftGroup.rotation.x += deltaY * 0.012
      }
      prevMouseX = e.touches[0].clientX
      prevMouseY = e.touches[0].clientY
    }

    const onTouchEnd = (e: TouchEvent) => {
      isDragging = false
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0]
        const dist = Math.hypot(touch.clientX - startX, touch.clientY - startY)
        if (dist < 8) {
          const rect = container.getBoundingClientRect()
          const mouse = new THREE.Vector2(
            ((touch.clientX - rect.left) / rect.width) * 2 - 1,
            -((touch.clientY - rect.top) / rect.height) * 2 + 1
          )
          raycaster.setFromCamera(mouse, camera)

          if (viewMode === 'orbit') {
            const intersects = raycaster.intersectObjects(orbitViewRoot.children, true)
            for (const hit of intersects) {
              let curr: THREE.Object3D | null = hit.object
              while (curr && !curr.userData?.sat) {
                curr = curr.parent
              }
              if (curr?.userData?.sat) {
                const sat = curr.userData.sat as SatellitePhysics
                setSelectedSat(sat)
                setDossierSat(sat)
                setDossierModalOpen(true)
                sfx.playDownlink()
                break
              }
            }
          } else {
            const intersects = raycaster.intersectObjects(soloCraftGroup.children, true)
            for (const hit of intersects) {
              let curr: THREE.Object3D | null = hit.object
              while (curr && !curr.userData?.subsystem) {
                curr = curr.parent
              }
              if (curr?.userData?.subsystem) {
                const sub = curr.userData.subsystem as SubsystemDetail
                setSelectedSubsystem(sub)
                if (sub.category === 'Optics & Radar') sfx.playRadarPing()
                else if (sub.category === 'Attitude & Propulsion') sfx.playThruster()
                else sfx.playConfirm()
                break
              }
            }
          }
        }
      }
    }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel, { passive: false })
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    // Animation Loop
    let animId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      orbitViewRoot.visible = viewMode === 'orbit'
      craftViewRoot.visible = viewMode === 'craft'

      if (viewMode === 'orbit') {
        if (autoRotate && !isDragging) {
          earthGroup.rotation.y += 0.002 * simSpeed
        }

        aoiMarkers.forEach(({ ringMesh }) => {
          const s = 1 + Math.sin(elapsedTime * 3) * 0.2
          ringMesh.scale.set(s, s, s)
        })

        satObjects.forEach((sat) => {
          sat.angle += sat.info.speed * simSpeed
          sat.craft.position.x = Math.cos(sat.angle) * sat.info.radius
          sat.craft.position.z = Math.sin(sat.angle) * sat.info.radius
          sat.craft.lookAt(0, 0, 0)
          sat.orbitLine.visible = showTrails

          if (sat.info.id === selectedSat.id) {
            const rad = sat.angle % (2 * Math.PI)
            const incRad = (simInclination * Math.PI) / 180
            const currentLat = Math.asin(Math.sin(incRad) * Math.sin(rad)) * (180 / Math.PI)
            const currentLon =
              ((Math.atan2(Math.cos(incRad) * Math.sin(rad), Math.cos(rad)) * 180) / Math.PI +
                elapsedTime * 2) %
              360
            const lonFormatted = currentLon > 180 ? currentLon - 360 : currentLon

            setLiveCoords({
              lat: `${Math.abs(currentLat).toFixed(2)}° ${currentLat >= 0 ? 'N' : 'S'}`,
              lon: `${Math.abs(lonFormatted).toFixed(2)}° ${lonFormatted >= 0 ? 'E' : 'W'}`,
              alt: simAltitude,
              speed: liveVelocityKms,
              period: livePeriodMin,
              gsd: parseFloat(liveGSD),
            })
          }
        })
      } else {
        if (autoRotate && !isDragging) {
          soloCraftGroup.rotation.y += 0.004 * simSpeed
        }

        // Animate radar microwave pulsing rings
        if (animatedRadarRings.length > 0) {
          animatedRadarRings.forEach((ring, idx) => {
            const phase = (elapsedTime * 2 + idx * 0.5) % 2
            ring.scale.set(1 + phase * 0.8, 1 + phase * 0.8, 1)
            ;(ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - phase * 0.4)
          })
        }

        // Animate LiDAR beams flicker
        if (lidarBeamLines.length > 0) {
          lidarBeamLines.forEach((b) => {
            ;(b.material as THREE.LineBasicMaterial).opacity = 0.5 + Math.sin(elapsedTime * 10) * 0.4
          })
        }

        // Animate optical scancone sweep
        if (opticalBeamMesh) {
          opticalBeamMesh.rotation.z = Math.sin(elapsedTime * 2) * 0.08
        }

        // Animate thruster burst plume flicker
        if (thrusterParticles.length > 0) {
          thrusterParticles.forEach((plume) => {
            if (thrusterFiring) {
              const flicker = 0.6 + Math.random() * 0.4
              plume.scale.set(1 + Math.random() * 0.3, 1 + Math.random() * 0.5, 1)
              ;(plume.material as THREE.MeshBasicMaterial).opacity = flicker
            } else {
              ;(plume.material as THREE.MeshBasicMaterial).opacity = 0
            }
          })
          if (thrusterFiring) {
            soloCraftGroup.rotation.z = Math.sin(elapsedTime * 15) * 0.02
          }
        }

        // Animate 3D Hotspot Beacons radiating rings
        hotspotBeacons.forEach(({ ringMesh }, idx) => {
          const phase = (elapsedTime * 2.5 + idx * 0.4) % 1
          ringMesh.scale.set(1 + phase * 1.6, 1 + phase * 1.6, 1)
          ;(ringMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - phase * 0.8)
        })

        // Animate 3D Target Reticle Calipers around active subsystem
        const activeSub = selectedSubsystemRef.current
        if (activeSub && viewMode === 'craft') {
          reticleGroup.visible = true
          reticleGroup.position.set(...activeSub.posOffset)
          reticleGroup.rotation.y += 0.02
          reticleGroup.rotation.x += 0.015
          const s = 1 + Math.sin(elapsedTime * 4) * 0.12
          reticleGroup.scale.set(s, s, s)
        } else {
          reticleGroup.visible = false
        }
      }

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [
    activeAoi,
    autoRotate,
    showTrails,
    simSpeed,
    viewMode,
    selectedSat,
    explodedFactor,
    renderShader,
    activeAnimations,
    thrusterFiring,
    simAltitude,
    simInclination,
    customModelGroup,
  ])

  return (
    <div className="relative w-full h-[580px] sm:h-[680px] lg:h-[740px] rounded-xl overflow-hidden border border-[#252d38] bg-[#03060a] shadow-2xl flex flex-col justify-between">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hover Floating HUD Badge */}
      {cursorPos && hoveredLabel && (
        <div
          className="pointer-events-none absolute z-30 px-3 py-1.5 bg-[#080d14]/95 border border-cyan-500/80 text-white rounded-lg shadow-2xl font-mono text-xs flex items-center gap-2 transform -translate-x-1/2 -translate-y-12 backdrop-blur-md animate-fadeIn"
          style={{ left: cursorPos.x, top: cursorPos.y }}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-cyan-200">{hoveredLabel}</span>
          {hoveredCategory && (
            <span className="text-[9px] px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
              {hoveredCategory}
            </span>
          )}
        </div>
      )}

      {/* Hidden file input for custom GLTF/GLB models */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".glb,.gltf"
        className="hidden"
      />

      {/* Top Bar: View Mode Switcher, Shaders & Controls */}
      <div className="relative z-10 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: View Mode Toggle */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#0b0e13]/90 backdrop-blur border border-[#252d38] rounded-lg p-1 shadow-xl">
          <button
            onClick={() => {
              sfx.playClick()
              setViewMode('orbit')
            }}
            className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition-colors ${
              viewMode === 'orbit'
                ? 'bg-amber-600 text-black shadow-md'
                : 'text-[#8b96a3] hover:text-white'
            }`}
          >
            🌍 GLOBAL ORBITS
          </button>
          <button
            onClick={() => {
              sfx.playClick()
              setViewMode('craft')
            }}
            className={`px-3 py-1.5 text-xs font-mono rounded font-semibold transition-colors ${
              viewMode === 'craft'
                ? 'bg-amber-600 text-black shadow-md'
                : 'text-[#8b96a3] hover:text-white'
            }`}
          >
            🛰 3D SPACECRAFT MODEL
          </button>
        </div>

        {/* Live Sub-Satellite Nadir Coordinates HUD */}
        {viewMode === 'orbit' ? (
          <div className="pointer-events-auto bg-[#0b0e13]/90 backdrop-blur border border-[#252d38] rounded-lg px-3 py-1 text-[10px] font-mono text-cyan-300 shadow-xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Nadir Point: <strong>{liveCoords.lat}, {liveCoords.lon}</strong></span>
            <span className="text-[#8b96a3]">· Alt: {liveCoords.alt} km · Vel: {liveCoords.speed.toFixed(2)} km/s</span>
          </div>
        ) : (
          /* Spacecraft Mode Shader Styles Switcher */
          <div className="pointer-events-auto flex items-center gap-1 bg-[#0b0e13]/90 backdrop-blur border border-[#252d38] rounded-lg p-1 text-[10px] font-mono">
            <span className="text-[#4a5568] px-1.5">SHADER:</span>
            {(['realistic', 'wireframe', 'xray', 'thermal'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  sfx.playClick()
                  setRenderShader(mode)
                }}
                className={`px-2 py-0.5 rounded capitalize transition-colors ${
                  renderShader === mode
                    ? 'bg-amber-600 text-black font-bold'
                    : 'text-[#8b96a3] hover:text-white'
                }`}
              >
                {mode === 'realistic' ? 'Gold MLI' : mode === 'wireframe' ? 'CAD Wire' : mode === 'xray' ? 'X-Ray' : 'FLIR IR'}
              </button>
            ))}
          </div>
        )}

        {/* Right: Camera, Sim Speed & Custom GLB Upload */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#0b0e13]/90 backdrop-blur border border-[#252d38] rounded-lg p-1 shadow-xl">
          {viewMode === 'craft' && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs font-mono rounded border border-cyan-800 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors flex items-center gap-1"
              title="Upload your own .GLB or .GLTF 3D spacecraft model"
            >
              📁 <span>{customModelName ? 'CUSTOM GLB LOADED' : 'LOAD GLB'}</span>
            </button>
          )}

          {customModelGroup && (
            <button
              onClick={() => {
                setCustomModelGroup(null)
                setCustomModelName(null)
                setCustomModelMetrics(null)
                sfx.playClick()
              }}
              className="px-2 py-1 text-xs font-mono rounded bg-red-950/40 border border-red-800 text-red-300"
              title="Reset to fleet procedural model"
            >
              ✕ RESET
            </button>
          )}

          <button
            onClick={() => {
              sfx.playClick()
              setAutoRotate(!autoRotate)
            }}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              autoRotate
                ? 'bg-amber-600/30 text-amber-300 border-amber-600/50'
                : 'bg-[#161b22] text-[#8b96a3] border-[#252d38]'
            }`}
          >
            {autoRotate ? '⟳ ROTATING' : '⏸ PAUSED'}
          </button>

          {viewMode === 'craft' && (
            <button
              onClick={handleFireThrusters}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-all ${
                thrusterFiring
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-[#161b22] text-amber-400 border-amber-600/40 hover:bg-amber-950/40'
              }`}
            >
              {thrusterFiring ? '🔥 BURNING RCS' : '🔥 TEST RCS'}
            </button>
          )}

          {viewMode === 'orbit' && (
            <button
              onClick={() => {
                sfx.playClick()
                setShowTrails(!showTrails)
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                showTrails
                  ? 'bg-cyan-600/30 text-cyan-300 border-cyan-600/50'
                  : 'bg-[#161b22] text-[#8b96a3] border-[#252d38]'
              }`}
            >
              TRAILS
            </button>
          )}

          <button
            onClick={() => {
              sfx.playClick()
              setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 4 : 1)
            }}
            className="px-2.5 py-1 text-xs font-mono rounded border border-[#252d38] bg-[#161b22] text-[#8b96a3] hover:text-white"
          >
            {simSpeed}x
          </button>

          <button
            onClick={() => {
              sfx.playClick()
              setHudCollapsed(!hudCollapsed)
            }}
            className="px-2 py-1 text-xs font-mono rounded border border-[#252d38] bg-[#161b22] text-[#8b96a3] hover:text-white"
            title="Toggle Telemetry HUD"
          >
            {hudCollapsed ? '👁 SHOW HUD' : '✕ HIDE HUD'}
          </button>
        </div>
      </div>

      {/* Satellite Switcher Horizontal Ribbon */}
      <div className="relative z-10 px-4 pointer-events-auto flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono text-[#8b96a3] uppercase font-bold mr-1 hidden sm:inline-block">
          CONSTELLATION FLEET:
        </span>
        {DETAILED_SATELLITES.map((sat) => {
          const isSelected = selectedSat.id === sat.id && !customModelGroup
          return (
            <div key={sat.id} className="flex items-center">
              <button
                onClick={() => {
                  sfx.playDownlink()
                  setCustomModelGroup(null)
                  setSelectedSat(sat)
                  setDossierSat(sat)
                }}
                className={`px-3 py-1.5 text-xs font-mono rounded-l-lg border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-600 text-black font-bold border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-[#0f1216]/90 backdrop-blur text-[#8b96a3] border-[#252d38] hover:text-white'
                }`}
                title={`Target 3D model for ${sat.name}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{sat.name}</span>
              </button>
              <button
                onClick={() => {
                  sfx.playClick()
                  setSelectedSat(sat)
                  setDossierSat(sat)
                  setDossierModalOpen(true)
                }}
                className={`px-2 py-1.5 text-xs font-mono rounded-r-lg border-y border-r transition-all ${
                  isSelected
                    ? 'bg-amber-700 text-black font-bold border-amber-400 hover:bg-amber-500'
                    : 'bg-[#161b22] text-[#8b96a3] border-[#252d38] hover:text-white hover:border-amber-600'
                }`}
                title={`Open Intelligence Dossier & Subsystem Specs for ${sat.name}`}
              >
                📋
              </button>
            </div>
          )
        })}
      </div>

      {/* Interactive Exploded View & Subsystem Pinpointing Bar (Only in 3D Spacecraft Mode) */}
      {viewMode === 'craft' && (
        <div className="relative z-10 px-4 mt-2 pointer-events-auto flex flex-col gap-2 bg-[#0b0e13]/90 backdrop-blur border border-[#1e252f] rounded-lg p-3 mx-4 text-xs font-mono shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold uppercase text-[10px]">
                💥 Exploded Subsystem View:
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explodedFactor}
                onChange={(e) => {
                  sfx.playClick()
                  setExplodedFactor(parseFloat(e.target.value))
                }}
                className="accent-amber-500 cursor-pointer w-28 sm:w-36"
              />
              <span className="text-white font-mono text-[11px] w-10">
                {Math.round(explodedFactor * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                INSPECT HOTSPOT:
              </span>
              {selectedSat.subsystems.map((sub) => {
                const isSubSelected = selectedSubsystem?.id === sub.id
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubsystem(sub)
                      if (sub.category === 'Optics & Radar') {
                        sfx.playRadarPing()
                      } else if (sub.category === 'Attitude & Propulsion') {
                        sfx.playThruster()
                      } else {
                        sfx.playConfirm()
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isSubSelected
                        ? 'bg-cyan-600 text-black font-bold border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-[#161b22] text-[#8b96a3] border-[#252d38] hover:text-white hover:border-cyan-600'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSubSelected ? 'bg-black animate-ping' : 'bg-cyan-400'
                      }`}
                    />
                    <span>{sub.callout}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Hotspot Live Telemetry Card */}
          {selectedSubsystem && (
            <div className="w-full mt-1 pt-2 border-t border-[#1e252f] flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 animate-fadeIn">
              <div className="flex items-start md:items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-600/60 flex items-center justify-center text-sm shadow-inner shrink-0 mt-0.5 md:mt-0">
                  {selectedSubsystem.category === 'Optics & Radar'
                    ? '📡'
                    : selectedSubsystem.category === 'Attitude & Propulsion'
                    ? '🔥'
                    : '⚡'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-bold text-white text-xs">{selectedSubsystem.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                      {selectedSubsystem.category}
                    </span>
                    <span className="text-[10px] text-[#8b96a3]">
                      Anchor: [{selectedSubsystem.posOffset.map((v) => v.toFixed(2)).join(', ')}]
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8b96a3] mt-0.5 flex flex-wrap gap-x-3">
                    <span>
                      Mass: <strong className="text-white">{selectedSubsystem.massKg} kg</strong>
                    </span>
                    <span>
                      Power: <strong className="text-amber-400">{selectedSubsystem.powerWatts} W</strong>
                    </span>
                    <span>
                      Temp: <strong className="text-emerald-400">{selectedSubsystem.tempRange}</strong>
                    </span>
                    <span className="text-amber-300 font-mono">
                      <code>{selectedSubsystem.equation}</code>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (selectedSubsystem.category === 'Optics & Radar') {
                      sfx.playRadarPing()
                    } else if (selectedSubsystem.category === 'Attitude & Propulsion') {
                      sfx.playThruster()
                    } else {
                      sfx.playConfirm()
                    }
                  }}
                  className="px-2.5 py-1 text-[10px] rounded bg-cyan-950/80 border border-cyan-600 hover:border-cyan-400 text-cyan-300 font-bold transition-all flex items-center gap-1"
                  title="Ping component telemetry signal"
                >
                  ⚡ <span>TEST SIGNAL</span>
                </button>
                <button
                  onClick={() => {
                    sfx.playClick()
                    setDossierSat(selectedSat)
                    setDossierModalOpen(true)
                  }}
                  className="px-2.5 py-1 text-[10px] rounded bg-[#161b22] hover:bg-[#1e252f] border border-[#252d38] text-white transition-colors"
                >
                  📋 FULL SPECS
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Telemetry & Physics Equations HUD */}
      {!hudCollapsed && (
        <div className="relative z-10 p-3 sm:p-4 pointer-events-auto max-h-[340px] overflow-y-auto">
          <div className="bg-[#0b0e13]/95 backdrop-blur border border-[#252d38] rounded-xl p-4 shadow-2xl max-w-5xl mx-auto space-y-3 font-mono">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#1e252f] pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-white">
                    {customModelName ? `User Custom 3D Model: ${customModelName}` : selectedSat.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e252f] text-amber-400">
                    {customModelName ? 'External GLB' : selectedSat.agency}
                  </span>
                </div>
                <div className="text-xs text-[#8b96a3] mt-0.5">
                  {customModelMetrics ? (
                    `3D Geometry: ${customModelMetrics.triangles.toLocaleString()} polygons · Calipers: ${customModelMetrics.dimensions}`
                  ) : (
                    `${selectedSat.orbitType} · Inclination: ${simInclination}° · Swath: ${liveSwath} km`
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-amber-400 font-bold">{Math.round(liveVelocityKmh).toLocaleString()} km/h</span>
                <span>({liveVelocityKms.toFixed(2)} km/s)</span>
                <span>·</span>
                <span className="text-cyan-400 font-bold">{livePeriodMin.toFixed(1)} min Period ({liveDailyOrbits} orbits/day)</span>
              </div>
            </div>

            {/* Interactive Orbital Physics Sliders */}
            <div className="p-2.5 bg-[#121720] border border-[#252d38] rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#8b96a3]">Orbital Altitude (h):</span>
                  <span className="text-amber-400 font-bold">{simAltitude} km</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="1200"
                  step="10"
                  value={simAltitude}
                  onChange={(e) => setSimAltitude(parseInt(e.target.value))}
                  className="accent-amber-500 w-full cursor-pointer h-1.5 bg-[#1e252f] rounded"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#8b96a3]">Orbital Inclination (i):</span>
                  <span className="text-cyan-400 font-bold">{simInclination}° (Sun-synchronous drift: 0.9856°/day)</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="102"
                  step="0.1"
                  value={simInclination}
                  onChange={(e) => setSimInclination(parseFloat(e.target.value))}
                  className="accent-cyan-500 w-full cursor-pointer h-1.5 bg-[#1e252f] rounded"
                />
              </div>
            </div>

            {/* Selected Subsystem Deep-Dive Callout */}
            {selectedSubsystem && (
              <div className="p-3 bg-[#0d131a] border border-cyan-800/60 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-white font-bold">{selectedSubsystem.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                      {selectedSubsystem.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8b96a3]">
                    Mass: <strong className="text-white">{selectedSubsystem.massKg} kg</strong> · Power: <strong className="text-amber-400">{selectedSubsystem.powerWatts} W</strong> · Temp: <strong className="text-emerald-400">{selectedSubsystem.tempRange}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-[#8b96a3] leading-snug">{selectedSubsystem.desc}</p>
                <div className="p-1.5 bg-[#05070a] border border-[#1e252f] rounded font-mono text-[10px] text-amber-300">
                  <code>{selectedSubsystem.equation}</code>
                </div>
              </div>
            )}

            {/* Real Orbital Physics Equations Breakdown */}
            <div className="p-2.5 bg-[#080a0d] border border-amber-600/40 rounded-lg space-y-1 text-xs">
              <div className="text-amber-500 font-bold text-[10px] uppercase">
                Governing Astrodynamic & Sensor Equations
              </div>
              <div className="text-[#8b96a3] grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-[#4a5568] block">Orbital Velocity (Vis-Viva):</span>
                  <code className="text-white">{selectedSat.equations.velocity}</code>
                </div>
                <div>
                  <span className="text-[#4a5568] block">Keplerian Orbital Period:</span>
                  <code className="text-white">{selectedSat.equations.period}</code>
                </div>
                <div>
                  <span className="text-[#4a5568] block">J2 Nodal Precession:</span>
                  <code className="text-cyan-300">{selectedSat.equations.precession}</code>
                </div>
                <div>
                  <span className="text-[#4a5568] block">Ground Sampling Distance (GSD):</span>
                  <code className="text-emerald-300">GSD = (p * h) / f = (15μm * {simAltitude}km) / {focalLengthM}m = {liveGSD} m</code>
                </div>
              </div>
            </div>

            {/* Design Rationales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {selectedSat.designRationale.map((rat) => (
                <div key={rat.title} className="p-2 bg-[#161b22] border border-[#252d38] rounded text-[10px]">
                  <div className="font-bold text-amber-400">{rat.title}</div>
                  <div className="text-[#8b96a3] leading-snug mt-0.5">{rat.reason}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#4a5568] pt-1">
              <span>Scroll to zoom (2.2x – 8.5x) · Drag to rotate 360° · Use Exploded View, Hotspots & Custom GLB Load</span>
              <span className="text-emerald-400">TELEMETRY: DUAL-BEARING DRIVE TRACKING PASS</span>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Satellite Mission & Subsystem Intelligence Dossier Modal */}
      <SatelliteDossierModal
        isOpen={dossierModalOpen}
        onClose={() => setDossierModalOpen(false)}
        satellite={dossierSat}
        onSelectSubsystem={(sub) => {
          setSelectedSubsystem(sub)
        }}
        onSwitchToCraftView={() => {
          setViewMode('craft')
        }}
      />
    </div>
  )
}

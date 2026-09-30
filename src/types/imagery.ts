export type SensorType = 
  | 'Sentinel-2A' 
  | 'Sentinel-2B' 
  | 'Sentinel-1A SAR' 
  | 'Sentinel-1B SAR' 
  | 'Landsat 8 OLI' 
  | 'Landsat 9 OLI-2' 
  | 'ISRO Resourcesat-2 LISS-IV'
  | 'ISRO AWiFS'
  | 'ISRO Cartosat DEM'

export type SpectralBandMode = 'rgb' | 'nir' | 'ndvi' | 'sar' | 'swir'

export interface SpectralBands {
  rgb: string
  nir?: string
  ndvi?: string
  sar?: string
  swir?: string
}

export interface SearchResult {
  id: string
  tile: string
  coords: string
  lat: number
  lon: number
  date: string
  sensor: SensorType
  agency: 'Copernicus / ESA' | 'USGS / NASA' | 'ISRO / NRSC'
  resolution: string
  score: number
  tags: string[]
  cloud: number
  thumb: string
  description: string
  bands: SpectralBands
  stacUrl?: string
  licence: string
  sunElevation?: number
  orbitPass?: 'Ascending' | 'Descending'
  polarization?: string
}

export interface ChangeCandidate {
  id: string
  aoi: string
  aoiName: string
  coords: string
  lat: number
  lon: number
  dateBefore: string
  dateAfter: string
  sensor: string
  agency: string
  changeType: string
  confidence: number
  status: 'pending' | 'confirmed' | 'rejected' | 'flagged'
  thumbBefore: string
  thumbAfter: string
  maskOverlay?: string
  deltaType: 'urban_expansion' | 'deforestation' | 'flood_inundation' | 'infrastructure' | 'agriculture'
  estimatedAreaHa: number
  description: string
  analystNotes?: string
  verifiedBy?: string
}

export interface ClusterSite {
  id: string
  name: string
  centroid: string
  lat: number
  lon: number
  memberCount: number
  dominantType: string
  firstSeen: string
  similarity: number
  thumb: string
  sensor: string
  vector2D: [number, number] // UMAP 2D projection
  tsne2D?: [number, number]  // t-SNE 2D projection
  pca2D?: [number, number]   // PCA 2D projection
  ndviValue?: number
  ndwiValue?: number
  swirRatio?: number
  landCoverClass?: 'Urban & Built-Up' | 'Agriculture & Crops' | 'Dense Forest' | 'Open Water' | 'Arid / Desert' | 'Cryosphere / Glacial'
  bandReflectances?: { b2: number; b3: number; b4: number; b8: number; b11: number; b12: number }
  features: string[]
}

export interface OpenDataset {
  id: string
  name: string
  provider: 'ESA / Copernicus' | 'USGS / NASA' | 'ISRO / NRSC'
  category: 'Optical Multispectral' | 'SAR Radar' | 'Digital Elevation / Optical'
  licence: string
  licenceUrl: string
  accessType: 'Open & Free' | 'Public Domain' | 'NRSC Open Data Policy'
  resolution: string
  revisit: string
  swath: string
  spectralRange: string
  primaryUse: string
  directPortalUrl: string
  stacEndpoint: string
  documentationUrl: string
  description: string
  sampleTile: string
  badgeColor: string
}

export interface AOIRegion {
  id: string
  name: string
  country: string
  bounds: string
  lat: number
  lon: number
  activeSensors: string[]
  tileCount: string
}

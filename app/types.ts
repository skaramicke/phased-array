export interface Antenna {
  x: number; // in wavelengths
  y: number; // in wavelengths
  phase: number; // in degrees
}

export interface Configuration {
  name: string;
  antennas: Antenna[];
  target: { x: number; y: number } | null; // in wavelengths
}

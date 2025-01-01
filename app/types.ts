export interface Antenna {
  x: number;
  y: number;
}

export interface Configuration {
  name: string;
  antennas: Antenna[];
  target: { x: number; y: number } | null;
}

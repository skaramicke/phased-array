"use client";

import { useState, useEffect } from "react";
import { PhaseArrayCanvas } from "./components/PhaseArrayCanvas";
import { ControlPanel } from "./components/ControlPanel";
import { Antenna, Configuration } from "./types";
import { loadConfigurations, saveConfiguration } from "./utils/storage";
import { exportToYAML, importFromYAML } from "./utils/fileHandling";

export default function PhaseArrayVisualizer() {
  const [antennas, setAntennas] = useState<Antenna[]>([]);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<"edit" | "target">("edit");
  const [showWaves, setShowWaves] = useState(true);
  const [showEmissionCircles, setShowEmissionCircles] = useState(false);
  const [waveSpeed, setWaveSpeed] = useState(2);
  const [configurations, setConfigurations] = useState<Configuration[]>([]);

  useEffect(() => {
    setConfigurations(loadConfigurations());
  }, []);

  const handleSaveConfiguration = (name: string) => {
    const newConfig: Configuration = { name, antennas, target };
    saveConfiguration(newConfig);
    setConfigurations(loadConfigurations());
  };

  const handleLoadConfiguration = (config: Configuration) => {
    setAntennas(config.antennas);
    setTarget(config.target);
  };

  const handleExportConfiguration = () => {
    const config: Configuration = { name: "Exported Config", antennas, target };
    exportToYAML(config);
  };

  const handleImportConfiguration = async (file: File) => {
    const config = await importFromYAML(file);
    if (config) {
      setAntennas(config.antennas);
      setTarget(config.target);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 p-4">
        <PhaseArrayCanvas
          antennas={antennas}
          setAntennas={setAntennas}
          target={target}
          setTarget={setTarget}
          mode={mode}
          showWaves={showWaves}
          showEmissionCircles={showEmissionCircles}
          waveSpeed={waveSpeed}
        />
      </div>
      <div className="w-80 bg-white p-4 shadow-lg overflow-y-auto">
        <ControlPanel
          mode={mode}
          setMode={setMode}
          showWaves={showWaves}
          setShowWaves={setShowWaves}
          showEmissionCircles={showEmissionCircles}
          setShowEmissionCircles={setShowEmissionCircles}
          waveSpeed={waveSpeed}
          setWaveSpeed={setWaveSpeed}
          onSaveConfiguration={handleSaveConfiguration}
          onLoadConfiguration={handleLoadConfiguration}
          configurations={configurations}
          onExportConfiguration={handleExportConfiguration}
          onImportConfiguration={handleImportConfiguration}
        />
      </div>
    </div>
  );
}

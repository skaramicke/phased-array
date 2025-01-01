"use client";

import { useState, useEffect } from "react";
import { PhaseArrayCanvas } from "./components/PhaseArrayCanvas";
import { ControlPanel } from "./components/ControlPanel";
import { Antenna, Configuration } from "./types";
import { loadConfigurations, saveConfiguration } from "./utils/storage";
import { exportToYAML, importFromYAML } from "./utils/fileHandling";
import { calculatePhases } from "./utils/phaseCalculations";

function arraysEqual(a: Antenna[], b: Antenna[]) {
  return (
    a.length === b.length &&
    a.every(
      (antenna, index) =>
        antenna.x === b[index].x &&
        antenna.y === b[index].y &&
        antenna.phase === b[index].phase
    )
  );
}

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

  useEffect(() => {
    if (target) {
      const updatedAntennas = calculatePhases(antennas, target);
      // Only update if the phases have actually changed
      if (!arraysEqual(updatedAntennas, antennas)) {
        setAntennas(updatedAntennas);
      }
    }
  }, [target]);

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
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-4xl bg-white">
        <div className="flex flex-col h-screen">
          <div className="w-full pb-[75%] relative">
            <div className="absolute inset-0">
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
          </div>
          <div className="flex-1 overflow-y-auto">
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
              antennas={antennas}
              setAntennas={setAntennas}
              target={target}
              setTarget={setTarget}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

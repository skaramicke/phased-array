"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PhaseArrayCanvas } from "./components/PhaseArrayCanvas";
import { ControlPanel } from "./components/ControlPanel";
import { Antenna, Configuration } from "./types";
import { loadConfigurations, saveConfiguration } from "./utils/storage";
import { exportToYAML, importFromYAML } from "./utils/fileHandling";
import { calculatePhases } from "./utils/phaseCalculations";

function useAntennasWithPhases(
  initialAntennas: Antenna[],
  target: { x: number; y: number } | null
): [Antenna[], React.Dispatch<React.SetStateAction<Antenna[]>>] {
  const [antennas, setAntennas] = useState<Antenna[]>(initialAntennas);

  const updateAntennas = useCallback(
    (newAntennas: Antenna[] | ((prev: Antenna[]) => Antenna[])) => {
      setAntennas((prevAntennas) => {
        const updatedAntennas =
          typeof newAntennas === "function"
            ? newAntennas(prevAntennas)
            : newAntennas;
        if (target) {
          return calculatePhases(updatedAntennas, target);
        }
        return updatedAntennas;
      });
    },
    [target]
  );

  useEffect(() => {
    if (target) {
      updateAntennas(antennas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, updateAntennas]);

  return [antennas, updateAntennas];
}

export default function PhaseArrayVisualizer() {
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);
  const [antennas, setAntennas] = useAntennasWithPhases([], target);
  const [showWaves, setShowWaves] = useState(true);
  const [showEmissionCircles, setShowEmissionCircles] = useState(false);
  const [waveSpeed, setWaveSpeed] = useState(2);
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [showGainChart, setShowGainChart] = useState(true);

  useEffect(() => {
    setConfigurations(loadConfigurations());
  }, []);

  const handleSetTarget = useCallback(
    (newTarget: { x: number; y: number } | null) => {
      setTarget(newTarget);
    },
    []
  );

  const handleSaveConfiguration = useCallback(
    (name: string) => {
      const newConfig: Configuration = { name, antennas, target };
      saveConfiguration(newConfig);
      setConfigurations(loadConfigurations());
    },
    [antennas, target]
  );

  const handleLoadConfiguration = useCallback(
    (config: Configuration) => {
      setAntennas(config.antennas);
      setTarget(config.target);
    },
    [setAntennas]
  );

  const handleExportConfiguration = useCallback(() => {
    const config: Configuration = { name: "Exported Config", antennas, target };
    exportToYAML(config);
  }, [antennas, target]);

  const handleImportConfiguration = useCallback(
    async (file: File) => {
      const config = await importFromYAML(file);
      if (config) {
        setAntennas(config.antennas);
        setTarget(config.target);
      }
    },
    [setAntennas]
  );

  const memoizedControlPanel = useMemo(
    () => (
      <ControlPanel
        showWaves={showWaves}
        setShowWaves={setShowWaves}
        showEmissionCircles={showEmissionCircles}
        setShowEmissionCircles={setShowEmissionCircles}
        showGainChart={showGainChart}
        setShowGainChart={setShowGainChart}
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
        setTarget={handleSetTarget}
      />
    ),
    [
      showWaves,
      showEmissionCircles,
      showGainChart,
      waveSpeed,
      configurations,
      antennas,
      target,
      handleSaveConfiguration,
      handleLoadConfiguration,
      handleExportConfiguration,
      handleImportConfiguration,
      setAntennas,
      handleSetTarget,
    ]
  );

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
                setTarget={handleSetTarget}
                showWaves={showWaves}
                showEmissionCircles={showEmissionCircles}
                waveSpeed={waveSpeed}
                showGainChart={showGainChart}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">{memoizedControlPanel}</div>
        </div>
      </div>
    </div>
  );
}

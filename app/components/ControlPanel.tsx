"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Configuration, Antenna } from "../types";

interface ControlPanelProps {
  mode: "edit" | "target";
  setMode: (mode: "edit" | "target") => void;
  showWaves: boolean;
  setShowWaves: (show: boolean) => void;
  showEmissionCircles: boolean;
  setShowEmissionCircles: (show: boolean) => void;
  waveSpeed: number;
  setWaveSpeed: (speed: number) => void;
  onSaveConfiguration: (name: string) => void;
  onLoadConfiguration: (config: Configuration) => void;
  configurations: Configuration[];
  onExportConfiguration: () => void;
  onImportConfiguration: (file: File) => void;
  antennas: Antenna[];
  setAntennas: (antennas: Antenna[]) => void;
  target: { x: number; y: number } | null;
  setTarget: (target: { x: number; y: number } | null) => void;
}

export function ControlPanel({
  mode,
  setMode,
  showWaves,
  setShowWaves,
  showEmissionCircles,
  setShowEmissionCircles,
  waveSpeed,
  setWaveSpeed,
  onSaveConfiguration,
  onLoadConfiguration,
  configurations,
  onExportConfiguration,
  onImportConfiguration,
  antennas,
  setAntennas,
  target,
  setTarget,
}: ControlPanelProps) {
  const [configName, setConfigName] = useState("");

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportConfiguration(file);
    }
  };

  const handleAntennaChange = (
    index: number,
    field: keyof Antenna,
    value: number
  ) => {
    const newAntennas = [...antennas];
    newAntennas[index][field] = value;
    setAntennas(newAntennas);
  };

  const handleRemoveAntenna = (index: number) => {
    const newAntennas = antennas.filter((_, i) => i !== index);
    setAntennas(newAntennas);
  };

  const handleAddAntenna = () => {
    setAntennas([...antennas, { x: 0, y: 0, phase: 0 }]);
  };

  return (
    <div className="space-y-6 p-4 bg-white">
      {target && (
        <div>
          <Label>Target</Label>
          <div className="flex space-x-2 mt-2">
            <Input
              type="number"
              value={target.x.toFixed(2)}
              onChange={(e) =>
                setTarget({ ...target, x: parseFloat(e.target.value) })
              }
              className="flex-1"
              placeholder="X (wavelengths)"
            />
            <Input
              type="number"
              value={target.y.toFixed(2)}
              onChange={(e) =>
                setTarget({ ...target, y: parseFloat(e.target.value) })
              }
              className="flex-1"
              placeholder="Y (wavelengths)"
            />
            <Button onClick={() => setTarget(null)} variant="destructive">
              Remove Target
            </Button>
          </div>
        </div>
      )}
      <div>
        <Label>Antennas</Label>
        <div className="space-y-4 mt-2">
          {antennas.map((antenna, index) => (
            <div key={index} className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  value={antenna.x.toFixed(2)}
                  onChange={(e) =>
                    handleAntennaChange(index, "x", parseFloat(e.target.value))
                  }
                  disabled={!!target}
                  className="flex-1"
                  placeholder="X (wavelengths)"
                />
                <Input
                  type="number"
                  value={antenna.y.toFixed(2)}
                  onChange={(e) =>
                    handleAntennaChange(index, "y", parseFloat(e.target.value))
                  }
                  disabled={!!target}
                  className="flex-1"
                  placeholder="Y (wavelengths)"
                />
                <Input
                  type="number"
                  value={antenna.phase.toFixed(1)}
                  onChange={(e) =>
                    handleAntennaChange(
                      index,
                      "phase",
                      parseFloat(e.target.value)
                    )
                  }
                  disabled={!!target}
                  className="flex-1"
                  placeholder="Phase (degrees)"
                />
                <Button
                  onClick={() => handleRemoveAntenna(index)}
                  variant="destructive"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button onClick={handleAddAntenna} className="w-full">
            Add Antenna
          </Button>
        </div>
      </div>
      <div>
        <Label>Mode</Label>
        <div className="flex space-x-2 mt-2">
          <Button
            variant={mode === "edit" ? "default" : "outline"}
            onClick={() => setMode("edit")}
            className="flex-1"
          >
            Edit
          </Button>
          <Button
            variant={mode === "target" ? "default" : "outline"}
            onClick={() => setMode("target")}
            className="flex-1"
          >
            Target
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-waves">Show Waves</Label>
        <Switch
          id="show-waves"
          checked={showWaves}
          onCheckedChange={setShowWaves}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="show-emission-circles">Show Emission Circles</Label>
        <Switch
          id="show-emission-circles"
          checked={showEmissionCircles}
          onCheckedChange={setShowEmissionCircles}
        />
      </div>
      <div>
        <Label htmlFor="wave-speed">Wave Speed</Label>
        <Slider
          id="wave-speed"
          min={0.1}
          max={5}
          step={0.1}
          value={[waveSpeed]}
          onValueChange={(value) => setWaveSpeed(value[0])}
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor="config-name">Configuration Name</Label>
        <div className="flex space-x-2 mt-2">
          <Input
            id="config-name"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => onSaveConfiguration(configName)}>Save</Button>
        </div>
      </div>
      <div>
        <Label>Load Configuration</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {configurations.map((config) => (
            <Button
              key={config.name}
              onClick={() => onLoadConfiguration(config)}
              className="w-full"
            >
              {config.name}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex space-x-2">
        <Button onClick={onExportConfiguration} className="flex-1">
          Export Configuration
        </Button>
        <div className="flex-1">
          <Input
            id="import-config"
            type="file"
            accept=".yaml,.yml"
            onChange={handleImport}
            className="hidden"
          />
          <Label htmlFor="import-config" className="cursor-pointer">
            <Button className="w-full">Import Configuration</Button>
          </Label>
        </div>
      </div>
    </div>
  );
}

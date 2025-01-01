'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Configuration, Antenna } from '../types'
import { calculatePhases } from '../utils/phaseCalculations';
import { Github } from "lucide-react";

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
  const [editingAntennas, setEditingAntennas] = useState<{
    [key: string]: string | undefined;
  }>({});
  const [editingTarget, setEditingTarget] = useState<{
    x: string;
    y: string;
  } | null>(null);

  useEffect(() => {
    setEditingAntennas({});
  }, [antennas]);

  useEffect(() => {
    setEditingTarget(
      target ? { x: target.x.toString(), y: target.y.toString() } : null
    );
  }, [target]);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportConfiguration(file);
    }
  };

  const handleAntennaChange = (
    index: number,
    field: keyof Antenna,
    value: string
  ) => {
    setEditingAntennas((prev) => ({
      ...prev,
      [`${index}-${field}`]: value,
    }));
  };

  const commitAntennaChange = (index: number, field: keyof Antenna) => {
    const value = editingAntennas[`${index}-${field}`];
    if (value !== undefined) {
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue)) {
        const newAntennas = [...antennas];
        newAntennas[index] = { ...newAntennas[index], [field]: parsedValue };

        if (target && (field === "x" || field === "y")) {
          const updatedAntennas = calculatePhases(newAntennas, target);
          setAntennas(updatedAntennas);
        } else {
          setAntennas(newAntennas);
        }
      }
    }
    setEditingAntennas((prev) => {
      const newState = { ...prev };
      delete newState[`${index}-${field}`];
      return newState;
    });
  };

  const handleAntennaKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
    field: keyof Antenna
  ) => {
    if (e.key === "Enter") {
      commitAntennaChange(index, field);
    }
  };

  const handleRemoveAntenna = (index: number) => {
    const newAntennas = antennas.filter((_, i) => i !== index);
    setAntennas(newAntennas);
  };

  const handleAddAntenna = () => {
    setAntennas([...antennas, { x: 0, y: 0, phase: 0 }]);
  };

  const handleTargetChange = (field: "x" | "y", value: string) => {
    if (editingTarget) {
      setEditingTarget({ ...editingTarget, [field]: value });
    }
  };

  const commitTargetChange = () => {
    if (editingTarget) {
      const x = parseFloat(editingTarget.x);
      const y = parseFloat(editingTarget.y);
      if (!isNaN(x) && !isNaN(y)) {
        setTarget({ x, y });
      }
    }
  };

  const handleTargetKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitTargetChange();
    }
  };

  return (
    <div className="space-y-6 p-4 pt-6 bg-white relative">
      {target && (
        <div>
          <Label>Target</Label>
          <div className="flex space-x-2 mt-2">
            <Input
              type="number"
              value={editingTarget?.x ?? target.x.toFixed(2)}
              onChange={(e) => handleTargetChange("x", e.target.value)}
              onBlur={commitTargetChange}
              onKeyDown={handleTargetKeyDown}
              className="flex-1"
              placeholder="X (wavelengths)"
            />
            <span className="flex items-center">λ</span>
            <Input
              type="number"
              value={editingTarget?.y ?? target.y.toFixed(2)}
              onChange={(e) => handleTargetChange("y", e.target.value)}
              onBlur={commitTargetChange}
              onKeyDown={handleTargetKeyDown}
              className="flex-1"
              placeholder="Y (wavelengths)"
            />
            <span className="flex items-center">λ</span>
            <Button onClick={() => setTarget(null)} variant="destructive">
              Remove Target
            </Button>
          </div>
        </div>
      )}
      <div>
        <Label>Antennas</Label>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-4 gap-2 font-semibold text-sm">
            <div>X (wavelengths)</div>
            <div>Y (wavelengths)</div>
            <div>Phase (degrees)</div>
            <div>Actions</div>
          </div>
          {antennas.map((antenna, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 items-center">
              <Input
                type="number"
                value={editingAntennas[`${index}-x`] ?? antenna.x.toFixed(2)}
                onChange={(e) =>
                  handleAntennaChange(index, "x", e.target.value)
                }
                onBlur={() => commitAntennaChange(index, "x")}
                onKeyDown={(e) => handleAntennaKeyDown(e, index, "x")}
                className="w-full"
              />
              <Input
                type="number"
                value={editingAntennas[`${index}-y`] ?? antenna.y.toFixed(2)}
                onChange={(e) =>
                  handleAntennaChange(index, "y", e.target.value)
                }
                onBlur={() => commitAntennaChange(index, "y")}
                onKeyDown={(e) => handleAntennaKeyDown(e, index, "y")}
                className="w-full"
              />
              <Input
                type="number"
                value={
                  editingAntennas[`${index}-phase`] ?? antenna.phase.toFixed(1)
                }
                onChange={(e) =>
                  handleAntennaChange(index, "phase", e.target.value)
                }
                onBlur={() => commitAntennaChange(index, "phase")}
                onKeyDown={(e) => handleAntennaKeyDown(e, index, "phase")}
                disabled={!!target}
                className="w-full"
              />
              <Button
                onClick={() => handleRemoveAntenna(index)}
                variant="destructive"
                className="w-full"
              >
                Remove
              </Button>
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
        <div className="flex items-center space-x-2">
          <Slider
            id="wave-speed"
            min={0.1}
            max={5}
            step={0.1}
            value={[waveSpeed]}
            onValueChange={(value) => setWaveSpeed(value[0])}
            className="flex-1"
          />
          <span>{waveSpeed.toFixed(1)} λ/s</span>
        </div>
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
      <a
        href="https://github.com/skaramicke/phased-array"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-0 right-4 text-gray-600 hover:text-gray-900"
        aria-label="View source on GitHub"
      >
        <Github size={24} />
      </a>
    </div>
  );
}


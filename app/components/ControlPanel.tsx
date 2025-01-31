"use client";

import React, { useState, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Configuration, Antenna } from "../types";
import { calculatePhases } from "../utils/phaseCalculations";
import { Github, Trash2 } from "lucide-react";

interface ControlPanelProps {
  showWaves: boolean;
  setShowWaves: (show: boolean) => void;
  showEmissionCircles: boolean;
  setShowEmissionCircles: (show: boolean) => void;
  gainChartMode: "none" | "widget" | "overlay";
  setGainChartMode: (mode: "none" | "widget" | "overlay") => void;
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
  selectedAntennaIndex: number | null;
  setSelectedAntennaIndex: (index: number | null) => void;
}

export function ControlPanel({
  showWaves,
  setShowWaves,
  showEmissionCircles,
  setShowEmissionCircles,
  gainChartMode,
  setGainChartMode,
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
  selectedAntennaIndex,
  setSelectedAntennaIndex,
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
    setSelectedAntennaIndex(index);
  };

  const commitAntennaChange = (index: number, field: keyof Antenna) => {
    setSelectedAntennaIndex(null);
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
      setEditingTarget(null);
    }
  };

  const handleTargetKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitTargetChange();
    }
  };

  return (
    <div className="space-y-6 p-4 pt-8 bg-white relative">
      {target ? (
        <div>
          <Label className="text-lg font-semibold">Target</Label>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-sm text-center">
            <div className="font-semibold">East/West</div>
            <div className="font-semibold">North/South</div>
            <div className="flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex space-x-2 items-center">
              <Input
                type="number"
                value={editingTarget?.x ?? target.x.toFixed(2)}
                onChange={(e) => handleTargetChange("x", e.target.value)}
                onFocus={() =>
                  setEditingTarget({
                    x: target.x.toString(),
                    y: target.y.toString(),
                  })
                }
                onBlur={commitTargetChange}
                onKeyDown={handleTargetKeyDown}
                className="flex-1 text-right"
                placeholder="X (wavelengths)"
              />
              <span className="flex items-center">λ</span>
            </div>
            <div className="flex space-x-2 items-center">
              <Input
                type="number"
                value={editingTarget?.y ?? target.y.toFixed(2)}
                onChange={(e) => handleTargetChange("y", e.target.value)}
                onFocus={() =>
                  setEditingTarget({
                    x: target.x.toString(),
                    y: target.y.toString(),
                  })
                }
                onBlur={commitTargetChange}
                onKeyDown={handleTargetKeyDown}
                className="flex-1 text-right"
                placeholder="Y (wavelengths)"
              />
              <span className="flex items-center">λ</span>
            </div>
            <Button
              onClick={() => setTarget(null)}
              variant="destructive"
              className="flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-800 text-center">
          Click canvas to set a target
        </div>
      )}
      <div>
        <Label className="text-lg font-semibold">
          Antennas
          {target && (
            <span className="font-normal text-sm ml-2 text-gray-800">
              (Remove target to edit phase)
            </span>
          )}
        </Label>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-sm text-center">
            <div className="font-semibold">East/West</div>
            <div className="font-semibold">North/South</div>
            <div className="font-semibold">Phase</div>
            <div className="flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            {antennas.map((antenna, index) => (
              <React.Fragment key={index}>
                <div className="flex space-x-2 items-center">
                  <Input
                    id={`antenna-${index}-x`}
                    type="number"
                    value={
                      editingAntennas[`${index}-x`] ?? antenna.x.toFixed(2)
                    }
                    onChange={(e) =>
                      handleAntennaChange(index, "x", e.target.value)
                    }
                    onBlur={() => commitAntennaChange(index, "x")}
                    onFocus={() => {
                      setEditingAntennas((prev) => ({
                        ...prev,
                        [`${index}-x`]: antenna.x.toString(),
                      }));
                      setSelectedAntennaIndex(index);
                    }}
                    onKeyDown={(e) => handleAntennaKeyDown(e, index, "x")}
                    className={`w-full text-right ${
                      selectedAntennaIndex === index
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                  />
                  <span className="flex items-center">λ</span>
                </div>
                <div className="flex space-x-2 items-center">
                  <Input
                    id={`antenna-${index}-y`}
                    type="number"
                    value={
                      editingAntennas[`${index}-y`] ?? antenna.y.toFixed(2)
                    }
                    onChange={(e) =>
                      handleAntennaChange(index, "y", e.target.value)
                    }
                    onFocus={() => {
                      setEditingAntennas((prev) => ({
                        ...prev,
                        [`${index}-y`]: antenna.y.toString(),
                      }));
                      setSelectedAntennaIndex(index);
                    }}
                    onBlur={() => commitAntennaChange(index, "y")}
                    onKeyDown={(e) => handleAntennaKeyDown(e, index, "y")}
                    className={`w-full text-right ${
                      selectedAntennaIndex === index
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                  />
                  <span className="flex items-center">λ</span>
                </div>
                <div className="flex space-x-2 items-center">
                  <Input
                    id={`antenna-${index}-phase`}
                    type="number"
                    value={
                      editingAntennas[`${index}-phase`] ??
                      antenna.phase.toFixed(1)
                    }
                    onChange={(e) =>
                      handleAntennaChange(index, "phase", e.target.value)
                    }
                    onFocus={() => {
                      setEditingAntennas((prev) => ({
                        ...prev,
                        [`${index}-phase`]: antenna.phase.toString(),
                      }));
                      setSelectedAntennaIndex(index);
                    }}
                    onBlur={() => commitAntennaChange(index, "phase")}
                    onKeyDown={(e) => handleAntennaKeyDown(e, index, "phase")}
                    disabled={!!target}
                    className={`w-full text-right ${
                      selectedAntennaIndex === index
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                  />
                  <span className="flex items-center">°</span>
                </div>
                <Button
                  onClick={() => handleRemoveAntenna(index)}
                  variant="destructive"
                  className="w-full flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </React.Fragment>
            ))}
          </div>
          <Button onClick={handleAddAntenna} className="w-full">
            Add Antenna
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
        <Label>Gain Chart Display</Label>
        <div className="flex space-x-4 mt-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="none"
              checked={gainChartMode === "none"}
              onChange={() => setGainChartMode("none")}
            />
            <span>None</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="widget"
              checked={gainChartMode === "widget"}
              onChange={() => setGainChartMode("widget")}
            />
            <span>Widget</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="overlay"
              checked={gainChartMode === "overlay"}
              onChange={() => setGainChartMode("overlay")}
            />
            <span>Overlay</span>
          </label>
        </div>
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


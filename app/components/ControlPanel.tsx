"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Configuration } from "../types";

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
}: ControlPanelProps) {
  const [configName, setConfigName] = useState("");

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportConfiguration(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Mode</Label>
        <div className="flex space-x-2 mt-2">
          <Button
            variant={mode === "edit" ? "default" : "outline"}
            onClick={() => setMode("edit")}
          >
            Edit
          </Button>
          <Button
            variant={mode === "target" ? "default" : "outline"}
            onClick={() => setMode("target")}
          >
            Target
          </Button>
        </div>
      </div>
      <div>
        <Label htmlFor="show-waves">Show Waves</Label>
        <Switch
          id="show-waves"
          checked={showWaves}
          onCheckedChange={setShowWaves}
        />
      </div>
      <div>
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
        />
      </div>
      <div>
        <Label htmlFor="config-name">Configuration Name</Label>
        <Input
          id="config-name"
          value={configName}
          onChange={(e) => setConfigName(e.target.value)}
        />
        <Button onClick={() => onSaveConfiguration(configName)}>
          Save Configuration
        </Button>
      </div>
      <div>
        <Label>Load Configuration</Label>
        {configurations.map((config) => (
          <Button key={config.name} onClick={() => onLoadConfiguration(config)}>
            {config.name}
          </Button>
        ))}
      </div>
      <div>
        <Button onClick={onExportConfiguration}>Export Configuration</Button>
      </div>
      <div>
        <Label htmlFor="import-config">Import Configuration</Label>
        <Input
          id="import-config"
          type="file"
          accept=".yaml,.yml"
          onChange={handleImport}
        />
      </div>
    </div>
  );
}

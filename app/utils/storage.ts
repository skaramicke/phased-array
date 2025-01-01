import { Configuration } from "../types";

const STORAGE_KEY = "phaseArrayConfigurations";

export function loadConfigurations(): Configuration[] {
  const storedConfigs = localStorage.getItem(STORAGE_KEY);
  return storedConfigs ? JSON.parse(storedConfigs) : [];
}

export function saveConfiguration(config: Configuration) {
  const configs = loadConfigurations();
  configs.push(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

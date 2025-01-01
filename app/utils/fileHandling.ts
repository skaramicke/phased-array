import yaml from "js-yaml";
import { Configuration } from "../types";

export function exportToYAML(config: Configuration) {
  const yamlStr = yaml.dump(config);
  const blob = new Blob([yamlStr], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${config.name}.yaml`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromYAML(
  file: File
): Promise<Configuration | null> {
  try {
    const text = await file.text();
    const config = yaml.load(text) as Configuration;
    return config;
  } catch (error) {
    console.error("Error importing YAML:", error);
    return null;
  }
}

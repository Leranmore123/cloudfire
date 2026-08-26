import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface AgentLocalConfig {
  token?: string;
  apiKey?: string;
  userEmail?: string;
  userName?: string;
  apiUrl?: string;
  edgeUrl?: string;
}

export class ConfigStore {
  private static configDir = path.join(os.homedir(), '.turnal');
  private static configFile = path.join(ConfigStore.configDir, 'config.json');

  public static load(): AgentLocalConfig {
    try {
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      // Ignore read errors
    }
    return {};
  }

  public static save(config: Partial<AgentLocalConfig>): AgentLocalConfig {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      const existing = this.load();
      const updated = { ...existing, ...config };
      fs.writeFileSync(this.configFile, JSON.stringify(updated, null, 2), 'utf8');
      return updated;
    } catch (e) {
      console.error('Failed to save config to disk:', e);
      return {};
    }
  }

  public static clear(): void {
    try {
      if (fs.existsSync(this.configFile)) {
        fs.unlinkSync(this.configFile);
      }
    } catch (e) {
      // Ignore
    }
  }
}

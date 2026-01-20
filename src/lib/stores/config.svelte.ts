/**
 * Configuration store with localStorage persistence
 */

export interface Config {
  showNumbers: boolean;
  showTimer: boolean;
}

const STORAGE_KEY = 'shanten-trainer-config';

const defaultConfig: Config = {
  showNumbers: true,
  showTimer: true,
};

function loadConfig(): Config {
  if (typeof window === 'undefined') {
    return defaultConfig;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Config>;
      return { ...defaultConfig, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load config from localStorage:', error);
  }

  return defaultConfig;
}

function saveConfig(updated: Config): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    config = { ...updated };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save config to localStorage:', error);
  }
}

let config = $state<Config>(loadConfig());

export function getShowNumbers(): boolean {
  return config.showNumbers;
}

export function setShowNumbers(value: boolean): void {
  saveConfig({ ...config, showNumbers: value });
}

export function getShowTimer(): boolean {
  return config.showTimer;
}

export function setShowTimer(value: boolean): void {
  saveConfig({ ...config, showTimer: value });
}

export function getConfig(): Config {
  return { ...config };
}

export function resetConfig(): void {
  saveConfig({ ...defaultConfig });
}

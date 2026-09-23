import { AppConfig, AssetItem } from '../types';

const STORAGE_KEY_ASSETS = 'asset_inventory_data_v2';
const STORAGE_KEY_QUEUE = 'asset_inventory_offline_queue_v2';
const STORAGE_KEY_CONFIG = 'asset_inventory_config_v2';

export const DEFAULT_CONFIG: AppConfig = {
  gasWebAppUrl: 'https://script.google.com/macros/s/AKfycbwTc6wSioVpWxGI9HC1lUTaJClWWDlwH7ilYPUks8jvrHKXVkuroBQqzPlHWZayQ_uclw/exec',
  firebaseConfig: {
    apiKey: 'AIzaSyBsQkwTcHCj7pwXpyfPP8Vkw9nPK0xS80o',
    authDomain: 'team-collaboration-5f0d9.firebaseapp.com',
    databaseURL: 'https://team-collaboration-5f0d9-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'team-collaboration-5f0d9',
    storageBucket: 'team-collaboration-5f0d9.firebasestorage.app',
    messagingSenderId: '1058671893416',
    appId: '1:1058671893416:web:1c3421a02264b06721db9d',
    measurementId: 'G-DMRKJ3FPY2',
  },
  inspectorName: 'ทีมตรวจ 1',
};

export function loadStoredConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      // If previous stored URL was an old default template URL, replace with current user-provided default
      if (
        !parsed.gasWebAppUrl ||
        parsed.gasWebAppUrl.includes('AKfycbyYyQ3aGbXr3G968oAhV3MfrPVayo8kt5ZWl5PhJ-yJkRanKL7z8jR-iJYikOw-LXnJMA') ||
        parsed.gasWebAppUrl.includes('AKfycbzNy9ddFWY8gzqHXHXmMHtqBuQTY8u9wgjln2uPl7HX9yYXp6LRxsunW7mWI3P9LYZxwQ')
      ) {
        parsed.gasWebAppUrl = DEFAULT_CONFIG.gasWebAppUrl;
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load stored config', e);
  }
  return DEFAULT_CONFIG;
}

export function saveStoredConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save config', e);
  }
}

export function loadStoredAssets(): AssetItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load stored assets', e);
  }
  return [];
}

export function saveStoredAssets(assets: AssetItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));
  } catch (e) {
    console.warn('Failed to save assets to localStorage', e);
  }
}

export function loadOfflineQueue(): Partial<AssetItem>[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load offline queue', e);
  }
  return [];
}

export function saveOfflineQueue(queue: Partial<AssetItem>[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to save offline queue', e);
  }
}


import { AppData } from '../types';
import { INITIAL_DATA } from '../constants';

const STORAGE_KEY = 'domfin_ua_data_v1';

export const saveToStorage = (data: AppData): void => {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.error('Failed to save data', e);
  }
};

export const loadFromStorage = (): AppData => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return INITIAL_DATA;
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to load data', e);
    return INITIAL_DATA;
  }
};

// Generates the JSON string for the UI to display/use
export const getExportDataString = (data: AppData): string => {
  return JSON.stringify(data, null, 2);
};

// Generates the filename
export const getExportFileName = (): string => {
    return `budget_backup_${new Date().toISOString().split('T')[0]}.json`;
};

// Attempt to download purely via browser API
export const triggerBrowserDownload = (jsonString: string, fileName: string) => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Attempt to share as text (not file) which is more compatible on Android
export const shareAsText = async (jsonString: string) => {
    if (navigator.share) {
        await navigator.share({
            title: 'Бюджет JSON',
            text: jsonString
        });
    } else {
        throw new Error("Sharing not supported");
    }
};

export const importDataFromFile = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        // Basic validation
        if (!data.transactions || !data.accounts) {
          throw new Error("Invalid format");
        }
        resolve(data);
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsText(file);
  });
};

export const importDataFromString = (jsonString: string): AppData => {
    try {
        const data = JSON.parse(jsonString);
        if (!data.transactions || !data.accounts) {
            throw new Error("Invalid format");
        }
        return data;
    } catch (e) {
        throw e;
    }
};

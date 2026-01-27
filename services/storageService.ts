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

export const exportDataToFile = (data: AppData) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `budget_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
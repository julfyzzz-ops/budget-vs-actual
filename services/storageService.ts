
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

export const exportDataToFile = async (data: AppData) => {
  const fileName = `budget_backup_${new Date().toISOString().split('T')[0]}.json`;
  const jsonString = JSON.stringify(data, null, 2);
  let shareSuccess = false;

  // 1. Try Web Share API (Best for Mobile)
  try {
    // Check support for File constructor and sharing
    if (navigator.canShare && window.File) {
      const file = new File([jsonString], fileName, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Резервна копія бюджету',
          text: 'Файл даних для додатку Budget vs Actual'
        });
        shareSuccess = true;
      }
    }
  } catch (error) {
    console.log('Web Share API skipped or failed', error);
  }

  if (shareSuccess) return;

  // 2. Fallback: Direct download (Best for Desktop / Android Fallback)
  try {
    // Using 'application/octet-stream' forces Android to treat it as a download
    // rather than trying to open it in the browser
    const blob = new Blob([jsonString], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Small timeout to let the download start before revoking
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (downloadError) {
    console.error('Download failed', downloadError);
    
    // 3. Ultimate Fallback: Clipboard
    try {
      await navigator.clipboard.writeText(jsonString);
      alert('Не вдалося створити файл (обмеження браузера). Дані скопійовано в буфер обміну! Будь ласка, вставте їх у нотатки або повідомлення "Збережене" в Telegram.');
    } catch (clipboardError) {
      alert('Експорт не вдався. Будь ласка, спробуйте відкрити додаток у Chrome або Safari.');
    }
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

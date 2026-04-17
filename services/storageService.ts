
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
    try {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
        console.error("Download failed", e);
        // Fallback for some environments
        window.location.href = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
    }
};

// Robust share function that tries to share as a File first (Android "Save to..."), then as text
export const shareData = async (jsonString: string, fileName: string, options?: { fileTitle?: string, fileText?: string, textTitle?: string }): Promise<{success: boolean, log: string}> => {
    let log = `navigator.share exists: ${!!navigator.share}\n`;
    if (!navigator.share) return { success: false, log: log + "Share API is not supported in this WebView." };

    let shared = false;

    try {
        const file = new File([jsonString], fileName, { type: "application/json" });
        const shareDataObj = {
            files: [file],
            title: options?.fileTitle || 'Budget Backup',
            text: options?.fileText || 'App data file'
        };

        log += `navigator.canShare exists: ${!!navigator.canShare}\n`;
        if (navigator.canShare && navigator.canShare(shareDataObj)) {
            log += "canShare(file) is true. Attempting file share...\n";
            await navigator.share(shareDataObj);
            shared = true;
            log += "File share successful.\n";
        } else {
            log += "canShare(file) is false or undefined.\n";
        }
    } catch (e: any) {
        log += `File share error: ${e.name} - ${e.message}\n`;
        if (e.name === 'AbortError') return { success: true, log: log + "User aborted.\n" };
    }

    if (!shared) {
        try {
            log += "Attempting text share fallback...\n";
            await navigator.share({
                title: options?.textTitle || 'Backup (JSON)',
                text: jsonString
            });
            shared = true;
            log += "Text share successful.\n";
        } catch (e: any) {
            log += `Text share error: ${e.name} - ${e.message}\n`;
            if (e.name === 'AbortError') return { success: true, log: log + "User aborted.\n" };
        }
    }

    return { success: shared, log };
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

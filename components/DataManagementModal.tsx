
import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Share2, Upload, FileJson, Check, AlertCircle, RefreshCw, Moon, Sun, Hash, Coins, Palette } from 'lucide-react';
import { AppData, Currency, UserSettings } from '../types';
import { getExportDataString, getExportFileName, triggerBrowserDownload, shareData, importDataFromString } from '../services/storageService';
import { Button } from './ui/Button';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: AppData;
  onImport: (data: AppData) => void;
  onUpdateRates: (rates: Record<string, number>) => void;
  onUpdateSettings: (settings: UserSettings) => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  currentData, 
  onImport,
  onUpdateRates,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'rates' | 'appearance' | 'export' | 'import'>('rates');
  const [copyStatus, setCopyStatus] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const [usdRate, setUsdRate] = useState('');
  const [eurRate, setEurRate] = useState('');

  useEffect(() => {
      if (isOpen && currentData.rates) {
          setUsdRate(currentData.rates[Currency.USD]?.toString() || '');
          setEurRate(currentData.rates[Currency.EUR]?.toString() || '');
      }
  }, [isOpen, currentData]);

  if (!isOpen) return null;

  const exportString = getExportDataString(currentData);
  const fileName = getExportFileName();

  const handleCopy = () => {
    navigator.clipboard.writeText(exportString).then(() => {
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 2000);
    });
  };

  const handleDownload = async () => {
      const shared = await shareData(exportString, fileName);
      if (!shared) {
          try { triggerBrowserDownload(exportString, fileName); } 
          catch (e) { alert('Помилка завантаження.'); }
      }
  };

  const handleShare = async () => {
      const success = await shareData(exportString, fileName);
      if (!success) alert('Поділитися не вдалося.');
  };

  const handleManualImport = () => {
      try {
          const data = importDataFromString(importText);
          if(window.confirm('Це перезапише всі поточні дані. Ви впевнені?')) {
              onImport(data);
              onClose();
              setImportText('');
          }
      } catch (e) { setImportError('Невірний формат JSON даних'); }
  };

  const saveRates = () => {
      const newRates = { ...currentData.rates, [Currency.USD]: parseFloat(usdRate) || 0, [Currency.EUR]: parseFloat(eurRate) || 0, [Currency.UAH]: 1 };
      onUpdateRates(newRates);
      alert('Курси валют оновлено');
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      onUpdateSettings({ ...currentData.settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-colors overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Налаштування</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"><X size={20} /></button>
        </div>

        <div className="flex p-2 gap-1 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('rates')} className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${activeTab === 'rates' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>Курси</button>
            <button onClick={() => setActiveTab('appearance')} className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${activeTab === 'appearance' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>Вигляд</button>
            <button onClick={() => setActiveTab('export')} className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${activeTab === 'export' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>Експорт</button>
            <button onClick={() => setActiveTab('import')} className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${activeTab === 'import' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>Імпорт</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'rates' && (
                <div className="space-y-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Встановіть поточні ринкові курси валют для розрахунку загального балансу.</p>
                    <div className="grid gap-4">
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Курс USD до UAH</label>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-400">1 $ =</span>
                                <input type="number" step="0.01" value={usdRate} onChange={(e) => setUsdRate(e.target.value)} className="flex-1 p-2 text-lg font-bold bg-white dark:bg-gray-800 dark:text-white rounded-lg border border-gray-200 dark:border-gray-700" />
                                <span className="font-bold text-gray-400">₴</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Курс EUR до UAH</label>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-400">1 € =</span>
                                <input type="number" step="0.01" value={eurRate} onChange={(e) => setEurRate(e.target.value)} className="flex-1 p-2 text-lg font-bold bg-white dark:bg-gray-800 dark:text-white rounded-lg border border-gray-200 dark:border-gray-700" />
                                <span className="font-bold text-gray-400">₴</span>
                            </div>
                        </div>
                    </div>
                    <Button onClick={saveRates} fullWidth><RefreshCw size={18} /> Зберегти курси</Button>
                </div>
            )}

            {activeTab === 'appearance' && (
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Palette size={18} className="text-primary" />
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Тема додатку</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => updateSetting('theme', 'light')} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${currentData.settings.theme === 'light' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-primary text-primary' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                                <Sun size={24} />
                                <span className="text-sm font-bold">Світла</span>
                            </button>
                            <button onClick={() => updateSetting('theme', 'dark')} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${currentData.settings.theme === 'dark' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-primary text-primary' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                                <Moon size={24} />
                                <span className="text-sm font-bold">Темна</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Hash size={18} className="text-primary" />
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Вигляд чисел</h3>
                        </div>
                        <div className="space-y-2">
                            <button onClick={() => updateSetting('numberFormat', 'integer')} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${currentData.settings.numberFormat === 'integer' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-primary text-primary' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-600 dark:text-gray-400">123</div>
                                    <span className="font-bold">Тільки цілі значення</span>
                                </div>
                                {currentData.settings.numberFormat === 'integer' && <Check size={20} />}
                            </button>
                            <button onClick={() => updateSetting('numberFormat', 'decimal')} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${currentData.settings.numberFormat === 'decimal' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-primary text-primary' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-600 dark:text-gray-400">.00</div>
                                    <span className="font-bold">Два знаки після коми</span>
                                </div>
                                {currentData.settings.numberFormat === 'decimal' && <Check size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'export' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Збережіть файл для резервного копіювання.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={handleDownload}><Download size={16} /> Файл</Button>
                        <Button variant="secondary" onClick={handleShare}><Share2 size={16} /> Поділитись</Button>
                    </div>
                    <div className="relative">
                        <textarea readOnly value={exportString} className="w-full h-48 p-3 text-xs font-mono bg-gray-50 dark:bg-gray-900 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl" />
                        <button onClick={handleCopy} className={`absolute top-2 right-2 p-2 rounded-lg text-xs font-bold border ${copyStatus ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>{copyStatus ? <Check size={14} /> : <Copy size={14} />}</button>
                    </div>
                </div>
            )}

            {activeTab === 'import' && (
                <div className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200 flex gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>Заміна всіх даних!</span></div>
                    <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='Вставте JSON...' className="w-full h-32 p-3 text-xs font-mono bg-white dark:bg-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-xl" />
                    {importError && <p className="text-xs text-red-500">{importError}</p>}
                    <Button fullWidth onClick={handleManualImport} disabled={!importText}>Відновити</Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

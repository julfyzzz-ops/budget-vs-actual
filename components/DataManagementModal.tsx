
import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Share2, Upload, FileJson, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { AppData, Currency } from '../types';
import { getExportDataString, getExportFileName, triggerBrowserDownload, shareAsText, importDataFromString } from '../services/storageService';
import { Button } from './ui/Button';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: AppData;
  onImport: (data: AppData) => void;
  onUpdateRates: (rates: Record<string, number>) => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  currentData, 
  onImport,
  onUpdateRates
}) => {
  const [activeTab, setActiveTab] = useState<'rates' | 'export' | 'import'>('rates');
  const [copyStatus, setCopyStatus] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Rates state
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

  const handleDownload = () => {
      try {
        triggerBrowserDownload(exportString, fileName);
      } catch (e) {
        alert('Помилка завантаження. Спробуйте скопіювати текст вручну.');
      }
  };

  const handleShare = async () => {
      try {
          await shareAsText(exportString);
      } catch (e) {
          alert('Поділитися не вдалося. Скопіюйте текст вручну.');
      }
  };

  const handleManualImport = () => {
      try {
          const data = importDataFromString(importText);
          if(window.confirm('Це перезапише всі поточні дані. Ви впевнені?')) {
              onImport(data);
              onClose();
              setImportText('');
          }
      } catch (e) {
          setImportError('Невірний формат JSON даних');
      }
  };

  const saveRates = () => {
      const newRates = {
          ...currentData.rates,
          [Currency.USD]: parseFloat(usdRate) || 0,
          [Currency.EUR]: parseFloat(eurRate) || 0,
          [Currency.UAH]: 1
      };
      onUpdateRates(newRates);
      // Optional feedback
      alert('Курси валют оновлено');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Налаштування</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-1 bg-gray-50 border-b border-gray-100">
            <button 
                onClick={() => setActiveTab('rates')}
                className={`flex-1 py-2 rounded-lg font-medium text-xs transition-colors ${activeTab === 'rates' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
            >
                Курси
            </button>
            <button 
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-2 rounded-lg font-medium text-xs transition-colors ${activeTab === 'export' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
            >
                Експорт
            </button>
            <button 
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-2 rounded-lg font-medium text-xs transition-colors ${activeTab === 'import' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
            >
                Імпорт
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
            
            {activeTab === 'rates' && (
                <div className="space-y-6">
                    <p className="text-sm text-gray-500 mb-4">
                        Встановіть поточні ринкові курси валют. Ці значення будуть використовуватись для відображення загального балансу в гривні та як курс за замовчуванням при створенні нових транзакцій.
                    </p>

                    <div className="grid gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Курс USD до UAH</label>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-400">1 $ =</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={usdRate}
                                    onChange={(e) => setUsdRate(e.target.value)}
                                    className="flex-1 p-2 text-lg font-bold bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                                <span className="font-bold text-gray-400">₴</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Курс EUR до UAH</label>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-400">1 € =</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={eurRate}
                                    onChange={(e) => setEurRate(e.target.value)}
                                    className="flex-1 p-2 text-lg font-bold bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                                <span className="font-bold text-gray-400">₴</span>
                            </div>
                        </div>
                    </div>

                    <Button onClick={saveRates} fullWidth className="py-3 flex items-center justify-center gap-2">
                        <RefreshCw size={18} /> Зберегти курси
                    </Button>
                </div>
            )}

            {activeTab === 'export' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Збережіть цей файл або текст для резервного копіювання даних.
                    </p>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={handleDownload} className="text-sm">
                            <Download size={16} /> Скачати файл
                        </Button>
                        <Button variant="secondary" onClick={handleShare} className="text-sm">
                            <Share2 size={16} /> Поділитися
                        </Button>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Сирі дані (JSON):</label>
                        <textarea 
                            readOnly
                            value={exportString}
                            className="w-full h-48 p-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                            onClick={(e) => e.currentTarget.select()}
                        />
                        <button 
                            onClick={handleCopy}
                            className={`absolute top-8 right-2 p-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm border transition-all ${copyStatus ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {copyStatus ? <Check size={14} /> : <Copy size={14} />}
                            {copyStatus ? 'Скопійовано' : 'Копіювати'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'import' && (
                <div className="space-y-4">
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>Увага! Імпорт повністю замінить поточні дані додатку.</span>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Варіант 1: Вставити код</label>
                        <textarea 
                            value={importText}
                            onChange={(e) => {
                                setImportText(e.target.value);
                                setImportError(null);
                            }}
                            placeholder='Вставте сюди скопійований JSON код...'
                            className="w-full h-32 p-3 text-xs font-mono bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary"
                        />
                        {importError && (
                            <p className="text-xs text-red-500 mt-1">{importError}</p>
                        )}
                        <Button 
                            fullWidth 
                            className="mt-2" 
                            disabled={!importText}
                            onClick={handleManualImport}
                        >
                            Відновити з коду
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 py-2">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-xs text-gray-400 font-medium">АБО</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Варіант 2: Завантажити файл</label>
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FileJson className="w-8 h-8 mb-2 text-gray-400" />
                                <p className="text-sm text-gray-500">Натисніть для вибору .json файлу</p>
                            </div>
                            <input 
                                type="file" 
                                accept=".json"
                                className="hidden" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if(file) {
                                        // Trigger standard file import logic from App
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            const txt = ev.target?.result as string;
                                            setImportText(txt); // Put it in text area for preview
                                        };
                                        reader.readAsText(file);
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

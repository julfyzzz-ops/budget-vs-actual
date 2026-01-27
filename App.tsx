
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, List, Wallet, Plus, Settings, Download, Upload, Calculator } from 'lucide-react';
import { AppData, Transaction, Account, Category } from './types';
import { INITIAL_DATA } from './constants';
import { loadFromStorage, saveToStorage, exportDataToFile, importDataFromFile } from './services/storageService';
import { OverviewTab } from './components/OverviewTab';
import { TransactionList } from './components/TransactionList';
import { AccountsTab } from './components/AccountsTab';
import { BudgetTab } from './components/BudgetTab';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AccountModal } from './components/AccountModal';
import { CategoryModal } from './components/CategoryModal';

// Simple UUID generator fallback since we can't install packages freely
const generateId = () => Math.random().toString(36).substr(2, 9);

const AppIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#10B981"/>
    <rect x="6" y="8" width="12" height="4" rx="1" fill="#047857"/>
    <rect x="6" y="14" width="12" height="4" rx="1" fill="#059669"/>
    <rect x="6" y="20" width="12" height="4" rx="1" fill="#10B981"/>
    <path d="M24 10C25.3333 10 26 11 26 12.5C26 14 25.3333 14.5 24 14.5C22.6667 14.5 22 14 22 12.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M24 22C22.6667 22 22 21 22 19.5C22 18 22.6667 17.5 24 17.5C25.3333 17.5 26 18 26 19.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M24 14.5V17.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M24 8V10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M24 22V24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'accounts' | 'budget'>('overview');
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loaded = loadFromStorage();
    
    // Migration: ensure accounts have types and icons
    if (loaded.accounts) {
       loaded.accounts = loaded.accounts.map(a => {
           let updated = { ...a };
           // @ts-ignore
           if (!updated.type) updated.type = 'CURRENT';
           if (!updated.currentRate) updated.currentRate = 1;
           if (!updated.icon) {
               // Heuristic for migration
               const nameLower = updated.name.toLowerCase();
               if (nameLower.includes('карт') || nameLower.includes('card')) updated.icon = 'credit-card';
               else if (nameLower.includes('банк') || nameLower.includes('bank')) updated.icon = 'landmark';
               else if (nameLower.includes('usd') || nameLower.includes('eur')) updated.icon = 'banknote';
               else updated.icon = 'wallet';
           }
           return updated as Account;
       });
    }

    // Migration for categories (ensure monthlyBudget exists)
    if(loaded.categories) {
        loaded.categories = loaded.categories.map(c => ({
            ...c,
            monthlyBudget: c.monthlyBudget !== undefined ? c.monthlyBudget : 0
        }));
    }

    setData(loaded);
  }, []);

  // Auto-save on change
  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  const saveTransaction = (t: Transaction | Omit<Transaction, 'id'>) => {
    if ('id' in t) {
        // Edit existing
        setData(prev => ({
            ...prev,
            transactions: prev.transactions.map(tr => tr.id === t.id ? t as Transaction : tr)
        }));
    } else {
        // Create new
        const newTransaction: Transaction = {
          ...t,
          id: generateId()
        };
        setData(prev => ({
          ...prev,
          transactions: [...prev.transactions, newTransaction]
        }));
    }
  };

  const openEditTransaction = (t: Transaction) => {
      setEditingTransaction(t);
      setIsTransactionModalOpen(true);
  };

  const deleteTransaction = (id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
  };

  // --- Account Handlers ---
  const saveAccount = (accountData: Omit<Account, 'id'> | Account) => {
    if ('id' in accountData) {
        // Edit existing
        setData(prev => ({
            ...prev,
            accounts: prev.accounts.map(a => a.id === accountData.id ? accountData as Account : a)
        }));
    } else {
        // Create new
        const newAccount: Account = {
            ...accountData,
            id: generateId()
        };
        setData(prev => ({
            ...prev,
            accounts: [...prev.accounts, newAccount]
        }));
    }
  };

  const deleteAccount = (id: string) => {
    setData(prev => ({
        ...prev,
        accounts: prev.accounts.filter(a => a.id !== id),
        transactions: prev.transactions.filter(t => t.accountId !== id)
    }));
  };

  const openAddAccount = () => {
    setEditingAccount(undefined);
    setIsAccountModalOpen(true);
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  // --- Category Handlers ---
  const saveCategory = (catData: Omit<Category, 'id'> | Category) => {
    if ('id' in catData) {
        setData(prev => ({
            ...prev,
            categories: prev.categories.map(c => c.id === catData.id ? catData as Category : c)
        }));
    } else {
        const newCat: Category = {
            ...catData,
            id: generateId()
        };
        setData(prev => ({
            ...prev,
            categories: [...prev.categories, newCat]
        }));
    }
  };

  const reorderCategories = (newCategories: Category[]) => {
      setData(prev => ({
          ...prev,
          categories: newCategories
      }));
  };

  const deleteCategory = (id: string) => {
    setData(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== id)
    }));
  };

  const openAddCategory = () => {
      setEditingCategory(undefined);
      setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
      setEditingCategory(cat);
      setIsCategoryModalOpen(true);
  };


  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await importDataFromFile(file);
        if(confirm('Це перезапише ваші поточні дані. Продовжити?')) {
            setData(imported);
            alert('Дані успішно імпортовано!');
        }
      } catch (err) {
        alert('Помилка імпорту файлу');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 max-w-lg mx-auto shadow-2xl overflow-hidden relative border-x border-gray-200">
      
      {/* Header */}
      <header className="bg-white px-4 py-3 flex justify-between items-center shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-2">
           <AppIcon />
           <h1 className="font-bold text-gray-800 text-lg">budget vs actual</h1>
        </div>
        <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                <Settings size={20} />
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                    <button 
                        onClick={() => { exportDataToFile(data); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2 text-gray-700"
                    >
                        <Download size={16} /> Експорт (JSON)
                    </button>
                    <label className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm flex items-center gap-2 text-gray-700 cursor-pointer border-t border-gray-50">
                        <Upload size={16} /> Імпорт (JSON)
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>
                </div>
            )}
            {/* Overlay to close menu */}
            {isMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full">
        {activeTab === 'overview' && (
            <OverviewTab transactions={data.transactions} categories={data.categories} />
        )}
        {activeTab === 'transactions' && (
            <TransactionList 
                transactions={data.transactions} 
                accounts={data.accounts} 
                categories={data.categories} 
                onDelete={deleteTransaction}
                onEdit={openEditTransaction}
            />
        )}
        {activeTab === 'accounts' && (
            <AccountsTab 
                accounts={data.accounts} 
                transactions={data.transactions}
                onAddAccount={openAddAccount}
                onEditAccount={openEditAccount}
                onDeleteAccount={deleteAccount}
            />
        )}
        {activeTab === 'budget' && (
            <BudgetTab 
                categories={data.categories}
                onAddCategory={openAddCategory}
                onEditCategory={openEditCategory}
                onDeleteCategory={deleteCategory}
                onReorderCategories={reorderCategories}
            />
        )}
      </main>

      {/* FAB - Add Button (Absolute positioned relative to container) */}
      <div className="absolute bottom-20 right-4 z-30">
          <button 
            onClick={() => {
                setEditingTransaction(undefined);
                setIsTransactionModalOpen(true);
            }}
            className="w-14 h-14 bg-primary rounded-full shadow-lg shadow-emerald-300 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
              <Plus size={32} />
          </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 pb-safe pt-2 px-2 flex justify-between items-center z-20 pb-4 shrink-0">
        <button 
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${activeTab === 'overview' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <LayoutDashboard size={24} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Огляд</span>
        </button>
        <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${activeTab === 'transactions' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <List size={24} strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Транзакції</span>
        </button>
        <button 
            onClick={() => setActiveTab('budget')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${activeTab === 'budget' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Calculator size={24} strokeWidth={activeTab === 'budget' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Бюджет</span>
        </button>
        <button 
            onClick={() => setActiveTab('accounts')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${activeTab === 'accounts' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Wallet size={24} strokeWidth={activeTab === 'accounts' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Рахунки</span>
        </button>
      </nav>

      {/* Modals */}
      <AddTransactionModal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setIsTransactionModalOpen(false)} 
        onSave={saveTransaction}
        accounts={data.accounts}
        categories={data.categories}
        initialData={editingTransaction}
      />

      <AccountModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={saveAccount}
        initialData={editingAccount}
      />

      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={saveCategory}
        initialData={editingCategory}
      />
    </div>
  );
}

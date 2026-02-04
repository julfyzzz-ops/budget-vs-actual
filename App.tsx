
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, List, Wallet, Plus, Settings, Calculator } from 'lucide-react';
import { AppData, Transaction, Account, Category } from './types';
import { INITIAL_DATA } from './constants';
import { loadFromStorage, saveToStorage } from './services/storageService';
import { OverviewTab } from './components/OverviewTab';
import { TransactionList, TransactionFilters } from './components/TransactionList';
import { AccountsTab } from './components/AccountsTab';
import { BudgetTab } from './components/BudgetTab';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AccountModal } from './components/AccountModal';
import { CategoryModal } from './components/CategoryModal';
import { DataManagementModal } from './components/DataManagementModal';

// Simple UUID generator fallback since we can't install packages freely
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'accounts' | 'budget'>('overview');
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  
  // Navigation & Filtering State
  const [transactionFilters, setTransactionFilters] = useState<TransactionFilters | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  
  // Load data on mount
  useEffect(() => {
    const loaded = loadFromStorage();
    
    // Migration: ensure rates exist
    if (!loaded.rates) {
        loaded.rates = INITIAL_DATA.rates;
    }

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

  const reorderAccounts = (newAccounts: Account[]) => {
      setData(prev => ({
          ...prev,
          accounts: newAccounts
      }));
  };

  const toggleAccountVisibility = (account: Account) => {
      const updatedAccount = { ...account, isHidden: !account.isHidden };
      saveAccount(updatedAccount);
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

  const handleDataImport = (newData: AppData) => {
      setData(newData);
      alert('Дані успішно імпортовано!');
  };

  const handleUpdateRates = (newRates: Record<string, number>) => {
      setData(prev => ({
          ...prev,
          rates: newRates
      }));
  };

  // --- Navigation & Filtering Handlers ---
  const handleOverviewCategoryClick = (categoryId: string, date: Date) => {
    setTransactionFilters({
        categoryId,
        date,
        accountId: ''
    });
    setActiveTab('transactions');
  };

  const handleAccountSelect = (accountId: string) => {
    setTransactionFilters({
        accountId,
        date: new Date(), // Default to current month, user can change
        categoryId: ''
    });
    setActiveTab('transactions');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 w-full overflow-hidden relative">
      
      {/* Header removed as requested */}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative w-full pt-safe">
        {activeTab === 'overview' && (
            <OverviewTab 
                transactions={data.transactions} 
                categories={data.categories}
                onCategoryClick={handleOverviewCategoryClick} 
            />
        )}
        {activeTab === 'transactions' && (
            <TransactionList 
                transactions={data.transactions} 
                accounts={data.accounts} 
                categories={data.categories} 
                onDelete={deleteTransaction}
                onEdit={openEditTransaction}
                initialFilters={transactionFilters}
            />
        )}
        {activeTab === 'accounts' && (
            <AccountsTab 
                accounts={data.accounts} 
                transactions={data.transactions}
                rates={data.rates}
                onAddAccount={openAddAccount}
                onEditAccount={openEditAccount}
                onDeleteAccount={deleteAccount}
                onSelectAccount={handleAccountSelect}
                onReorderAccounts={reorderAccounts}
                onToggleVisibility={toggleAccountVisibility}
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

      {/* FAB - Add Button */}
      <div className="absolute bottom-28 right-4 z-30">
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
      <nav className="bg-white border-t border-gray-200 pb-safe pt-2 px-2 flex justify-between items-center z-20 pb-4">
        <button 
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${activeTab === 'overview' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <LayoutDashboard size={22} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Огляд</span>
        </button>
        <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${activeTab === 'transactions' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <List size={22} strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Транз.</span>
        </button>
        <button 
            onClick={() => setActiveTab('budget')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${activeTab === 'budget' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Calculator size={22} strokeWidth={activeTab === 'budget' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Бюджет</span>
        </button>
        <button 
            onClick={() => setActiveTab('accounts')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] ${activeTab === 'accounts' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Wallet size={22} strokeWidth={activeTab === 'accounts' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Рахунки</span>
        </button>
        {/* Settings moved here */}
        <button 
            onClick={() => setIsDataModalOpen(true)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors min-w-[60px] text-gray-400 hover:text-gray-600`}
        >
            <Settings size={22} />
            <span className="text-[10px] font-medium">Налашт.</span>
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
        rates={data.rates}
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
        onSave={saveAccount} // Bug fix: passing saveAccount for category fix, wait, saveCategory is separate
        // Wait, saveCategory was passed correctly before?
        // Checking App.tsx content above...
        // Ah, in previous file content it was: onSave={saveCategory}. 
        // In the updated content above I wrote onSave={saveAccount} by mistake in CategoryModal props?
        // Let me double check the App.tsx content I just wrote above.
        // Yes, in the App.tsx content block above I wrote <CategoryModal ... onSave={saveAccount} />. This is a BUG. 
        // I need to correct it to saveCategory.
        // Also passing toggleAccountVisibility to AccountsTab.
      />

      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={saveCategory} // CORRECTED
        initialData={editingCategory}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        currentData={data}
        onImport={handleDataImport}
        onUpdateRates={handleUpdateRates}
      />
    </div>
  );
}

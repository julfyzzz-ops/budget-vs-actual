
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, List, Wallet, Plus, Settings, Calculator } from 'lucide-react';
import { AppData, Transaction, Account, Category, UserSettings } from './types';
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

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'accounts' | 'budget'>('overview');
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  
  const [transactionFilters, setTransactionFilters] = useState<TransactionFilters | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [editingCategoryDate, setEditingCategoryDate] = useState<Date>(new Date());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  
  useEffect(() => {
    const loaded = loadFromStorage();
    
    if (!loaded.rates) loaded.rates = INITIAL_DATA.rates;
    if (!loaded.settings) loaded.settings = INITIAL_DATA.settings;

    if (loaded.accounts) {
       loaded.accounts = loaded.accounts.map(a => {
           let updated = { ...a };
           // @ts-ignore
           if (!updated.type) updated.type = 'CURRENT';
           if (!updated.currentRate) updated.currentRate = 1;
           if (!updated.icon) {
               const nameLower = updated.name.toLowerCase();
               if (nameLower.includes('карт') || nameLower.includes('card')) updated.icon = 'credit-card';
               else if (nameLower.includes('банк') || nameLower.includes('bank')) updated.icon = 'landmark';
               else if (nameLower.includes('usd') || nameLower.includes('eur')) updated.icon = 'banknote';
               else updated.icon = 'wallet';
           }
           return updated as Account;
       });
    }

    if(loaded.categories) {
        loaded.categories = loaded.categories.map(c => {
            const updated = { ...c };
            if (!updated.budgetHistory) {
                updated.budgetHistory = { '2023-01': c.monthlyBudget || 0 };
            }
            if (updated.monthlyBudget === undefined) updated.monthlyBudget = 0;
            return updated;
        });
    }

    setData(loaded);
  }, []);

  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  // Sync theme with document class
  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.theme]);

  const saveTransaction = (t: Transaction | Omit<Transaction, 'id'>) => {
    if ('id' in t) {
        setData(prev => ({
            ...prev,
            transactions: prev.transactions.map(tr => tr.id === t.id ? t as Transaction : tr)
        }));
    } else {
        const newTransaction: Transaction = { ...t, id: generateId() };
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

  const saveAccount = (accountData: Omit<Account, 'id'> | Account) => {
    if ('id' in accountData) {
        setData(prev => ({
            ...prev,
            accounts: prev.accounts.map(a => a.id === accountData.id ? accountData as Account : a)
        }));
    } else {
        const newAccount: Account = { ...accountData, id: generateId() };
        setData(prev => ({
            ...prev,
            accounts: [...prev.accounts, newAccount]
        }));
    }
  };

  const reorderAccounts = (newAccounts: Account[]) => {
      setData(prev => ({ ...prev, accounts: newAccounts }));
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

  const saveCategory = (catData: Omit<Category, 'id'> | Category) => {
    const monthKey = editingCategoryDate.toISOString().slice(0, 7);
    if ('id' in catData) {
        setData(prev => ({
            ...prev,
            categories: prev.categories.map(c => {
                if (c.id === catData.id) {
                    const newBudget = catData.monthlyBudget;
                    const oldHistory = c.budgetHistory || {};
                    const newHistory = { ...oldHistory };
                    newHistory[monthKey] = newBudget;
                    Object.keys(newHistory).forEach(key => {
                        if (key > monthKey) delete newHistory[key];
                    });
                    return { ...catData, budgetHistory: newHistory } as Category;
                }
                return c;
            })
        }));
    } else {
        const newCat: Category = {
            ...catData,
            id: generateId(),
            budgetHistory: { [monthKey]: catData.monthlyBudget }
        } as Category;
        setData(prev => ({
            ...prev,
            categories: [...prev.categories, newCat]
        }));
    }
  };

  const reorderCategories = (newCategories: Category[]) => {
      setData(prev => ({ ...prev, categories: newCategories }));
  };

  const deleteCategory = (id: string) => {
    setData(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== id)
    }));
  };

  const openAddCategory = (date: Date) => {
      setEditingCategoryDate(date);
      setEditingCategory(undefined);
      setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: Category, date: Date) => {
      setEditingCategoryDate(date);
      setEditingCategory(cat);
      setIsCategoryModalOpen(true);
  };

  const handleDataImport = (newData: AppData) => {
      setData(newData);
      alert('Дані успішно імпортовано!');
  };

  const handleUpdateRates = (newRates: Record<string, number>) => {
      setData(prev => ({ ...prev, rates: newRates }));
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
      setData(prev => ({ ...prev, settings: newSettings }));
  };

  const handleOverviewCategoryClick = (categoryId: string, date: Date) => {
    setTransactionFilters({ categoryId, date, accountId: '' });
    setActiveTab('transactions');
  };

  const handleAccountSelect = (accountId: string) => {
    setTransactionFilters({ accountId, date: new Date(), categoryId: '' });
    setActiveTab('transactions');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 w-full overflow-hidden relative transition-colors duration-300">
      
      <main className="flex-1 overflow-hidden relative w-full pt-safe">
        {activeTab === 'overview' && (
            <OverviewTab 
                transactions={data.transactions} 
                categories={data.categories}
                onCategoryClick={handleOverviewCategoryClick}
                settings={data.settings}
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
                onResetFilters={() => setTransactionFilters(null)}
                settings={data.settings}
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
                onOpenSettings={() => setIsDataModalOpen(true)}
                settings={data.settings}
            />
        )}
        {activeTab === 'budget' && (
            <BudgetTab 
                categories={data.categories}
                onAddCategory={openAddCategory}
                onEditCategory={openEditCategory}
                onDeleteCategory={deleteCategory}
                onReorderCategories={reorderCategories}
                settings={data.settings}
            />
        )}
      </main>

      <div className="absolute bottom-28 right-4 z-30">
          <button 
            onClick={() => {
                setEditingTransaction(undefined);
                setIsTransactionModalOpen(true);
            }}
            className="w-14 h-14 bg-primary rounded-full shadow-lg shadow-emerald-300 dark:shadow-emerald-900/40 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
              <Plus size={32} />
          </button>
      </div>

      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe pt-2 px-2 flex justify-between items-center z-20 pb-4 transition-colors">
        <button 
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${activeTab === 'overview' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
            <LayoutDashboard size={22} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Огляд</span>
        </button>
        <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${activeTab === 'transactions' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
            <List size={22} strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Транз.</span>
        </button>
        <button 
            onClick={() => setActiveTab('budget')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${activeTab === 'budget' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
            <Calculator size={22} strokeWidth={activeTab === 'budget' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Бюджет</span>
        </button>
        <button 
            onClick={() => setActiveTab('accounts')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1 ${activeTab === 'accounts' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
            <Wallet size={22} strokeWidth={activeTab === 'accounts' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Рахунки</span>
        </button>
      </nav>

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
        onSave={saveCategory}
        initialData={editingCategory}
        targetDate={editingCategoryDate}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        currentData={data}
        onImport={handleDataImport}
        onUpdateRates={handleUpdateRates}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}

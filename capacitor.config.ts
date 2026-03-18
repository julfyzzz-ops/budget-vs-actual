import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.financetracker.app',
  appName: 'Finance Tracker',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    // Тут будуть налаштування плагінів, якщо потрібно
  }
};

export default config;

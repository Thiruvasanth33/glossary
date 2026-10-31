import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { GroceryProvider } from './context/GroceryContext';
import { LanguageProvider } from './i18n/LanguageContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <GroceryProvider>
            <App />
          </GroceryProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  </React.StrictMode>
);

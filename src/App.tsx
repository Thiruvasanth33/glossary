import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ViewPricesPage } from './pages/ViewPricesPage';
import { ManageProductsPage } from './pages/ManageProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { VoiceSearchPage } from './pages/VoiceSearchPage';
import { PriceHistoryPage } from './pages/PriceHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="prices" element={<ViewPricesPage />} />
          <Route path="products" element={<ManageProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="voice-search" element={<VoiceSearchPage />} />
          <Route path="history" element={<PriceHistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

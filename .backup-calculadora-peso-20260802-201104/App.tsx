
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppStateProvider } from './contexts/AppStateContext';
import { ThemeToggleButton } from './components/ui/ThemeToggleButton';
import MainMenu from './pages/MainMenu';
import OrderCalculator from './pages/OrderCalculator';
import AllOrdersView from './pages/AllOrdersView';
import SpecialRemindersView from './pages/SpecialRemindersView';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <HashRouter>
          <div className="container mx-auto p-2 sm:p-4 relative min-h-screen">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
              <ThemeToggleButton />
            </div>
            <Routes>
              <Route path="/" element={<MainMenu />} />
              <Route path="/calculator/:supplierKey" element={<OrderCalculator />} />
              <Route path="/all-orders" element={<AllOrdersView />} />
              <Route path="/special-reminders" element={<SpecialRemindersView />} />
            </Routes>
          </div>
        </HashRouter>
      </AppStateProvider>
    </ThemeProvider>
  );
};

export default App;

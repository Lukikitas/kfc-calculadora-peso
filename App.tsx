
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppStateProvider } from './contexts/AppStateContext';
import { ThemeToggleButton } from './components/ui/ThemeToggleButton';
import WeightCalculator from './pages/WeightCalculator';

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
              <Route path="/" element={<WeightCalculator />} />
              <Route path="/weight-calculator" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </HashRouter>
      </AppStateProvider>
    </ThemeProvider>
  );
};

export default App;

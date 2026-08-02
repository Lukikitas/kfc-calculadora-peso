
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Restore App import
import ErrorBoundary from './components/ErrorBoundary'; // Import the ErrorBoundary

console.log('[DEBUG index.tsx] Top of index.tsx reached. React and ReactDOM should be available from importmap.');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("[DEBUG index.tsx] Fatal Error: Could not find root element with ID 'root' in HTML.");
  // Attempt to display an error message directly in the body if #root is missing
  document.body.innerHTML = '<div style="color: red; font-size: 20px; padding: 20px; text-align: center;">Error Crítico: No se encontró el elemento raíz (#root) para montar la aplicación. Revisa tu index.html.</div>';
} else {
  try {
    console.log('[DEBUG index.tsx] Root element found. Attempting to create React root.');
    const root = ReactDOM.createRoot(rootElement);
    console.log('[DEBUG index.tsx] React root created. Attempting to render App.');
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("[DEBUG index.tsx] App rendering attempted via React root.render().");
  } catch (e: any) {
    console.error("[DEBUG index.tsx] Error during ReactDOM.createRoot or root.render:", e);
    rootElement.innerHTML = `<div style="color: red; font-size: 20px; padding: 20px; text-align: center;">Error al inicializar React: ${e.message}. Revisa la consola.</div>`;
  }
}

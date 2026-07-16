import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SanctuaryProvider } from './hooks/SanctuaryContext';
import './styles/global.css';

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Sanctuary root element #root was not found in index.html');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* HashRouter: required for GitHub project Pages (no server rewrite to index.html). */}
      <HashRouter>
        <SanctuaryProvider>
          <App />
        </SanctuaryProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

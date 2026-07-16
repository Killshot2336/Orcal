import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { SanctuaryProvider } from './hooks/SanctuaryContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <SanctuaryProvider>
        <App />
      </SanctuaryProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

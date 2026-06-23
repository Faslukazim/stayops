import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root.jsx';
import { ToastProvider } from './lib/toast.jsx';
import './styles.css';
import './polish.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <Root />
    </ToastProvider>
  </React.StrictMode>,
);

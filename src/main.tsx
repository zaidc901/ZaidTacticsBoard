import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

if (window.location.pathname === '/stretfordgauntlet') {
  window.location.replace(`/stretfordgauntlet/${window.location.search}${window.location.hash}`);
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

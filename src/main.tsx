import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './app/styles/index.css';

document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

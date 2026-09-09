import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/layout.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('CueCut root element is missing');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


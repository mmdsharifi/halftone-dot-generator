import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const loadStyles = async () => {
  if (import.meta.env.DEV) {
    await import('./styles.css');
  } else {
    const styles = await import('./styles.css?inline');
    const styleEl = document.createElement('style');
    styleEl.textContent = styles.default;
    document.head.appendChild(styleEl);
  }
};

loadStyles().catch((err) => {
  console.error('Failed to load Halftone UI styles', err);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

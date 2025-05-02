import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';

// Add custom CSS for toast notifications
const customStyles = document.createElement('style');
customStyles.textContent = `
.toast-container {
  position: fixed !important;
  z-index: 9999 !important;
  pointer-events: auto !important;
}
`;
document.head.appendChild(customStyles);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-bs-theme', savedTheme);


root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

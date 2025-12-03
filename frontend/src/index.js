import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import '@fontsource/inter/900.css';

// Подавляем console.log/warn/error в production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Регистрация Service Worker для PWA
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('CURSA PWA готов к офлайн-использованию');
  },
  onUpdate: (registration) => {
    console.log('Доступна новая версия CURSA');
    // Можно показать уведомление пользователю
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/wix-madefor-display/600.css";
import "@fontsource/wix-madefor-display/700.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const shouldEnablePwa =
  process.env.NODE_ENV === "production" && process.env.REACT_APP_ENABLE_PWA === "true";

// Подавляем console.log/warn/error в production
if (process.env.NODE_ENV === "production") {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (shouldEnablePwa) {
  serviceWorkerRegistration.register({
    onSuccess: () => {
      console.log("CURSA PWA готов к офлайн-использованию");
    },
    onUpdate: () => {
      console.log("Доступна новая версия CURSA");
    },
  });
} else {
  serviceWorkerRegistration.unregister();
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

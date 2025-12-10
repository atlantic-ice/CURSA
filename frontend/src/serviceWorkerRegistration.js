/**
 * Регистрация Service Worker для PWA
 */

import { useState, useEffect } from 'react';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

/**
 * Конфигурация регистрации Service Worker
 */
export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'Приложение обслуживается Service Worker в режиме cache-first. ' +
            'Подробнее: https://cra.link/PWA'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

/**
 * Регистрация валидного Service Worker
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW Registration] Успешно зарегистрирован');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                'Доступен новый контент. Он будет использован после закрытия всех вкладок.'
              );

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Контент закэширован для офлайн-использования.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Ошибка при регистрации Service Worker:', error);
    });
}

/**
 * Проверка валидности Service Worker (для localhost)
 */
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Нет интернет-соединения. Приложение работает в офлайн-режиме.');
    });
}

/**
 * Отмена регистрации Service Worker
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

/**
 * Проверка наличия обновлений
 */
export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}

/**
 * Принудительное обновление Service Worker
 */
export function skipWaiting() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Очистка кэша
 */
export function clearCache() {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          resolve(true);
        }
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      );
    } else {
      resolve(false);
    }
  });
}

/**
 * Получение версии Service Worker
 */
export function getVersion() {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        if (event.data.type === 'VERSION') {
          resolve(event.data.version);
        }
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [channel.port2]
      );
    } else {
      resolve(null);
    }
  });
}

/**
 * Хук для React-компонентов: статус Service Worker
 */
export function useSWStatus() {
  const [status, setStatus] = useState({
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    version: null,
  });

  useEffect(() => {
    const handleOnline = () => setStatus(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setStatus(s => ({ ...s, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Проверяем наличие SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setStatus(s => ({ ...s, isInstalled: true }));
        
        // Получаем версию
        getVersion().then((version) => {
          setStatus(s => ({ ...s, version }));
        });
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}

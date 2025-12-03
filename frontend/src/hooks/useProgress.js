/**
 * useProgress - React хук для отслеживания прогресса обработки документа через WebSocket
 * 
 * Этапы:
 * - upload (0-10%): Загрузка файла
 * - extract (10-25%): Извлечение данных
 * - check (25-50%): Проверка нормоконтроля
 * - correct (50-85%): Автоисправление
 * - report (85-95%): Генерация отчёта
 * - complete (100%): Готово
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import logger from '../utils/logger';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * @typedef {Object} ProgressState
 * @property {string} stage - Текущий этап
 * @property {number} progress - Общий прогресс (0-100)
 * @property {string} message - Сообщение о текущем действии
 * @property {boolean} isConnected - Подключен ли WebSocket
 * @property {boolean} isComplete - Завершена ли обработка
 * @property {boolean} hasError - Произошла ли ошибка
 */

/**
 * Хук для отслеживания прогресса обработки документа
 * 
 * @param {string} sessionId - Уникальный ID сессии обработки
 * @returns {ProgressState} Состояние прогресса
 * 
 * @example
 * const { progress, message, isComplete } = useProgress(sessionId);
 */
export function useProgress(sessionId) {
  const [state, setState] = useState({
    stage: '',
    progress: 0,
    message: '',
    subProgress: 0,
    isConnected: false,
    isComplete: false,
    hasError: false
  });
  
  const socketRef = useRef(null);
  
  useEffect(() => {
    if (!sessionId) {
      return;
    }
    
    // Подключаемся к WebSocket
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      logger.info('WebSocket connected');
      setState(prev => ({ ...prev, isConnected: true }));
      
      // Присоединяемся к комнате сессии
      socket.emit('join', sessionId);
    });
    
    socket.on('disconnect', () => {
      logger.info('WebSocket disconnected');
      setState(prev => ({ ...prev, isConnected: false }));
    });
    
    socket.on('connect_error', (error) => {
      logger.warn('WebSocket connection error:', error.message);
    });
    
    socket.on('joined', (data) => {
      logger.debug('Joined session:', data.session_id);
    });
    
    socket.on('progress', (data) => {
      logger.debug('Progress update:', data);
      
      setState(prev => ({
        ...prev,
        stage: data.stage,
        progress: data.progress,
        message: data.message,
        subProgress: data.sub_progress || 0,
        isComplete: data.stage === 'complete',
        hasError: data.stage === 'error'
      }));
    });
    
    // Cleanup
    return () => {
      if (socket) {
        socket.emit('leave', sessionId);
        socket.disconnect();
      }
    };
  }, [sessionId]);
  
  // Метод для ручного отключения
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);
  
  // Сброс состояния
  const reset = useCallback(() => {
    setState({
      stage: '',
      progress: 0,
      message: '',
      subProgress: 0,
      isConnected: socketRef.current?.connected || false,
      isComplete: false,
      hasError: false
    });
  }, []);
  
  return {
    ...state,
    disconnect,
    reset
  };
}

/**
 * Генерирует уникальный ID сессии
 * @returns {string} UUID сессии
 */
export function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

export default useProgress;

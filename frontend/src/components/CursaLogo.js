import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '@mui/material';

const ADDITIONS = ['4', 'CH'];

const CursaLogo = ({ fontSize = 34 }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Цвета для анимации
  const blockBgStart = isDarkMode ? '#181c24' : '#fff';
  const blockBgBlink = isDarkMode ? '#fff' : '#000';
  const blockTextStart = isDarkMode ? '#ffffff' : '#000';
  const blockTextBlink = isDarkMode ? '#000' : '#fff';

  // letterSpacing для одной буквы
  const letterSpacing = 1;

  // --- Анимация дописывания ---
  const [addition, setAddition] = useState(''); // '4' | 'CH' | ''
  const [additionIndex, setAdditionIndex] = useState(0);
  const [showing, setShowing] = useState(false);
  const [typed, setTyped] = useState([]); // массив видимых дописанных букв
  const timers = useRef([]);

  useEffect(() => {
    let showTimeout, hideTimeout;
    const trigger = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setTyped([]);
      const current = ADDITIONS[additionIndex % ADDITIONS.length];
      setAddition(current);
      setShowing(true);
      // Появление по одной букве
      if (current.length > 0) {
        for (let i = 0; i < current.length; i++) {
          timers.current.push(setTimeout(() => {
            setTyped((prev) => [...prev, current[i]]);
          }, 200 + i * 180));
        }
      }
      // Через 4 секунды начинаем стирать по одной
      hideTimeout = setTimeout(() => {
        if (current.length > 0) {
          for (let i = current.length - 1; i >= 0; i--) {
            timers.current.push(setTimeout(() => {
              setTyped((prev) => prev.slice(0, -1));
            }, (current.length - 1 - i) * 160));
          }
        }
        // Через чуть больше времени полностью убираем
        timers.current.push(setTimeout(() => {
          setShowing(false);
          setAddition('');
          setAdditionIndex((i) => i + 1);
        }, 400 + current.length * 180));
      }, 4000);
    };
    // Первый запуск через 15 секунд
    showTimeout = setTimeout(trigger, 15000);
    // Затем каждые 15 секунд
    const interval = setInterval(trigger, 15000);
    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      timers.current.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [additionIndex]);

  // Формируем массив букв: C U R S A [дописанные]
  const base = ['C', 'U', 'R', 'S', 'A'];
  const allLetters = [...base, ...typed];

  // Цвет курсора в зависимости от темы
  const cursorColor = isDarkMode ? '#fff' : '#000';

  return (
    <span style={{
      display: 'flex',
      alignItems: 'center',
      fontFamily: 'Montserrat, Inter, Arial, sans-serif',
      fontWeight: 900,
      letterSpacing: letterSpacing,
      fontSize,
      userSelect: 'none',
      lineHeight: 1.1
    }}>
      {allLetters.map((char, idx) => (
        <span
          key={idx}
          style={{
            color: isDarkMode ? '#fff' : '#000',
            letterSpacing: letterSpacing,
            fontFamily: 'Montserrat, Inter, Arial, sans-serif',
            fontWeight: 900,
            fontSize,
            userSelect: 'none',
            lineHeight: 1.1,
            transition: 'opacity 0.2s',
            opacity: 1,
          }}
        >
          {char}
        </span>
      ))}
      {/* Классический мигающий курсор */}
      <span
        className="cursa-cursor-bar"
        style={{
          display: 'inline-block',
          width: Math.max(2, fontSize * 0.08),
          height: fontSize * 1.05,
          background: cursorColor,
          marginLeft: 2,
          borderRadius: 1,
          verticalAlign: 'middle',
        }}
      >
        <style>{`
          .cursa-cursor-bar {
            animation: blink-bar 1s steps(1) infinite;
          }
          @keyframes blink-bar {
            0%, 60% { opacity: 1; }
            61%, 100% { opacity: 0; }
          }
        `}</style>
      </span>
    </span>
  );
};

export default CursaLogo; 
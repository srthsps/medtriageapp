import { Colors } from '@/constants/theme'; // We will define this next
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';

export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  theme: Colors.light,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load saved preference
    AsyncStorage.getItem('theme').then(val => { if (val === 'dark') setIsDark(true); });
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const newVal = !prev;
      AsyncStorage.setItem('theme', newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Define your Colors object here or import it if you have it elsewhere
export const ThemeColors = {
  light: { background: '#f8f9fa', card: '#ffffff', text: '#333333', subText: '#666666', primary: '#1a237e', tint: '#2196f3', border: '#eeeeee', success: '#4caf50', danger: '#ff4444' },
  dark: { background: '#121212', card: '#1e1e1e', text: '#ffffff', subText: '#aaaaaa', primary: '#8c9eff', tint: '#90caf9', border: '#333333', success: '#81c784', danger: '#e57373' }
};
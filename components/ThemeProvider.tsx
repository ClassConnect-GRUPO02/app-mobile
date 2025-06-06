import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { paperTheme } from '../theme/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <PaperProvider theme={paperTheme}>
      {children}
    </PaperProvider>
  );
}; 
import { MD3LightTheme } from 'react-native-paper';

// Paleta de colores
export const colors = {
  primary: {
    main: '#7F3DFF',
    light: '#f8f5ff',
    dark: '#5B2BBF',
  },
  status: {
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FFC107',
    info: '#2196F3',
  },
  background: {
    default: '#FFFFFF',
    paper: '#F5F5F5',
    dark: '#2B2B3C',
  },
  text: {
    primary: '#2B2B3C',
    secondary: '#666666',
    disabled: '#9E9E9E',
  },
  border: {
    light: '#E0E0E0',
    main: '#7F3DFF',
  },
  chip: {
    background: '#f8f5ff',
    border: '#7F3DFF',
  }
};

// Tipografía
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 40,
  },
};

// Espaciado
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Formas
export const shape = {
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  borderWidth: {
    thin: 1,
    medium: 2,
    thick: 3,
  },
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

// Componentes
export const components = {
  button: {
    height: {
      small: 36,
      medium: 48,
      large: 56,
    },
    borderRadius: shape.borderRadius.md,
  },
  input: {
    height: 48,
    borderRadius: shape.borderRadius.md,
  },
  card: {
    borderRadius: shape.borderRadius.lg,
    padding: spacing.md,
  },
  chip: {
    height: 32,
    borderRadius: shape.borderRadius.xl,
  },
};

// Estilos comunes
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  card: {
    backgroundColor: colors.background.paper,
    borderRadius: shape.borderRadius.lg,
    padding: spacing.md,
    ...shape.shadow.small,
  },
  button: {
    primary: {
      backgroundColor: colors.primary.main,
      borderRadius: shape.borderRadius.md,
      paddingVertical: spacing.sm,
    },
    secondary: {
      backgroundColor: colors.background.default,
      borderColor: colors.primary.main,
      borderWidth: shape.borderWidth.thin,
      borderRadius: shape.borderRadius.md,
      paddingVertical: spacing.sm,
    },
  },
  input: {
    backgroundColor: colors.background.default,
    borderRadius: shape.borderRadius.md,
    borderColor: colors.border.light,
  },
  chip: {
    backgroundColor: colors.chip.background,
    borderColor: colors.chip.border,
    borderRadius: shape.borderRadius.xl,
  },
  text: {
    title: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
    },
    subtitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.primary,
    },
    body: {
      fontSize: typography.fontSize.md,
      color: colors.text.primary,
    },
    caption: {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
    },
  },
};

// Tema de React Native Paper
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary.main,
    onPrimary: '#FFFFFF',
    primaryContainer: colors.primary.light,
    onPrimaryContainer: colors.primary.dark,
    secondary: colors.primary.dark,
    onSecondary: '#FFFFFF',
    secondaryContainer: colors.primary.light,
    onSecondaryContainer: colors.primary.dark,
    tertiary: colors.primary.main,
    onTertiary: '#FFFFFF',
    tertiaryContainer: colors.primary.light,
    onTertiaryContainer: colors.primary.dark,
    error: colors.status.error,
    onError: '#FFFFFF',
    errorContainer: '#FFEBEE',
    onErrorContainer: colors.status.error,
    background: colors.background.default,
    onBackground: colors.text.primary,
    surface: colors.background.paper,
    onSurface: colors.text.primary,
    surfaceVariant: colors.background.paper,
    onSurfaceVariant: colors.text.secondary,
    outline: colors.border.light,
    outlineVariant: colors.border.light,
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: colors.background.dark,
    inverseOnSurface: '#FFFFFF',
    inversePrimary: colors.primary.light,
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
  dark: false, // Forzar tema claro
  roundness: shape.borderRadius.md,
  animation: {
    scale: 1.0,
  },
}; 
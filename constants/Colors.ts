/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Paleta de colores de la aplicación con identidad violeta
 * Los colores son consistentes independientemente del tema del dispositivo
 */

// Paleta principal violeta
const violetPrimary = '#7C3AED'; // Violeta principal
const violetLight = '#A855F7';   // Violeta claro
const violetDark = '#5B21B6';    // Violeta oscuro
const violetSoft = '#F3E8FF';    // Violeta muy suave para fondos

// Colores neutros
const white = '#FFFFFF';
const lightGray = '#F8FAFC';
const mediumGray = '#64748B';
const darkGray = '#334155';
const textDark = '#1E293B';

export const AppColors = {
  // Colores principales
  primary: violetPrimary,
  primaryLight: violetLight,
  primaryDark: violetDark,
  primarySoft: violetSoft,
  
  // Fondos
  background: white,
  backgroundSecondary: lightGray,
  backgroundSoft: violetSoft,
  
  // Textos
  text: textDark,
  textSecondary: mediumGray,
  textOnPrimary: white,
  
  // Elementos de UI
  surface: white,
  border: '#E2E8F0',
  divider: '#E2E8F0',
  
  // Estados
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: violetPrimary,
  
  // Iconos y navegación
  icon: mediumGray,
  iconSelected: violetPrimary,
  tabBackground: white,
  tabBorder: '#E2E8F0',
};

// Mantener la estructura antigua para compatibilidad temporal
export const Colors = {
  light: {
    text: AppColors.text,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.icon,
    tabIconDefault: AppColors.icon,
    tabIconSelected: AppColors.iconSelected,
  },
  dark: {
    // Usar los mismos colores para mantener consistencia
    text: AppColors.text,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.icon,
    tabIconDefault: AppColors.icon,
    tabIconSelected: AppColors.iconSelected,
  },
};

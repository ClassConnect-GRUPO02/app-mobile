/**
 * Hook personalizado para colores consistentes
 * Siempre usa el tema claro para mantener consistencia visual
 */

import { Colors } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // Siempre usar 'light' para mantener consistencia sin importar el tema del dispositivo
  const theme = 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

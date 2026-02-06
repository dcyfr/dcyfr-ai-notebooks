/**
 * Themes - Chart theme definitions
 */

export interface ChartTheme {
  name: string;
  background: string;
  foreground: string;
  gridColor: string;
  colors: string[];
  fontFamily: string;
}

export const themes: Record<string, ChartTheme> = {
  dcyfr: {
    name: 'dcyfr',
    background: '#0a0a0a',
    foreground: '#fafafa',
    gridColor: '#262626',
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  light: {
    name: 'light',
    background: '#ffffff',
    foreground: '#171717',
    gridColor: '#e5e5e5',
    colors: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'],
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  dark: {
    name: 'dark',
    background: '#171717',
    foreground: '#f5f5f5',
    gridColor: '#404040',
    colors: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'],
    fontFamily: 'Inter, system-ui, sans-serif',
  },
};

/**
 * Get a theme by name
 */
export function getTheme(name: string): ChartTheme {
  return themes[name] ?? themes.dcyfr;
}

/**
 * Get color for a series index from a theme
 */
export function getSeriesColor(theme: ChartTheme, index: number): string {
  return theme.colors[index % theme.colors.length];
}

/**
 * Register a custom theme
 */
export function registerTheme(theme: ChartTheme): void {
  themes[theme.name] = theme;
}

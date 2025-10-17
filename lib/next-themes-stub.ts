// Stub for next-themes if not installed
export function useTheme() {
  return {
    theme: 'system' as const,
    setTheme: (theme: string) => {},
    systemTheme: 'light' as const,
    themes: ['light', 'dark', 'system'],
  }
}

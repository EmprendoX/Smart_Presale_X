import type { TenantSettings } from "@/lib/types";

export type TenantTheme = {
  palette: {
    primary: string;
    primaryHover: string;
    primarySoft: string;
    primaryForeground: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    foreground: string;
  };
  fontFamily: string;
};

const DEFAULT_THEME: TenantTheme = {
  palette: {
    primary: "#1e3a8a",
    primaryHover: "#182c68",
    primarySoft: "#d8e1f5",
    primaryForeground: "#ffffff",
    secondary: "#10b981",
    accent: "#f97316",
    background: "#f9fafb",
    surface: "#ffffff",
    foreground: "#111827"
  },
  fontFamily: "Inter"
};

const normalizeHex = (value: string | null | undefined, fallback: string): string => {
  if (!value || typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
    return fallback;
  }
  if (trimmed.length === 4) {
    return (
      "#" +
      trimmed
        .slice(1)
        .split("")
        .map(ch => ch + ch)
        .join("")
    );
  }
  return trimmed;
};

const shadeColor = (hex: string, percent: number): string => {
  const normalized = normalizeHex(hex, hex);
  const amt = Math.round(255 * percent);
  const num = parseInt(normalized.slice(1), 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0x00ff) + amt;
  let b = (num & 0x0000ff) + amt;
  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const mixColors = (hexA: string, hexB: string, weight: number): string => {
  const colorA = normalizeHex(hexA, hexA);
  const colorB = normalizeHex(hexB, hexB);
  const w = Math.max(0, Math.min(1, weight));

  const toRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  });

  const a = toRgb(colorA);
  const b = toRgb(colorB);

  const r = Math.round(a.r * (1 - w) + b.r * w);
  const g = Math.round(a.g * (1 - w) + b.g * w);
  const bl = Math.round(a.b * (1 - w) + b.b * w);

  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
};

export function resolveTenantTheme(settings: TenantSettings | null): TenantTheme {
  if (!settings) {
    return DEFAULT_THEME;
  }

  const primary = normalizeHex(settings.primaryColor, DEFAULT_THEME.palette.primary);
  const background = normalizeHex(settings.backgroundColor, DEFAULT_THEME.palette.background);
  const surface = normalizeHex(settings.surfaceColor, DEFAULT_THEME.palette.surface);

  return {
    palette: {
      primary,
      primaryHover: shadeColor(primary, -0.12),
      primarySoft: mixColors(primary, background, 0.85),
      primaryForeground: normalizeHex(
        settings.primaryColorForeground,
        DEFAULT_THEME.palette.primaryForeground
      ),
      secondary: normalizeHex(settings.secondaryColor, DEFAULT_THEME.palette.secondary),
      accent: normalizeHex(settings.accentColor, DEFAULT_THEME.palette.accent),
      background,
      surface,
      foreground: normalizeHex(settings.foregroundColor, DEFAULT_THEME.palette.foreground)
    },
    fontFamily: settings.fontFamily?.trim() || DEFAULT_THEME.fontFamily
  };
}

export function buildCssVariables(theme: TenantTheme): Record<string, string> {
  return {
    "--tenant-primary": theme.palette.primary,
    "--tenant-primary-hover": theme.palette.primaryHover,
    "--tenant-primary-soft": theme.palette.primarySoft,
    "--tenant-primary-contrast": theme.palette.primaryForeground,
    "--tenant-secondary": theme.palette.secondary,
    "--tenant-accent": theme.palette.accent,
    "--tenant-background": theme.palette.background,
    "--tenant-surface": theme.palette.surface,
    "--tenant-foreground": theme.palette.foreground,
    "--tenant-font-family": theme.fontFamily
  };
}

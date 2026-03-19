import { createTheme } from '@mui/material/styles';

/**
 * Design System 2026 — Compact Professional Theme
 * 
 * Inspired by: Linear, Vercel, Stripe
 * Font: Geist Sans
 * Philosophy: Information density, speed, professionalism
 */

// Geist font family (подключается в index.html или main.tsx)
const geistFontFamily = '"Geist Sans", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const theme = createTheme({
  // === PALETTE ===
  palette: {
    primary: {
      main: '#08A6A5',
      light: 'rgba(8, 166, 165, 0.08)',
      dark: '#079392',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E83866',
      light: 'rgba(232, 56, 102, 0.08)',
      dark: '#D42F5A',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#22C55E',
      light: 'rgba(34, 197, 94, 0.08)',
      dark: '#16A34A',
    },
    warning: {
      main: '#F59E0B',
      light: 'rgba(245, 158, 11, 0.08)',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: 'rgba(239, 68, 68, 0.08)',
      dark: '#DC2626',
    },
    info: {
      main: '#3B82F6',
      light: 'rgba(59, 130, 246, 0.08)',
      dark: '#2563EB',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },

  // === TYPOGRAPHY ===
  typography: {
    fontFamily: geistFontFamily,
    fontSize: 14,
    // Headings
    h1: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 },
    // Body — адаптивно через responsive в компонентах
    body1: { fontSize: '0.875rem', lineHeight: 1.5 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4, color: 'rgba(0, 0, 0, 0.6)' },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
    button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' },
  },

  // === SHAPE ===
  shape: {
    borderRadius: 8,
  },

  // === SPACING ===
  spacing: 8,

  // === TRANSITIONS ===
  transitions: {
    duration: {
      shortest: 100,
      shorter: 150,
      short: 200,
      standard: 250,
      complex: 300,
    },
    easing: {
      easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)', // Linear-style
    },
  },

  // === COMPONENTS ===
  components: {
    // --- BASE ---
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '2px solid #08A6A5',
            outlineOffset: 2,
          },
        },
      },
    },

    // --- BUTTONS ---
    MuiButton: {
      defaultProps: {
        size: 'small',
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
        sizeMedium: {
          padding: '8px 16px',
          fontSize: '0.875rem',
        },
        sizeLarge: {
          padding: '10px 20px',
          fontSize: '0.9375rem',
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },

    MuiIconButton: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },

    MuiFab: {
      defaultProps: {
        size: 'small',
      },
    },

    // --- INPUTS ---
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.23)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1,
          },
        },
        input: {
          '&::placeholder': {
            fontSize: '0.875rem',
            opacity: 0.6,
          },
        },
        inputSizeSmall: {
          padding: '8px 12px',
          // 16px для iOS — предотвращает auto-zoom
          fontSize: '1rem',
          '@media (min-width: 600px)': {
            fontSize: '0.875rem',
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        sizeSmall: {
          fontSize: '0.875rem',
        },
      },
    },

    MuiFormControl: {
      defaultProps: {
        size: 'small',
      },
    },

    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    MuiAutocomplete: {
      defaultProps: {
        size: 'small',
      },
    },

    // --- TABLES ---
    MuiTable: {
      defaultProps: {
        size: 'small',
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.06)',
        },
        sizeSmall: {
          padding: '8px 12px',
          fontSize: '0.8125rem',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 100ms',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
        },
      },
    },

    // --- LISTS ---
    MuiListItem: {
      defaultProps: {
        dense: true,
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          transition: 'all 100ms',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },

    MuiMenuItem: {
      defaultProps: {
        dense: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 4,
          margin: '2px 4px',
          fontSize: '0.875rem',
          minHeight: 36,
          transition: 'background-color 100ms',
        },
      },
    },

    // --- TOOLBAR ---
    MuiToolbar: {
      defaultProps: {
        variant: 'dense',
      },
      styleOverrides: {
        dense: {
          minHeight: 48,
        },
      },
    },

    // --- CARDS & CONTAINERS ---
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.06)',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06)',
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.06)',
          transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 16,
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 600,
          padding: '16px 20px',
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '8px 20px 16px',
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 20px 16px',
        },
      },
    },

    // --- ALERTS ---
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.8125rem',
        },
        standardSuccess: {
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          color: '#16A34A',
        },
        standardError: {
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          color: '#DC2626',
        },
        standardWarning: {
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          color: '#D97706',
        },
        standardInfo: {
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          color: '#2563EB',
        },
      },
    },

    // --- CHIPS ---
    MuiChip: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        sizeSmall: {
          height: 24,
        },
      },
    },

    // --- TABS ---
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: 40,
          padding: '8px 16px',
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
        indicator: {
          height: 2,
          borderRadius: 1,
        },
      },
    },

    // --- TOOLTIPS ---
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 6,
          padding: '6px 10px',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
        },
      },
    },

    // --- BADGES ---
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: '0.6875rem',
          fontWeight: 600,
        },
      },
    },

    // --- AVATARS ---
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      },
    },

    // --- SKELETON ---
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },

    // --- BREADCRUMBS ---
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
        },
      },
    },

    // --- PAGINATION ---
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.8125rem',
        },
      },
    },
  },
});

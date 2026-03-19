/**
 * Общие стили и константы для styled-components
 */
import { css, keyframes } from '@mui/material/styles';

// Анимации
const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const fadeOut = keyframes`
  0% { opacity: 1; }
  100% { opacity: 0; }
`;

const slideUp = keyframes`
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

// CSS миксины для анимаций
export const FADE_IN_ANIMATION = css`
  animation: ${fadeIn} 280ms cubic-bezier(0.4, 0, 0.2, 1);
`;

export const FADE_OUT_ANIMATION = css`
  animation: ${fadeOut} 280ms cubic-bezier(0.4, 0, 0.2, 1);
`;

export const SLIDE_UP_ANIMATION = css`
  animation: ${slideUp} 280ms cubic-bezier(0.4, 0, 0.2, 1);
`;

// Easing функции
export const EASING = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
};

// Media queries
export const CUSTOM_MEDIA = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  notMobile: '(min-width: 769px)',
  notDesktop: '(max-width: 1024px)',
};

// Breakpoints в пикселях (для JS логики)
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

// Z-index слои
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
};

// Тени
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// Цвета фона
export const BG_COLORS = {
  overlay: 'rgba(255, 255, 255, 0.7)',
  overlayDark: 'rgba(0, 0, 0, 0.5)',
  table: '#f9f9f9',
  hover: 'rgba(0, 0, 0, 0.04)',
};

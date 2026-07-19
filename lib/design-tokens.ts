/**
 * Conversa Design Tokens
 *
 * Centralized motion, color, and spacing constants for use in TypeScript components.
 * CSS custom properties handle theming (light/dark); these tokens handle
 * programmatic values (Framer Motion springs, Lottie configs, etc.)
 */

export const motion = {
  spring: { stiffness: 260, damping: 20, mass: 1 },
  springGentle: { stiffness: 120, damping: 14, mass: 0.8 },
  springSnappy: { stiffness: 400, damping: 30, mass: 0.8 },
  easeOut: [0.16, 1, 0.3, 1] as const,
  duration: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    page: 0.4,
  },
  stagger: {
    fast: 0.03,
    normal: 0.06,
    slow: 0.1,
  },
} as const;

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: motion.duration.page, ease: motion.easeOut },
} as const;

export const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * motion.stagger.normal,
      duration: motion.duration.normal,
      ease: motion.easeOut,
    },
  }),
} as const;

export const sidebarWidths = {
  expanded: 260,
  collapsed: 68,
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

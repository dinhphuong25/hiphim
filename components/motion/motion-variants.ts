import type { Variants, Transition } from "framer-motion";

/**
 * Spring Physics Configuration Constants
 * Tối ưu hóa 100% bằng GPU cho tần số quét 60Hz và 120Hz (ProMotion / High Refresh Rate)
 */
export const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 32,
  mass: 0.8,
};

export const SPRING_GENTLE: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 26,
  mass: 1,
};

export const SPRING_BOUNCY: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 16,
};

export const EASE_CINEMA = [0.16, 1, 0.3, 1] as const;

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: EASE_CINEMA,
    },
  },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_GENTLE,
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_SNAPPY,
  },
};

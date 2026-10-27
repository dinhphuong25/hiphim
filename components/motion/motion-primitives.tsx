"use client";

import React, { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import {
  SPRING_SNAPPY,
  SPRING_GENTLE,
  fadeInVariants,
  slideUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from "./motion-variants";
import { cn } from "@/lib/utils";

/**
 * 1. MotionFadeIn — Xuất hiện mờ dần mượt mà
 */
export const MotionFadeIn = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { delay?: number }
>(function MotionFadeIn({ children, className, delay = 0, ...props }, ref) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      variants={fadeInVariants}
      transition={{ delay }}
      className={cn("transform-gpu", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/**
 * 2. MotionSlideUp — Trượt lên phong cách điện ảnh
 */
export const MotionSlideUp = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { delay?: number }
>(function MotionSlideUp({ children, className, delay = 0, ...props }, ref) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      variants={slideUpVariants}
      transition={{ ...SPRING_GENTLE, delay }}
      className={cn("transform-gpu", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/**
 * 3. MotionCard — Thẻ phim tương tác 3D/Hover siêu mượt
 */
export const MotionCard = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { disableHover?: boolean }
>(function MotionCard({ children, className, disableHover = false, ...props }, ref) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      whileHover={
        shouldReduceMotion || disableHover
          ? undefined
          : {
              y: -6,
              scale: 1.02,
              transition: SPRING_SNAPPY,
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              scale: 0.98,
              transition: { duration: 0.1 },
            }
      }
      className={cn("transform-gpu select-none", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/**
 * 4. MotionButton — Nút bấm tactile phản hồi xúc giác
 */
export const MotionButton = forwardRef<
  HTMLButtonElement,
  HTMLMotionProps<"button">
>(function MotionButton({ children, className, ...props }, ref) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      ref={ref}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              scale: 1.04,
              transition: SPRING_SNAPPY,
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              scale: 0.95,
              transition: { duration: 0.08 },
            }
      }
      className={cn("transform-gpu will-change-transform active:outline-none", className)}
      {...props}
    >
      {children}
    </motion.button>
  );
});

/**
 * 5. MotionStagger & MotionStaggerItem — Container hiển thị danh sách tuần tự
 */
export const MotionStagger = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(function MotionStagger({ children, className, ...props }, ref) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      variants={staggerContainerVariants}
      className={cn("transform-gpu", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
});

export const MotionStaggerItem = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(function MotionStaggerItem({ children, className, ...props }, ref) {
  return (
    <motion.div
      ref={ref}
      variants={staggerItemVariants}
      className={cn("transform-gpu", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
});

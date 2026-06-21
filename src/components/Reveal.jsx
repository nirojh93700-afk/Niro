"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Apparition fluide au scroll (Framer Motion).
 * Usage : <Reveal><MaSection /></Reveal>
 * - delay : décalage en secondes (pour faire apparaître en cascade)
 * - y     : distance de montée en px (défaut 24)
 * - as    : balise rendue (défaut "div")
 * Respecte « réduire les animations » (accessibilité) : si activé, pas de mouvement.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 24,
  as = "div",
  className,
  style,
  once = true,
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    const Tag = as;
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.18, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}

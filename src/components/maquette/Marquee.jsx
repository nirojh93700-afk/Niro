"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Bandeau défilant en boucle (Framer Motion). Liste de mots-clés élégants.
 */
export default function Marquee({ items = [] }) {
  const reduce = useReducedMotion();
  const loop = [...items, ...items];

  return (
    <div className="mq-marquee">
      <motion.div
        className="mq-marquee-track"
        animate={reduce ? {} : { x: ["0%", "-50%"] }}
        transition={reduce ? {} : { duration: 22, ease: "linear", repeat: Infinity }}
      >
        {loop.map((t, i) => (
          <span key={i} className="mq-marquee-item">
            {t}
            <i className="mq-marquee-dot" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

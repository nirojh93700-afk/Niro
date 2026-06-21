"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Hero de la maquette moderne — entrée en cascade (Framer Motion).
 */
export default function MqHero({ image, productName, price }) {
  const reduce = useReducedMotion();
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.13, delayChildren: 0.1 } },
  };
  const up = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 26 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
      };
  const img = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, scale: 0.94, y: 30 },
        show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
      };

  return (
    <motion.div className="mq-hero-grid" variants={container} initial="hidden" animate="show">
      <div className="mq-hero-copy">
        <motion.span className="mq-eyebrow" variants={up}>
          Atelier français · gravure laser
        </motion.span>
        <motion.h1 className="mq-h1" variants={up}>
          L'art de graver<br />vos <em>émotions</em>
        </motion.h1>
        <motion.p className="mq-lead" variants={up}>
          Bijoux, décorations de mariage et cadeaux personnalisés, gravés à la
          main dans notre atelier. Chaque pièce raconte votre histoire.
        </motion.p>
        <motion.div className="mq-hero-cta" variants={up}>
          <Link href="/boutique" className="mq-btn mq-btn-gold">Découvrir la boutique</Link>
          <Link href="/a-propos" className="mq-btn mq-btn-ghost">Notre atelier</Link>
        </motion.div>
        <motion.div className="mq-hero-stats" variants={up}>
          <div><strong>+2 500</strong><span>créations gravées</span></div>
          <div><strong>4,9/5</strong><span>avis clients</span></div>
          <div><strong>100%</strong><span>fait en France</span></div>
        </motion.div>
      </div>

      <motion.div className="mq-hero-visual" variants={img}>
        <div className="mq-hero-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Création Niv Création" />
        </div>
        <motion.div
          className="mq-hero-tag"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={reduce ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="mq-tag-label">Best-seller</span>
          <strong>{productName}</strong>
          <span className="mq-tag-price">dès {price}</span>
        </motion.div>
        <div className="mq-hero-glow" />
      </motion.div>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Colonne gauche du hero, animée en cascade au chargement (Framer Motion).
 * Reçoit le contenu déjà résolu (défauts + réglages) depuis la page serveur.
 */
export default function HeroIntro({ hero }) {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: 0.05 },
    },
  };
  const item = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 22 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.span variants={item} className="hero-eyebrow">
        {hero.eyebrow}
      </motion.span>
      <motion.h1 variants={item}>{hero.title}</motion.h1>
      <motion.p variants={item}>{hero.text}</motion.p>
      <motion.div variants={item} className="hero-cta">
        <Link href="/boutique" className="btn btn-gold">
          {hero.cta1}
        </Link>
        <Link href="/boutique?cat=bijoux" className="btn btn-outline">
          {hero.cta2}
        </Link>
      </motion.div>
      <motion.div variants={item} className="hero-badges">
        <div className="hero-badge"><span>🇫🇷</span> Personnalisé en France</div>
        <div className="hero-badge"><span>✦</span> 100% personnalisable</div>
        <div className="hero-badge"><span>🔒</span> Paiement sécurisé</div>
      </motion.div>
    </motion.div>
  );
}

/* Atelio — interactions du site vitrine. Aucune dépendance. */

// ---- Dictionnaire de traduction FR / EN (international) ----
const I18N = {
  fr: {
    nav_how: "Comment ça marche", nav_who: "Pour qui", nav_cats: "Catégories",
    nav_app: "Application", nav_pricing: "Tarifs", nav_cta: "Commencer", nav_faq: "FAQ",
    hero_eyebrow: "Marketplace internationale · à la demande",
    hero_title: "Un objet <span class='hl'>unique</span>, créé pour vous, où que vous soyez.",
    hero_lead: "Atelio met en relation des artisans du monde entier et des clients qui veulent du sur-mesure. Configurez votre création, suivez sa fabrication en direct, recevez-la chez vous.",
    hero_cta1: "Trouver une création", hero_cta2: "Vendre mes créations",
    stat1: "marché du personnalisé (2024)", stat2: "de croissance", stat3: "de la demande Etsy est du sur-mesure",
    hero_chip: "Bijou gravé", hero_status: "En atelier · expédition sous 48 h",
    how_eyebrow: "Comment ça marche", how_title: "Du besoin à l'objet, en trois étapes",
    how_lead: "Une expérience pensée pour le sur-mesure, là où les marketplaces généralistes s'arrêtent.",
    step1_t: "Configurez", step1_p: "Choisissez une création, personnalisez-la (texte, police, couleur, photo) et visualisez le rendu en direct avant de commander.",
    step2_t: "L'artisan fabrique", step2_p: "Un créateur vérifié reçoit votre commande, valide les détails avec vous par messagerie, puis fabrique votre pièce à la main.",
    step3_t: "Suivez & recevez", step3_p: "Suivez chaque étape en temps réel — reçue, en atelier, expédiée — et recevez votre création où que vous soyez.",
    why_eyebrow: "Pourquoi Atelio", why_title: "Le spécialiste mondial de la commande personnalisée",
    why1_t: "100% sur-mesure", why1_p: "Configurateur natif avec aperçu en direct : texte, police, couleur, photo, nombre de faces gravées.",
    why2_t: "Suivi de fabrication", why2_p: "Une timeline transparente, comme un suivi de colis, mais pour la création de votre pièce.",
    why3_t: "International", why3_p: "Multilingue, multi-devises, délais et frais affichés clairement. Pensé pour le monde entier.",
    why4_t: "Artisans vérifiés", why4_p: "Sélection à la main et avis clients. La qualité prime sur la quantité.",
    why5_t: "Échange direct", why5_p: "Discutez avec le créateur avant et pendant la commande pour valider chaque détail.",
    why6_t: "Paiement sûr", why6_p: "Paiement sécurisé, fonds protégés jusqu'à l'expédition. Apple Pay, Google Pay, carte.",
    aud_eyebrow: "Pour qui", aud_title: "Deux mondes, une plateforme",
    aud_buyer_chip: "Clients", aud_buyer_t: "Offrez l'unique",
    aud_buyer_p: "Le cadeau qui a du sens : mariage, naissance, anniversaire. Vous savez exactement ce que vous recevez.",
    aud_buyer_1: "Aperçu du rendu avant de payer", aud_buyer_2: "Suivi de fabrication en notifications",
    aud_buyer_3: "Messagerie directe avec l'artisan", aud_buyer_4: "Livraison internationale suivie",
    aud_buyer_cta: "Trouver une création",
    aud_maker_chip: "Créateurs", aud_maker_t: "Vendez sans frontières",
    aud_maker_p: "Concentrez-vous sur votre métier. Atelio apporte les clients, les outils et l'international.",
    aud_maker_1: "Outils de personnalisation prêts à l'emploi", aud_maker_2: "Gestion des commandes & de l'atelier",
    aud_maker_3: "Encaissements et paiements automatisés", aud_maker_4: "Assistant IA : fiches, visuels, traduction",
    aud_maker_cta: "Devenir créateur",
    cat_eyebrow: "Catégories", cat_title: "Tout ce qui se grave, se découpe, se crée",
    cat1: "Bijoux gravés", cat2: "Mariage", cat3: "Cadeaux", cat4: "Déco bois",
    cat5: "Naissance", cat6: "Papeterie", cat7: "Cadeaux d'affaires", cat8: "Impression 3D",
    cfg_eyebrow: "Aperçu en direct", cfg_title: "Voyez votre gravure avant de commander",
    cfg_lead: "Tapez un prénom, choisissez une police : l'aperçu se met à jour instantanément. C'est ce qui rassure le client et fait la différence d'Atelio.",
    cfg_label_text: "Texte à graver", cfg_label_font: "Police",
    ph_field1: "Texte : Léa & Tom", ph_field2: "Police : Classique", ph_field3: "Couleur : Doré", ph_addcart: "Ajouter au panier · 39,90 €",
    ph_t1: "Commande reçue", ph_t2: "Validée par l'artisan", ph_t3: "En atelier", ph_t4: "Expédiée", ph_t5: "Livrée",
    app_eyebrow: "Application mobile", app_title: "Votre atelier dans la poche",
    app_lead: "Découvrez, personnalisez et suivez vos créations depuis votre téléphone. Recevez une notification à chaque étape de la fabrication.",
    app_1: "Notifications push de suivi de fabrication", app_2: "Photo à graver depuis l'appareil photo",
    app_3: "Paiement Apple Pay / Google Pay", app_4: "iOS & Android, multilingue", app_cta: "Être prévenu du lancement",
    pr_eyebrow: "Tarifs créateurs", pr_title: "Vous ne payez que quand vous vendez",
    pr_lead: "Pas de stock à porter, pas de frais cachés. Atelio se rémunère sur une commission claire.",
    pr_p1_t: "Découverte", pr_p1_sub: " / mois", pr_p1_1: "Mise en ligne gratuite", pr_p1_2: "Commission 15% par vente",
    pr_p1_3: "Outils de personnalisation", pr_p1_4: "Paiement sécurisé inclus", pr_p1_cta: "Commencer",
    pr_p2_tag: "Populaire", pr_p2_t: "Pro", pr_p2_sub: " / mois", pr_p2_1: "Commission réduite à 9%",
    pr_p2_2: "Mise en avant dans le catalogue", pr_p2_3: "Statistiques & assistant IA", pr_p2_4: "Traduction internationale auto", pr_p2_cta: "Passer Pro",
    pr_p3_t: "Maison", pr_p3_amt: "Sur devis", pr_p3_1: "Pour marques & ateliers à volume", pr_p3_2: "Commission négociée",
    pr_p3_3: "Vitrine de marque dédiée", pr_p3_4: "Accompagnement prioritaire", pr_p3_cta: "Nous contacter",
    faq_eyebrow: "Questions fréquentes", faq_title: "Tout ce qu'il faut savoir",
    faq1_q: "Comment fonctionne le suivi de fabrication ?", faq1_a: "Chaque commande passe par des étapes claires — reçue, validée, en atelier, expédiée, livrée. Vous êtes notifié à chaque changement, sur le site et dans l'application.",
    faq2_q: "Les créations personnalisées sont-elles remboursables ?", faq2_a: "Un objet fabriqué sur-mesure à votre demande n'est pas remboursable (droit de rétractation exclu). C'est pourquoi vous validez chaque détail avec l'artisan avant la fabrication.",
    faq3_q: "Puis-je vendre mes propres créations ?", faq3_a: "Oui. Créez un compte créateur, publiez vos créations avec leurs options de personnalisation, et recevez vos commandes. Vous ne payez une commission que sur les ventes.",
    faq4_q: "Atelio livre-t-il à l'international ?", faq4_a: "Oui. La plateforme est multilingue et multi-devises ; chaque créateur indique ses zones de livraison, délais et frais. Le suivi de colis est intégré.",
    faq5_q: "Quand l'application mobile sort-elle ?", faq5_a: "Le site est déjà utilisable sur mobile. Les applications iOS et Android arrivent ensuite — inscrivez-vous pour être prévenu du lancement.",
    cta_title: "Rejoignez Atelio", cta_p: "Clients, soyez les premiers informés. Créateurs, ouvrez votre atelier au monde entier. Laissez votre e-mail.",
    cta_ph: "votre@email.com", cta_btn: "Je m'inscris",
    cta_ok: "Merci ! Vous êtes inscrit. À très vite sur Atelio.", cta_err: "Veuillez entrer un e-mail valide.",
    foot_tag: "La place de marché internationale de la création personnalisée à la demande.",
    foot_explore: "Explorer", foot_makers: "Créateurs", foot_legal: "Informations",
    foot_terms: "Conditions générales", foot_privacy: "Confidentialité", foot_contact: "Contact",
    foot_rights: "Concept de marketplace. Tous droits réservés."
  },
  en: {
    nav_how: "How it works", nav_who: "For whom", nav_cats: "Categories",
    nav_app: "App", nav_pricing: "Pricing", nav_cta: "Get started", nav_faq: "FAQ",
    hero_eyebrow: "Global marketplace · on demand",
    hero_title: "A <span class='hl'>one-of-a-kind</span> piece, made for you, wherever you are.",
    hero_lead: "Atelio connects artisans worldwide with customers who want custom-made pieces. Configure your creation, follow it being made in real time, get it delivered to your door.",
    hero_cta1: "Find a creation", hero_cta2: "Sell my creations",
    stat1: "personalized market (2024)", stat2: "annual growth", stat3: "of Etsy demand is made-to-order",
    hero_chip: "Engraved jewelry", hero_status: "In the workshop · ships within 48 h",
    how_eyebrow: "How it works", how_title: "From need to object, in three steps",
    how_lead: "An experience built for custom-made, where generalist marketplaces stop.",
    step1_t: "Configure", step1_p: "Pick a creation, personalize it (text, font, color, photo) and preview the result live before ordering.",
    step2_t: "The artisan makes it", step2_p: "A verified maker receives your order, confirms the details with you by message, then crafts your piece by hand.",
    step3_t: "Track & receive", step3_p: "Follow every step in real time — received, in the workshop, shipped — and get your creation wherever you are.",
    why_eyebrow: "Why Atelio", why_title: "The world's specialist for custom-made orders",
    why1_t: "100% custom-made", why1_p: "Native configurator with live preview: text, font, color, photo, number of engraved sides.",
    why2_t: "Making progress tracking", why2_p: "A transparent timeline, like parcel tracking, but for the crafting of your piece.",
    why3_t: "International", why3_p: "Multilingual, multi-currency, clear delivery times and fees. Built for the whole world.",
    why4_t: "Verified artisans", why4_p: "Hand-picked makers and customer reviews. Quality over quantity.",
    why5_t: "Direct exchange", why5_p: "Chat with the maker before and during the order to confirm every detail.",
    why6_t: "Secure payment", why6_p: "Secure checkout, funds protected until shipping. Apple Pay, Google Pay, card.",
    aud_eyebrow: "For whom", aud_title: "Two worlds, one platform",
    aud_buyer_chip: "Buyers", aud_buyer_t: "Give the unique",
    aud_buyer_p: "A gift with meaning: wedding, birth, birthday. You know exactly what you'll receive.",
    aud_buyer_1: "Preview the result before paying", aud_buyer_2: "Making-progress push notifications",
    aud_buyer_3: "Direct messaging with the artisan", aud_buyer_4: "Tracked international delivery",
    aud_buyer_cta: "Find a creation",
    aud_maker_chip: "Makers", aud_maker_t: "Sell without borders",
    aud_maker_p: "Focus on your craft. Atelio brings the customers, the tools and the world.",
    aud_maker_1: "Ready-to-use personalization tools", aud_maker_2: "Order & workshop management",
    aud_maker_3: "Automated payouts and payments", aud_maker_4: "AI assistant: listings, visuals, translation",
    aud_maker_cta: "Become a maker",
    cat_eyebrow: "Categories", cat_title: "Everything that's engraved, cut, created",
    cat1: "Engraved jewelry", cat2: "Wedding", cat3: "Gifts", cat4: "Wood decor",
    cat5: "Newborn", cat6: "Stationery", cat7: "Corporate gifts", cat8: "3D printing",
    cfg_eyebrow: "Live preview", cfg_title: "See your engraving before you order",
    cfg_lead: "Type a name, pick a font: the preview updates instantly. That's what reassures the customer and sets Atelio apart.",
    cfg_label_text: "Text to engrave", cfg_label_font: "Font",
    ph_field1: "Text: Léa & Tom", ph_field2: "Font: Classic", ph_field3: "Color: Gold", ph_addcart: "Add to cart · €39.90",
    ph_t1: "Order received", ph_t2: "Confirmed by maker", ph_t3: "In the workshop", ph_t4: "Shipped", ph_t5: "Delivered",
    app_eyebrow: "Mobile app", app_title: "Your workshop in your pocket",
    app_lead: "Discover, personalize and track your creations from your phone. Get a notification at every step of the making.",
    app_1: "Making-progress push notifications", app_2: "Photo to engrave from your camera",
    app_3: "Apple Pay / Google Pay checkout", app_4: "iOS & Android, multilingual", app_cta: "Notify me at launch",
    pr_eyebrow: "Maker pricing", pr_title: "You only pay when you sell",
    pr_lead: "No stock to carry, no hidden fees. Atelio earns a clear commission.",
    pr_p1_t: "Starter", pr_p1_sub: " / month", pr_p1_1: "Free listings", pr_p1_2: "15% commission per sale",
    pr_p1_3: "Personalization tools", pr_p1_4: "Secure payment included", pr_p1_cta: "Get started",
    pr_p2_tag: "Popular", pr_p2_t: "Pro", pr_p2_sub: " / month", pr_p2_1: "Lower 9% commission",
    pr_p2_2: "Featured in the catalog", pr_p2_3: "Analytics & AI assistant", pr_p2_4: "Auto international translation", pr_p2_cta: "Go Pro",
    pr_p3_t: "Maison", pr_p3_amt: "Custom", pr_p3_1: "For high-volume brands & studios", pr_p3_2: "Negotiated commission",
    pr_p3_3: "Dedicated brand storefront", pr_p3_4: "Priority support", pr_p3_cta: "Contact us",
    faq_eyebrow: "Frequently asked", faq_title: "Everything you need to know",
    faq1_q: "How does making-progress tracking work?", faq1_a: "Every order goes through clear steps — received, confirmed, in the workshop, shipped, delivered. You're notified at each change, on the site and in the app.",
    faq2_q: "Are custom-made creations refundable?", faq2_a: "An item made to order for you is not refundable (right of withdrawal excluded). That's why you confirm every detail with the artisan before making begins.",
    faq3_q: "Can I sell my own creations?", faq3_a: "Yes. Create a maker account, publish your creations with their personalization options, and receive your orders. You only pay a commission on sales.",
    faq4_q: "Does Atelio ship internationally?", faq4_a: "Yes. The platform is multilingual and multi-currency; each maker sets their delivery zones, times and fees. Parcel tracking is built in.",
    faq5_q: "When is the mobile app coming?", faq5_a: "The site already works on mobile. The iOS and Android apps come next — sign up to be notified at launch.",
    cta_title: "Join Atelio", cta_p: "Buyers, be the first to know. Makers, open your workshop to the world. Leave your email.",
    cta_ph: "your@email.com", cta_btn: "Sign me up",
    cta_ok: "Thanks! You're in. See you soon on Atelio.", cta_err: "Please enter a valid email.",
    foot_tag: "The global marketplace for custom-made creations on demand.",
    foot_explore: "Explore", foot_makers: "Makers", foot_legal: "Information",
    foot_terms: "Terms", foot_privacy: "Privacy", foot_contact: "Contact",
    foot_rights: "Marketplace concept. All rights reserved."
  }
};

let currentLang = "fr";

function applyLang(lang) {
  currentLang = lang;
  const dict = I18N[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] != null) el.innerHTML = dict[key];
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const key = el.getAttribute("data-i18n-ph");
    if (dict[key] != null) el.setAttribute("placeholder", dict[key]);
  });
  document.querySelectorAll("#lang button").forEach(b =>
    b.classList.toggle("active", b.getAttribute("data-lang") === lang));
  try { localStorage.setItem("atelio-lang", lang); } catch (e) {}
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  // Year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Language toggle (default from storage or browser)
  let saved = null;
  try { saved = localStorage.getItem("atelio-lang"); } catch (e) {}
  const initial = saved || (navigator.language && navigator.language.startsWith("en") ? "en" : "fr");
  applyLang(initial);
  document.getElementById("lang").addEventListener("click", e => {
    const b = e.target.closest("button[data-lang]");
    if (b) applyLang(b.getAttribute("data-lang"));
  });

  // Mobile menu
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  menuToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", () => navLinks.classList.remove("open")));

  // Live engraving preview
  const input = document.getElementById("engraveInput");
  const fontSel = document.getElementById("fontSelect");
  const live = document.getElementById("liveEngrave");
  const heroEngrave = document.getElementById("heroEngrave");
  function refreshEngrave() {
    const txt = (input.value || "").trim() || "Votre texte";
    live.textContent = txt;
    live.style.fontFamily = fontSel.value;
    if (heroEngrave) heroEngrave.textContent = txt;
  }
  if (input && fontSel && live) {
    input.addEventListener("input", refreshEngrave);
    fontSel.addEventListener("change", refreshEngrave);
    refreshEngrave();
  }

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  // CTA form (demo — stores locally, no backend)
  const form = document.getElementById("ctaForm");
  const msg = document.getElementById("cta-msg");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("ctaEmail").value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    msg.textContent = ok ? I18N[currentLang].cta_ok : I18N[currentLang].cta_err;
    msg.style.color = ok ? "#fff" : "#ffd9c2";
    if (ok) {
      try {
        const list = JSON.parse(localStorage.getItem("atelio-signups") || "[]");
        list.push({ email, at: new Date().toISOString() });
        localStorage.setItem("atelio-signups", JSON.stringify(list));
      } catch (e) {}
      form.reset();
    }
  });
});

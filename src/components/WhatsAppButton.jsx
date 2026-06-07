"use client";

// Bouton flottant WhatsApp (chat direct avec la boutique).
export default function WhatsAppButton() {
  const num = "33766153102"; // +33 7 66 15 31 02
  const text = encodeURIComponent("Bonjour Niv Création, j'ai une question 🙂");
  return (
    <a
      href={`https://wa.me/${num}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Nous écrire sur WhatsApp"
      title="Nous écrire sur WhatsApp"
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 60,
        width: 56, height: 56, borderRadius: "50%", background: "#25D366",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
      }}
    >
      <svg width="30" height="30" viewBox="0 0 32 32" fill="#fff" aria-hidden="true">
        <path d="M16.04 4C9.93 4 5 8.93 5 15.04c0 2.12.6 4.1 1.64 5.8L5 28l7.36-1.6a11 11 0 0 0 3.68.64h.01c6.1 0 11.04-4.93 11.04-11.04C27.09 8.93 22.15 4 16.04 4zm0 20.2h-.01a9.1 9.1 0 0 1-3.55-.72l-.25-.1-3.73.81.81-3.63-.16-.26a9.08 9.08 0 0 1-1.4-4.96c0-5.02 4.09-9.1 9.13-9.1 2.44 0 4.73.95 6.45 2.67a9.05 9.05 0 0 1 2.67 6.44c0 5.03-4.09 9.11-9.1 9.11zm5-6.82c-.27-.14-1.62-.8-1.87-.89-.25-.09-.43-.14-.62.14-.18.27-.71.89-.87 1.07-.16.18-.32.2-.59.07-.27-.14-1.16-.43-2.2-1.36-.81-.72-1.36-1.62-1.52-1.89-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.46.09-.18.05-.34-.02-.48-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47l-.53-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.94 2.96 4.7 4.15.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.62-.66 1.85-1.3.23-.64.23-1.18.16-1.3-.07-.12-.25-.18-.52-.32z"/>
      </svg>
    </a>
  );
}

"use client";

import { useState } from "react";

// Le formulaire est envoyé par le navigateur : l'adresse de l'API doit donc être
// joignable depuis la machine du visiteur. NEXT_PUBLIC_API_URL est intégrée au build
// (préfixe NEXT_PUBLIC_), avec http://localhost:4000 par défaut (redirection de port de la VM).
const API_PUBLIQUE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Formulaire de contact relié à l'API Express (POST /api/contact, étapes 46-47)
export default function Contact() {
  const [etat, setEtat] = useState({ type: "", texte: "" });
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e) {
    e.preventDefault();
    const formulaire = e.currentTarget;
    const donnees = Object.fromEntries(new FormData(formulaire));

    setEnvoi(true);
    setEtat({ type: "", texte: "" });

    try {
      const reponse = await fetch(`${API_PUBLIQUE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donnees),
      });
      const resultat = await reponse.json().catch(() => ({}));

      if (reponse.ok) {
        setEtat({ type: "ok", texte: "Message envoyé et enregistré dans PostgreSQL." });
        formulaire.reset();
      } else if (resultat.errors) {
        // Erreurs de validation Zod renvoyées par l'API (400)
        setEtat({ type: "erreur", texte: resultat.errors.map((x) => x.message).join(" · ") });
      } else {
        // 429 (rate limiting), 500…
        setEtat({ type: "erreur", texte: resultat.message || `Erreur ${reponse.status}` });
      }
    } catch {
      setEtat({ type: "erreur", texte: "Impossible de contacter l'API." });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section id="contact">
      <h2>Contact</h2>
      <p className="lead">Une question, une proposition de stage ? Écrivez-moi.</p>

      <form className="contact-form" onSubmit={envoyer}>
        <label>
          Nom
          <input name="name" autoComplete="name" required minLength={2} maxLength={50} />
        </label>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required maxLength={200} />
        </label>
        <label>
          Message
          <textarea name="message" rows={5} required minLength={10} maxLength={1000} placeholder="10 caractères minimum" />
        </label>
        <button className="btn" type="submit" disabled={envoi}>
          {envoi ? "Envoi…" : "Envoyer"}
        </button>
      </form>

      <p role="status" className={etat.type ? `form-status form-${etat.type}` : "form-status"}>
        {etat.texte}
      </p>

      <p className="meta">
        <a href="https://github.com/Amal356">github.com/Amal356</a> · Tozeur, Tunisie
      </p>
    </section>
  );
}

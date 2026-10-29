"use client";
import { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setStatus("");
    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      message: e.target.message.value,
    };
    try {
      const res = await fetch("http://localhost:4000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) { setStatus("success"); e.target.reset(); }
      else setStatus(data.errors ? data.errors.map(x => x.message).join(", ") : "Erreur");
    } catch { setStatus("Impossible de contacter l'API"); }
    finally { setLoading(false); }
  };

  return (
    <section id="contact">
      <h2>Contact</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
        <input name="name" placeholder="Votre nom" required style={{ padding: '8px', color: 'black' }} />
        <input type="email" name="email" placeholder="Votre email" required style={{ padding: '8px', color: 'black' }} />
        <textarea name="message" placeholder="Votre message (min. 10 caractères)" required style={{ padding: '8px', color: 'black' }}></textarea>
        <button type="submit" disabled={loading} style={{ padding: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}>
          {loading ? "Envoi..." : "Envoyer"}
        </button>
      </form>
      {status === "success" && <p style={{ color: 'green' }}>✅ Message enregistré dans PostgreSQL !</p>}
      {status && status !== "success" && <p style={{ color: 'red' }}>❌ {status}</p>}
    </section>
  );
}

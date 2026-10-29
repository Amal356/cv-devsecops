"use client";
import { useState } from "react";

export default function Contact() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    const formData = {
      name: e.target.name.value,
      email: e.target.email.value,
      message: e.target.message.value,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        e.target.reset();
      } else {
        setStatus(data.errors ? data.errors.map(err => err.message).join(", ") : "Erreur lors de l'envoi");
      }
    } catch (err) {
      setStatus("Impossible de contacter l'API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact">
      <h2>Contact</h2>
      <p>Une question, une proposition de stage ? Écrivez-moi.</p>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', marginTop: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <input type="text" name="name" placeholder="Votre nom" required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input type="email" name="email" placeholder="Votre email" required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <textarea name="message" placeholder="Votre message (min. 10 caractères)" required style={{ width: '100%', padding: '8px', minHeight: '100px' }}></textarea>
        </div>
        <button type="submit" disabled={loading} className="btn">
          {loading ? "Envoi..." : "Envoyer le message"}
        </button>
      </form>

      {status === "success" && <p style={{ color: 'green', marginTop: '10px' }}>Message envoyé et enregistré en base !</p>}
      {status && status !== "success" && <p style={{ color: 'red', marginTop: '10px' }}>{status}</p>}

      <p className="meta" style={{ marginTop: '20px' }}>
        <a href="https://github.com/Amal356">github.com/Amal356</a> · Tozeur, Tunisie
      </p>
    </section>
  );
}
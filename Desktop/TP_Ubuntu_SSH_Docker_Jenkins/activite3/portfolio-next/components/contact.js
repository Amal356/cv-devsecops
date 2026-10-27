'use client';

import { useState } from 'react';

export default function Contact() {
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('envoi');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      // On utilise l'URL locale de ton API
      const response = await fetch('http://localhost:4000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('succes');
        e.target.reset();
      } else {
        setStatus('erreur');
      }
    } catch (error) {
      console.error(error);
      setStatus('erreur');
    }
  };

  return (
    <section id="contact" style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '0 auto', color: '#e2e8f0' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#f8fafc' }}>Contact</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <input 
          name="name" type="text" placeholder="Votre nom" required 
          style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '1rem' }} 
        />
        <input 
          name="email" type="email" placeholder="Votre email" required 
          style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '1rem' }} 
        />
        <textarea 
          name="message" placeholder="Votre message" required rows="5" 
          style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '1rem', resize: 'vertical' }}>
        </textarea>
        
        <button 
          type="submit" disabled={status === 'envoi'} 
          style={{ padding: '0.8rem', borderRadius: '8px', border: 'none', backgroundColor: '#4ade80', color: '#0f172a', fontWeight: 'bold', fontSize: '1rem', cursor: status === 'envoi' ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
          {status === 'envoi' ? 'Envoi en cours...' : 'Envoyer'}
        </button>
      </form>

      {status === 'succes' && <p style={{ color: '#4ade80', marginTop: '1.5rem', fontWeight: 'bold' }}>✅ Message envoyé avec succès !</p>}
      {status === 'erreur' && <p style={{ color: '#f87171', marginTop: '1.5rem', fontWeight: 'bold' }}>❌ Erreur lors de l'envoi. Vérifiez que l'API est allumée.</p>}
    </section>
  );
}
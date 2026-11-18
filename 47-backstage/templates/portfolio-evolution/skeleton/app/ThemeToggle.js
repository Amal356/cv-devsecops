"use client";
// Mode sombre : bouton clair / sombre, choix mémorisé dans le navigateur
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [sombre, setSombre] = useState(false);

  useEffect(() => {
    const memorise = window.localStorage.getItem("theme");
    const prefere = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setSombre(memorise ? memorise === "sombre" : prefere);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = sombre ? "sombre" : "clair";
    window.localStorage.setItem("theme", sombre ? "sombre" : "clair");
  }, [sombre]);

  return (
    <button className="theme" onClick={() => setSombre(!sombre)} aria-label="Changer de thème">
      {sombre ? "☀️ Mode clair" : "🌙 Mode sombre"}
    </button>
  );
}

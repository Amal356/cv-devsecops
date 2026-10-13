"use client";

import Link from "next/link";

// Barre de navigation + bouton de thème clair / sombre (composant client)
export default function Header() {
  function changerTheme() {
    const root = document.documentElement;
    const sombre = getComputedStyle(root).getPropertyValue("--paper").trim() === "#0f1b17";
    const next = sombre ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  }

  return (
    <header className="nav">
      <Link className="brand" href="/">Amal Jemli</Link>
      <nav aria-label="Navigation principale">
        <Link href="/#about">About</Link>
        <Link href="/#skills">Skills</Link>
        <Link href="/#devsecops">DevSecOps</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/#experience">Experience</Link>
        <Link href="/#contact">Contact</Link>
      </nav>
      <button id="theme" type="button" aria-label="Changer de thème" onClick={changerTheme}>
        Clair / sombre
      </button>
    </header>
  );
}

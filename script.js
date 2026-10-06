// Bascule thème clair / sombre, mémorisée dans le navigateur
const root = document.documentElement;
const bouton = document.getElementById("theme");

try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
} catch (e) { /* stockage indisponible : on ignore */ }

bouton.addEventListener("click", () => {
  const sombre = getComputedStyle(root).getPropertyValue("--paper").trim() === "#0f1b17";
  const next = sombre ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
});

import Link from "next/link";

export default function About() {
  return (
    <section id="about" className="hero">
      <h1>Étudiante en Master DevOps et Cloud Computing</h1>
      <p>
        Je m&apos;appelle Amal Jemli, j&apos;étudie à l&apos;ISET Tozeur. Je construis des applications web
        (React, Next.js, Node.js, Python) et j&apos;apprends à les livrer de façon fiable : conteneurs,
       intégration continue et infrastructure automatisée. Ce portfolio est déployé automatiquement avec Ansible et Semaphore UI.
      </p>
      <p><Link className="btn" href="/projects">Voir mes projets</Link></p>
    </section>
  );
}

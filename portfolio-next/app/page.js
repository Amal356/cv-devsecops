import Skills from '../components/Skills';
import Projects from '../components/Projects';
import DevSecOpsSkills from '../components/DevSecOpsSkills';
import Contact from '../components/contact';

export default function Home() {
  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Amal Jemli</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Étudiante en Master DevOps et Cloud Computing
        </p>
      </header>

      <main>
        <Skills />
        <Projects />
        <DevSecOpsSkills />
        <Contact />
      </main>
    </div>
  );
}
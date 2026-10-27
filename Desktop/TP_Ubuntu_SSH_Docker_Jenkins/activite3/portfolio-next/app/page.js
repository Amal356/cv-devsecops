import Skills from '../components/Skills';
import Projects from '../components/Projects';
import DevSecOpsSkills from '../components/DevSecOpsSkills';
import Contact from '../components/contact'; // Attention : ici c'est 'contact.js' (minuscule)

export default function Home() {
  return (
    <main>
      <Skills />
      <Projects />
      <DevSecOpsSkills />
      
      {/* Le formulaire de contact s'affichera ici */}
      <Contact />
    </main>
  );
}
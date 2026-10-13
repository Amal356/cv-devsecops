import About from "@/components/About";
import Skills from "@/components/Skills";
import DevSecOpsSkills from "@/components/DevSecOpsSkills";
import Projects from "@/components/Projects";
import Experience from "@/components/Experience";
import Contact from "@/components/Contact";

// Page d'accueil : assemblage des composants
export default function Home() {
  return (
    <>
      <About />
      <Skills />
      <DevSecOpsSkills />
      <Projects />
      <Experience />
      <Contact />
    </>
  );
}

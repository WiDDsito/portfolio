import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { LazyMotion, domAnimation, MotionConfig, useScroll, useSpring } from "motion/react";
import * as m from "motion/react-m";
import { Projects } from "./Projects";
import { About } from "./About";
import { Scene } from "./Scene";
import { Intro } from "./Intro";
import { Contact } from "./Contact";
import "./gallery.css";

const sections = [
  ["proyectos", "Proyectos"], ["sobre-mi", "Sobre mí"],
  ["experiencia", "Experiencia 3D"], ["contacto", "Contacto"]
];

function Header() {
  const dialog = useRef(null);
  const [active, setActive] = useState(sections[0][0]);
  useEffect(() => {
    function update() {
      const section = sections.findLast(([id]) => document.getElementById(id).getBoundingClientRect().top < innerHeight * .4);
      setActive(section?.[0] ?? sections[0][0]);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const links = sections.map(([id, label]) => (
    <a key={id} href={'#' + id} aria-current={id === active ? "location" : undefined}>{label}</a>
  ));
  return (
    <>
      <header className="site-header">
        <div className="top wrap">
          <a className="brand" href="#inicio">WiDDsito<span>.</span></a>
          <nav aria-label="Navegación principal">{links}</nav>
          <button className="menu-open" type="button" aria-label="Abrir índice" aria-controls="indice"
            onClick={() => dialog.current.showModal()}><i /><i /></button>
        </div>
      </header>
      <dialog id="indice" ref={dialog} aria-label="Índice del portafolio">
        <button className="menu-close" autoFocus onClick={() => dialog.current.close()}>Cerrar</button>
        <nav aria-label="Navegación del índice" onClick={event => {
          if (event.target.closest("a")) dialog.current.close();
        }}>{links}</nav>
      </dialog>
    </>
  );
}

function trackSectionPointer(event) {
  if (event.pointerType !== "mouse" || !matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
  const section = event.target.closest("main > section");
  if (!section) return;
  const bounds = section.getBoundingClientRect();
  section.style.setProperty("--pointer-x", event.clientX - bounds.left + "px");
  section.style.setProperty("--pointer-y", event.clientY - bounds.top + "px");
}

function ExperienceTitle() {
  let index = 0;
  return (
    <h2 id="experience-title" className="scene-title" aria-label="Experiencia 3D">
      {["Experiencia", "3D."].map(word => (
        <span className="scene-title-word" key={word} aria-hidden="true">
          {Array.from(word, character => (
            <span className="scene-title-face" key={index} style={{ "--letter": index++ }}>
              <span>{character}</span>
            </span>
          ))}
        </span>
      ))}
    </h2>
  );
}

function App() {
  const [introOpen, setIntroOpen] = useState(() => !location.hash && window.scrollY < 10
    && !matchMedia("(prefers-reduced-motion: reduce)").matches);
  const finishIntro = useCallback(() => setIntroOpen(false), []);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { damping: 25, stiffness: 185 });
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
      {introOpen && <Intro onFinish={finishIntro} />}
      <m.div className="reading-progress" aria-hidden="true" style={{ scaleX: progress }} />
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <Header />
      <main id="contenido" tabIndex={-1} onPointerMove={trackSectionPointer}>
        <Projects ready={!introOpen} />
        <About />
        <section className="wrap section experience" id="experiencia" aria-labelledby="experience-title">
          <ExperienceTitle />
          <p className="scene-intro">Entra al estudio y recorre sus esculturas en 360°.</p>
          <div className="experiments" id="laboratorio"><Scene /></div>
        </section>
        <Contact />
      </main>
      <footer className="wrap bottom">
        <span>Leandro Contreras · Lima, Perú</span>
        <a className="inline" href="https://github.com/WiDDsito/WiDDsito">GitHub</a>
      </footer>
      </LazyMotion>
    </MotionConfig>
  );
}

createRoot(document.getElementById("root")).render(<App />);

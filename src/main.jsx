import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { LazyMotion, domAnimation, MotionConfig, useReducedMotion, useScroll } from "motion/react";
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
    const targets = sections.map(([id]) => document.getElementById(id));
    let observer;
    function observe() {
      observer?.disconnect();
      const visible = new Set();
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        const current = targets.findLast(section => visible.has(section));
        if (current) setActive(current.id);
      }, { rootMargin: `0px 0px -${Math.round(innerHeight * .6)}px 0px` });
      for (const target of targets) observer.observe(target);
    }
    observe();
    window.addEventListener("resize", observe);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", observe);
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

function usePointerGlow() {
  const glow = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const node = glow.current;
    const main = node.parentElement;
    let frame = 0;
    let point;

    function draw() {
      frame = 0;
      node.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
      node.dataset.tone = point.tone;
    }

    function move(event) {
      if (event.pointerType !== "mouse") return;
      const cover = event.target.closest(".project-cover");
      const section = event.target.closest("main > section");
      point = { x: event.clientX, y: event.clientY, tone: cover ? "cover" : section?.id ?? "" };
      if (!frame) frame = requestAnimationFrame(draw);
    }

    function hide() {
      cancelAnimationFrame(frame);
      frame = 0;
      node.dataset.tone = "";
    }

    main.addEventListener("pointermove", move, { passive: true });
    main.addEventListener("pointerleave", hide);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      hide();
      main.removeEventListener("pointermove", move);
      main.removeEventListener("pointerleave", hide);
      window.removeEventListener("scroll", hide);
    };
  }, [reduced]);

  return glow;
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
  const glow = usePointerGlow();
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
      {introOpen && <Intro onFinish={finishIntro} />}
      <m.div className="reading-progress" aria-hidden="true" style={{ scaleX: scrollYProgress }} />
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <Header />
      <main id="contenido" tabIndex={-1}>
        <div ref={glow} className="pointer-light" aria-hidden="true" />
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

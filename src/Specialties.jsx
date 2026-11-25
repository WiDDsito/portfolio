import { useState } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

const specialties = [
  ["Web", "Interfaces interactivas con animación y experiencias 3D.", "JavaScript · React · GSAP · Three.js"],
  ["Móvil", "Aplicaciones multiplataforma con Flutter.", "Flutter"],
  ["UX/UI", "Diseño de interfaces claras y accesibles, centradas en las personas."],
  ["IA", "Desarrollo asistido por IA. Estoy aprendiendo a orquestar flujos con múltiples agentes y herramientas.", "Claude Code · Codex · opencode"]
];

export function Specialties() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const [, description, tools] = specialties[active];
  return (
    <div className="specialties">
      {specialties.map(([label], index) => (
        <button key={label} type="button" aria-expanded={index === active} aria-controls="focus-detail"
          onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)}>
          <img src={'/media/focus-' + index + '.svg'} alt="" />{label}
        </button>
      ))}
      <div className="specialty-detail" id="focus-detail">
        <m.div key={active} initial={reduced ? false : { opacity: .25, x: 22 }}
          animate={{ opacity: 1, x: 0 }} transition={{ duration: .32 }}>
          <p>{description}</p>{tools && <p className="tech">{tools}</p>}
        </m.div>
      </div>
    </div>
  );
}

import { useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

const projects = [
  { id: "masiva", title: "MasivaHome", domain: "masivahome.com", genre: "Comercio electrónico", height: 957 },
  { id: "alex", title: "alexurresty.com", domain: "alexurresty.com", genre: "Producción audiovisual", height: 900 }
];
const ease = [.16, 1, .3, 1];
const stepDuration = .72;
const stepTimes = [0, .23, .43, .64, .83, 1];
const letterStagger = .073;
const settled = { x: 0, y: 0, rotate: 0, opacity: 1 };

function footsteps(distance, lift, turn, opacity) {
  return {
    x: [-distance, -distance * .64, -distance * .36, -distance * .14, 0, 0],
    y: [lift * .67, -lift, lift * .28, -lift * .44, lift * .11, 0],
    rotate: [-turn, turn * .67, -turn * .5, turn * .33, -turn * .17, 0],
    opacity: [opacity, 1, 1, 1, 1, 1]
  };
}

const letterSteps = footsteps(28, 18, 12, 0);
const coverIn = { clipPath: "inset(0% 100% 0% 0%)" };
const coverOpen = { clipPath: "inset(0% 0% 0% 0%)" };
const captionIn = { y: 10, opacity: 0 };
const captionOpen = { y: 0, opacity: 1 };

function Project({ item, current, index, reduced, ready }) {
  const { id, title, domain, genre, height } = item;
  const delay = .28 + index * .17;

  function updateGlow(event) {
    if (reduced || event.pointerType !== "mouse") return;
    const cover = event.currentTarget;
    const rect = cover.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    cover.style.setProperty("--glow-x", x * 100 + "%");
    cover.style.setProperty("--glow-y", y * 100 + "%");
  }

  return (
    <article className={'project project-' + id} data-current={current || undefined} id={'project-' + id}>
      <a className="project-link" href={'https://' + domain} target="_blank" rel="noopener"
        aria-labelledby={'nombre-' + id + ' accion-' + id} draggable={false}>
        <m.div className="project-cover" onPointerMove={updateGlow}
          initial={reduced ? false : coverIn}
          animate={reduced || ready ? coverOpen : undefined}
          transition={{ duration: reduced ? 0 : .92, delay, ease }}>
          <img className="project-preview" src={'/media/' + (id === "masiva" ? "masivahome" : "alexurresty") + '.webp'}
            width={1360} height={height} alt={'Vista previa de ' + title} decoding="async"
            loading={index ? "lazy" : "eager"} fetchPriority={index ? "auto" : "high"} draggable={false} />
          <div className="project-aura" aria-hidden="true" />
        </m.div>
        <m.div className="project-details"
          initial={reduced ? false : captionIn}
          animate={reduced || ready ? captionOpen : undefined}
          transition={{ duration: reduced ? 0 : .42, delay: delay + .38, ease }}>
          <h2 id={'nombre-' + id}><small>{genre}</small>{title}</h2>
          <span className="project-action" id={'accion-' + id}>Visitar sitio ↗</span>
        </m.div>
      </a>
    </article>
  );
}

function TitleDot({ ready, reduced }) {
  const dot = useRef(null);
  const [path, setPath] = useState(null);

  useLayoutEffect(() => {
    if (!ready || reduced) return;
    const node = dot.current;
    const origin = node.offsetLeft + node.offsetWidth / 2;
    const letters = [...node.parentElement.querySelectorAll(".title-piece")];
    const stops = [0, 2, 4, 6].map(index => {
      const letter = letters[index];
      return letter.offsetLeft + letter.offsetWidth / 2 - origin;
    });
    stops.push(0);
    const size = parseFloat(getComputedStyle(node).fontSize);
    const x = [stops[0]];
    const y = [-size * .72];
    for (let index = 1; index < stops.length; index++) {
      const last = index === stops.length - 1;
      x.push((stops[index - 1] + stops[index]) / 2, stops[index]);
      y.push(-size * (last ? .96 : 1.06), last ? 0 : -size * .72);
    }
    setPath({ x, y, opacity: 1 });
  }, [ready, reduced]);

  const timing = { delay: reduced ? 0 : .22, duration: reduced ? 0 : .66 };
  return (
    <m.span ref={dot} className="title-dot" aria-hidden="true"
      initial={reduced ? false : { opacity: 0 }}
      animate={reduced ? settled : path ?? undefined}
      transition={{
        x: { ...timing, ease: "linear" },
        y: { ...timing, ease: path?.y.slice(1).map((_, index) => index % 2 ? "easeIn" : "easeOut") },
        opacity: { ...timing, duration: reduced ? 0 : .09 }
      }}>.</m.span>
  );
}

export function Projects({ ready }) {
  const track = useRef(null);
  const gesture = useRef(null);
  const cancelClick = useRef(false);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const reduced = useReducedMotion();

  function go(index) {
    const target = (index + projects.length) % projects.length;
    const node = track.current;
    node.scrollTo({ left: node.children[target].offsetLeft, behavior: reduced ? "instant" : "smooth" });
  }

  function start(event) {
    cancelClick.current = false;
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    gesture.current = { x: event.clientX, left: track.current.scrollLeft, active, moved: false };
  }

  function move(event) {
    const drag = gesture.current;
    if (!drag) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) < 8) return;
    if (!drag.moved) {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.moved = true;
      setDragging(true);
    }
    track.current.scrollLeft = drag.left - delta;
  }

  function end(event) {
    const drag = gesture.current;
    gesture.current = null;
    if (!drag?.moved) return;
    setDragging(false);
    cancelClick.current = true;
    const delta = drag.x - event.clientX;
    requestAnimationFrame(() => go(Math.max(0, Math.min(projects.length - 1,
      drag.active + (Math.abs(delta) > 42 ? Math.sign(delta) : 0)))));
  }

  return (
    <section className="work section" id="proyectos" aria-labelledby="titulo-proyectos">
      <div className="wrap">
        <div className="work-heading">
          <div>
            <h1 id="titulo-proyectos" aria-label="Proyectos">
              {Array.from("Proyectos", (letter, index) => (
                <m.span className="title-piece" key={index} aria-hidden="true"
                  initial={reduced ? false : { x: -28, y: 12, rotate: -12, opacity: 0 }}
                  animate={reduced ? settled : ready ? letterSteps : undefined}
                  transition={{ duration: reduced ? 0 : stepDuration, delay: index * letterStagger, times: stepTimes }}>{letter}</m.span>
              ))}<TitleDot ready={ready} reduced={reduced} />
            </h1>
            <p className="work-subtitle">Leandro Contreras<br />Diseño y desarrollo web en Lima, Perú.</p>
          </div>
        </div>
        <div ref={track} className={dragging ? "projects dragging" : "projects"}
          id="carrusel-proyectos" role="group" aria-label="Carrusel de proyectos" aria-describedby="carousel-hint" tabIndex={0}
          onScroll={event => {
            const node = event.currentTarget;
            setActive(projects.reduce((closest, _, index) =>
              Math.abs(node.children[index].offsetLeft - node.scrollLeft)
                < Math.abs(node.children[closest].offsetLeft - node.scrollLeft) ? index : closest, 0));
          }}
          onKeyDown={event => {
            const targets = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: projects.length - 1 };
            if (!Object.hasOwn(targets, event.key) || event.altKey) return;
            event.preventDefault();
            go(targets[event.key]);
          }}
          onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
          onLostPointerCapture={end} onPointerLeave={() => { if (!gesture.current?.moved) gesture.current = null; }}
          onClickCapture={event => {
            if (cancelClick.current && event.detail > 0) event.preventDefault();
            cancelClick.current = false;
          }}>
          {projects.map((item, index) => (
            <Project key={item.id} item={item} current={active === index} index={index} reduced={reduced} ready={ready} />
          ))}
        </div>
        <p className="carousel-hint" id="carousel-hint">Desliza o arrastra para explorar los proyectos.</p>
      </div>
    </section>
  );
}

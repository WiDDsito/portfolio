import { useEffect, useRef, useState } from "react";

const columns = 8;
const rows = 4;
const pieces = Array.from({ length: columns * rows }, (_, index) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    column, row,
    x: (column - 3.5) * (9 + index % 4),
    y: (row - 1.5) * (18 + index % 9),
    turn: (index * 23) % 120 - 60
  };
});

export function Intro({ onFinish }) {
  const overlay = useRef(null);
  const [assembled, setAssembled] = useState(false);

  useEffect(() => {
    const node = overlay.current;
    let loaded = false;
    let cancelled = false;
    let progress = 0;
    let velocity = 0;
    let frame;
    let started;
    let previous;
    const cover = document.querySelector("#project-masiva img");
    Promise.allSettled([document.fonts.ready, cover?.decode()]).then(() => { loaded = true; });

    function assemble(time) {
      started ??= time;
      const elapsed = time - started;
      const step = Math.min(.03, (time - (previous ?? time)) / 1000);
      previous = time;
      const target = (loaded && elapsed >= 600) || elapsed >= 2100 ? 1 : .9;
      // Keep the velocity continuous when loading finishes.
      velocity += ((target - progress) * 42 - velocity * 13) * step;
      progress += velocity * step;
      if (target === 1 && progress > .998) {
        node.style.setProperty("--assembly", "1");
        setAssembled(true);
        return;
      }
      node.style.setProperty("--assembly", progress);
      if (!cancelled) frame = requestAnimationFrame(assemble);
    }

    frame = requestAnimationFrame(assemble);
    window.addEventListener("scroll", onFinish, { passive: true, once: true });
    window.addEventListener("focusin", onFinish, { once: true });
    window.addEventListener("pointerdown", onFinish, { once: true });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onFinish);
      window.removeEventListener("focusin", onFinish);
      window.removeEventListener("pointerdown", onFinish);
    };
  }, [onFinish]);

  return (
    <div ref={overlay} className="site-intro" data-assembled={assembled} aria-hidden="true" onAnimationEnd={event => {
      if (event.target === event.currentTarget) onFinish();
    }}>
      <svg className="intro-defs" width="0" height="0">
        <defs>
          <g id="intro-wordmark">
            <text x="247" y="88" textAnchor="middle">Leandro<tspan fill="var(--lime)">Cl</tspan></text>
          </g>
          {pieces.map(({ column, row }, index) => (
            <clipPath id={'intro-tile-' + index} key={index}>
              <rect x={column * 64} y={row * 28} width={64} height={28} />
            </clipPath>
          ))}
        </defs>
      </svg>
      {pieces.map(({ x, y, turn }, index) => (
        <svg className="intro-piece" viewBox="0 0 512 112" key={index} style={{
          "--burst-x": x + "vw", "--burst-y": y + "vh", "--burst-turn": turn + "deg"
        }}>
          <use href="#intro-wordmark" clipPath={'url(#intro-tile-' + index + ')'} />
        </svg>
      ))}
      <span className="intro-load" />
    </div>
  );
}

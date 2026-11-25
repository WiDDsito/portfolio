import { useEffect, useRef, useState } from "react";

export function Scene() {
  const figure = useRef(null);
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const node = figure.current;
    let mounted = true;
    let release;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      try {
        const { mountGalleryScene } = await import("./forma.js");
        if (mounted) release = mountGalleryScene(node);
      } catch {
        // Keep the static preview when WebGL cannot load.
      }
    }, { rootMargin: "250px" });
    observer.observe(node);

    const mute = () => {
      audio.current?.suspend();
      setPlaying(false);
    };
    const onVisibility = () => { if (document.hidden) mute(); };
    const soundObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) mute();
    });
    soundObserver.observe(node);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted = false;
      observer.disconnect();
      soundObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      release?.();
      audio.current?.close();
      audio.current = null;
    };
  }, []);

  async function toggle() {
    const wasPlaying = audio.current?.state === "running";
    if (!audio.current) {
      const context = new AudioContext();
      audio.current = context;
      for (const frequency of [110, 164.81, 220.6]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.value = .018;
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
      }
    }
    const context = audio.current;
    if (wasPlaying) await context.suspend();
    else await context.resume();
    setPlaying(context.state === "running");
  }

  return (
<figure ref={figure} className="art" data-state="fallback" aria-labelledby="titulo-forma">
          <div className="art-surface">
            <div className="art-fallback" aria-hidden="true"><i></i><i></i><i></i></div>
            <canvas width="600" height="470" aria-hidden="true"></canvas>
          </div>
          <figcaption className="scene-overlay wrap">
            <div className="scene-label">
              <span id="titulo-forma">Cinta plegada</span>
              <span className="render-label">Vista previa</span>
            </div>
            <div className="art-controls" hidden>
              <p className="art-hint">Arrastra para recorrer el estudio</p>
              <div className="view-buttons" role="group" aria-label="Modo de visualización">
                <button type="button" data-view="solid" aria-pressed="true">Sólido</button>
                <button type="button" data-view="mesh" aria-pressed="false">Malla</button>
              </div>
              <button type="button" className="ambience" aria-pressed={playing} onClick={toggle}>Sonido ambiente</button><button type="button" className="rotate">Girar 60°</button>
            </div>

          </figcaption>
        </figure>
  );
}

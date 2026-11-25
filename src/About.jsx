import { useState } from "react";
import { Specialties } from "./Specialties";

export function About() {
  const [useFallback, setUseFallback] = useState(false);

  return (
    <section className="wrap about section" id="sobre-mi" aria-labelledby="titulo-sobre-mi">
      <div className="about-grid">
        <div className="about-copy" id="perfil">
          <h2 id="titulo-sobre-mi">Sobre mí<span>.</span></h2>
          <h3>Leandro Contreras</h3>
          <p className="role">Ingeniero de software · Lima, Perú</p>
          <p>Diseño y desarrollo interfaces web y móviles. Me interesa crear experiencias interactivas con animación y 3D, y estoy aprendiendo a orquestar flujos de trabajo con IA.</p>
        </div>
        <figure className="portrait">
          <picture>
            {!useFallback && <source srcSet="/media/sobre-mi.HEIC" type="image/heic" />}
            <img onError={() => setUseFallback(true)} src="/media/leandro.webp" width="843" height="1500" alt="Leandro Contreras sentado en un estudio con iluminación azul" loading="lazy" decoding="async" />
          </picture>
        </figure>
      </div>
      <section className="focus section" id="enfoque" aria-labelledby="titulo-enfoque">
        <div className="section-heading">
          <h3 id="titulo-enfoque">En qué me enfoco</h3>
          <p>Me interesa colaborar con startups y empresas que buscan crear experiencias web interactivas, dinámicas e inmersivas.</p>
        </div>
        <Specialties />
      </section>

      </section>
  );
}

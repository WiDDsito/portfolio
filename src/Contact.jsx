import { useState } from "react";

export function Contact() {
  const [value, setValue] = useState("");
  const reply = value.trim();
  const body = encodeURIComponent("Hola, Leandro. Me gustaría conversar sobre un proyecto."
    + (reply ? "\n\nPuedes responderme en: " + reply : ""));
  return (
    <section className="wrap contact section" id="contacto" aria-labelledby="titulo-contacto">
      <div className="contact-intro">
        <h2 id="titulo-contacto">Hablemos<span>.</span></h2>
        <p>Cuéntame qué quieres construir.</p>
      </div>
      <div className="contact-panel">
        <div className="contact-field">
          <label htmlFor="reply-contact">Tu correo o número de WhatsApp</label>
          <input id="reply-contact" type="text" placeholder="nombre@ejemplo.com" maxLength={120} value={value} onChange={event => setValue(event.target.value)} aria-describedby="contact-hint" />
          <p id="contact-hint">Opcional. Se añade al mensaje que abras.</p>
        </div>
        <div className="contact-links">
          <a className="button contact-whatsapp" href={`https://wa.me/51914336382?text=${body}`}>Abrir WhatsApp</a>
          <a className="button button-quiet contact-email" href={`mailto:leandro25.cl@gmail.com?subject=Consulta%20sobre%20un%20proyecto&body=${body}`}>Abrir correo</a>
        </div>
        <p className="contact-address">914 336 382 <span aria-hidden="true">·</span> leandro25.cl@gmail.com</p>
      </div>
    </section>

  );
}

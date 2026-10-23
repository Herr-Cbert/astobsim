import { TEXTE } from "./texte";

const app = document.getElementById("app");
if (app) {
  app.innerHTML = `<h1>${TEXTE.titel}</h1><p>${TEXTE.untertitel}</p><p>${TEXTE.geruest}</p>`;
}

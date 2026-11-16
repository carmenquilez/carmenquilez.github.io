/* script.js · Portfolio Carmen Quílez
   Un solo archivo para las dos páginas. Cada bloque se activa solo si encuentra sus elementos:
   1) Título "Portfolio" (index.html)  2) Aparición al hacer scroll (index.html)  3) Galería de proyectos (proyecto.html) */

/* ===== 1) Título "Portfolio" ajustado al ancho y animado (solo index.html) ===== */
(function(){
if(!document.querySelector(".titulo")) return;
/* Ajusta el título "Portfolio" para que ocupe todo el ancho de la página.
   Los textos pequeños del hero escalan con la variable CSS --u (ver css/style.css). */
function ajustarTitulo(){
  var hero=document.querySelector('.hero'),t=document.querySelector('.titulo');
  if(!hero||!t||!hero.offsetWidth)return;
  var cs=getComputedStyle(hero),libre=hero.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
  var u=100;
  for(var i=0;i<3;i++){ // 3 pasadas para afinar el ancho
    hero.style.setProperty('--u',u+'px');
    u=u*libre/t.getBoundingClientRect().width;
  }
  hero.style.setProperty('--u',(u*0.995)+'px');
}
// Si se entra con ancla (por ejemplo index.html#proyectos), vuelve a ella cuando el título ya tiene su tamaño final
function irAlAncla(){
  if(location.hash.length>1){var t=document.querySelector(location.hash);if(t)t.scrollIntoView({behavior:'instant'});}
}
function iniciar(){ajustarTitulo();irAlAncla();}
var folioPreparado = null, folioActivo = null;   // ver "folio a mano con pluma" más abajo
addEventListener('load',iniciar);
addEventListener('resize',function(){
  if(folioActivo) folioActivo.cancelar();          // si cambia el tamaño en plena escritura, se muestra el título ya escrito
  if (folioPreparado) folioPreparado.cancelado = true;
  folioPreparado = null;                           // y las posiciones calculadas ya no valen
  ajustarTitulo();
});
addEventListener('hashchange',function(){requestAnimationFrame(ajustarTitulo)});
if(document.fonts)document.fonts.ready.then(iniciar);

/* "folio" a mano con pluma.
   Se dibuja cada letra en un lienzo con la tipografía real del título y se calcula, para cada punto de tinta,
   cuánto "camino" hay hasta él siguiendo el trazo desde donde empieza la letra. Al animar, la tinta aparece
   en ese orden: la pluma baja por el palo de la f, rodea la o, sube la l... y el punto de la i va al final.
   Todo se prepara antes de empezar a escribir "Port" y, al terminar, el lienzo se retira y queda el texto real. */
function analizarLetra(d, W, H, ch) {
  var x, y, x0 = W, y0 = H, x1 = -1;
  for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 0) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y;
  }
  if (x1 < 0) return null;
  var y1 = y0; for (y = H - 1; y >= 0; y--) { var hay = false; for (x = x0; x <= x1; x++) if (d[(y * W + x) * 4 + 3] > 0) { hay = true; break; } if (hay) { y1 = y; break; } }
  var w = x1 - x0 + 1, h = y1 - y0 + 1, n = w * h, src = new Uint8ClampedArray(n * 4), a = new Uint8Array(n), o, s;
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    s = ((y + y0) * W + x + x0) * 4; o = y * w + x;
    src[o * 4] = d[s]; src[o * 4 + 1] = d[s + 1]; src[o * 4 + 2] = d[s + 2]; src[o * 4 + 3] = d[s + 3]; a[o] = d[s + 3];
  }
  var DX = [-1, 0, 1, -1, 1, -1, 0, 1], DY = [-1, -1, -1, 0, 0, 1, 1, 1], k, i, p, q, px, py, qx, qy;
  // 1) piezas sueltas de la letra (por ejemplo, el palo y el punto de la i)
  var lab = new Int32Array(n).fill(-1), piezas = [], pila = new Int32Array(n);
  for (i = 0; i < n; i++) if (a[i] > 90 && lab[i] < 0) {
    var id = piezas.length, sp = 0, area = 0, ymin = h; pila[sp++] = i; lab[i] = id;
    while (sp) {
      p = pila[--sp]; area++; py = (p / w) | 0; px = p - py * w; if (py < ymin) ymin = py;
      for (k = 0; k < 8; k++) { qx = px + DX[k]; qy = py + DY[k]; if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue; q = qy * w + qx; if (a[q] > 90 && lab[q] < 0) { lab[q] = id; pila[sp++] = q; } }
    }
    piezas.push({ area: area, ymin: ymin, peso: Math.sqrt(area) });
  }
  var total = 0; piezas.forEach(function (c) { total += c.peso; });
  var orden = piezas.map(function (c, j) { return j; }).sort(function (u, v) { return piezas[v].area - piezas[u].area; });
  // 2) tiempo de cada punto = camino recorrido desde el punto más alto de su pieza (donde apoya la pluma)
  var t = new Float32Array(n).fill(-1), dist = new Int32Array(n), cola = new Int32Array(n), desde = 0;
  orden.forEach(function (idp, pos) {
    var c = piezas[idp], parte = c.peso / total, sy = c.ymin, xs = [];
    for (x = 0; x < w; x++) if (lab[sy * w + x] === idp) xs.push(x);
    var sx = xs[(xs.length / 2) | 0], corte = null;
    if (ch === 'o' && pos === 0) {                  // la o se escribe en un solo sentido: se corta el aro junto al inicio y se cierra al final
      corte = new Uint8Array(n);
      var an = Math.max(2, Math.round(w * 0.014)), al = Math.round(h * 0.2);
      for (y = sy; y <= Math.min(h - 1, sy + al); y++) for (x = sx + 2; x <= sx + 1 + an && x < w; x++) if (lab[y * w + x] === idp) corte[y * w + x] = 1;
    }
    dist.fill(-1); var qh = 0, qt = 0, maxd = 1; cola[qt++] = sy * w + sx; dist[cola[0]] = 0;
    while (qh < qt) {
      p = cola[qh++]; py = (p / w) | 0; px = p - py * w;
      for (k = 0; k < 8; k++) {
        qx = px + DX[k]; qy = py + DY[k]; if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue; q = qy * w + qx;
        if (lab[q] === idp && dist[q] < 0 && !(corte && corte[q])) { dist[q] = dist[p] + 1; if (dist[q] > maxd) maxd = dist[q]; cola[qt++] = q; }
      }
    }
    for (i = 0; i < n; i++) if (lab[i] === idp) t[i] = desde + parte * (dist[i] >= 0 ? dist[i] / maxd : 1);
    desde += parte;
  });
  // 3) el borde suavizado hereda el tiempo del punto de tinta más cercano
  for (var vuelta = 0; vuelta < 3; vuelta++) {
    var cambios = [];
    for (i = 0; i < n; i++) if (a[i] > 0 && t[i] < 0) {
      py = (i / w) | 0; px = i - py * w; var mejor = 2;
      for (k = 0; k < 8; k++) { qx = px + DX[k]; qy = py + DY[k]; if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue; q = qy * w + qx; if (t[q] >= 0 && t[q] < mejor) mejor = t[q]; }
      if (mejor < 2) cambios.push(i, mejor);
    }
    for (i = 0; i < cambios.length; i += 2) t[cambios[i]] = cambios[i + 1];
  }
  // 4) puntos ordenados por tiempo en "cajones" para destaparlos rápido en cada fotograma
  var B = 240, ini = new Int32Array(B + 1), cub = new Int32Array(n);
  for (i = 0; i < n; i++) { cub[i] = -1; if (a[i] > 0) { var b = t[i] < 0 ? B - 1 : Math.min(B - 1, (t[i] * B) | 0); cub[i] = b; ini[b + 1]++; } }
  for (i = 0; i < B; i++) ini[i + 1] += ini[i];
  var pos2 = ini.slice(0, B), idx = new Int32Array(ini[B]);
  for (i = 0; i < n; i++) if (cub[i] >= 0) idx[pos2[cub[i]]++] = i;
  var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  return { px: x0, py: y0, w: w, h: h, src: src, B: B, ini: ini, idx: idx, out: new ImageData(w, h), hecho: 0, cv: cv, ctx: cv.getContext('2d') };
}

function prepararFolio() {
  var titulo = document.querySelector('.titulo'), spans = titulo && titulo.querySelectorAll('.folio .f');
  if (!spans || !spans.length || !document.createElement('canvas').getContext) return null;
  var dpr = Math.min(window.devicePixelRatio || 1, 2), tr = titulo.getBoundingClientRect(), cs = getComputedStyle(spans[0]);
  var fs = parseFloat(cs.fontSize), mx = Math.round(fs * 0.3), my = Math.round(fs * 0.25);
  var cw = Math.ceil(tr.width + mx + fs * 0.06), ch = Math.ceil(tr.height + my + fs * 0.5);   // margen derecho corto para que el lienzo no ensanche la página
  var lienzo = document.createElement('canvas');
  lienzo.width = Math.round(cw * dpr); lienzo.height = Math.round(ch * dpr); lienzo.setAttribute('aria-hidden', 'true');
  lienzo.style.cssText = 'position:absolute;pointer-events:none;left:' + (-mx) + 'px;top:' + (-my) + 'px;width:' + cw + 'px;height:' + ch + 'px';
  var borrador = document.createElement('canvas'); borrador.width = lienzo.width; borrador.height = lienzo.height;
  var bctx = borrador.getContext('2d', { willReadFrequently: true });
  bctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + (fs * dpr) + 'px ' + cs.fontFamily;
  bctx.fillStyle = getComputedStyle(titulo).color; bctx.textBaseline = 'alphabetic';
  // posiciones de cada letra (se leen ahora, antes de que nada se mueva)
  var cajas = Array.prototype.map.call(spans, function (sp) { var r = sp.getBoundingClientRect(); return { car: sp.textContent, l: r.left - tr.left + mx, t: r.top - tr.top + my, w: r.width, h: r.height }; });
  var F = { lienzo: lienzo, letras: cajas.map(function () { return null; }), listo: false };
  var k = 0;
  function siguiente() {                             // una letra por turno, para no bloquear la página
    if (F.cancelado) return;
    var c = cajas[k];
    var rx = Math.max(0, Math.floor((c.l - fs * 0.35) * dpr)), ry = Math.max(0, Math.floor((c.t - fs * 0.3) * dpr));
    var rw = Math.min(borrador.width - rx, Math.ceil((c.w + fs * 0.85) * dpr)), rh = Math.min(borrador.height - ry, Math.ceil((c.h + fs * 0.9) * dpr));
    bctx.clearRect(rx, ry, rw, rh);
    bctx.save(); bctx.beginPath(); bctx.rect(rx, ry, rw, rh); bctx.clip();
    var asc = bctx.measureText(c.car).fontBoundingBoxAscent || fs * dpr * 0.8;
    bctx.fillText(c.car, c.l * dpr, c.t * dpr + asc);
    bctx.restore();
    var L = analizarLetra(bctx.getImageData(rx, ry, rw, rh).data, rw, rh, c.car);
    if (L) { L.px += rx; L.py += ry; }
    F.letras[k] = L; k++;
    if (k < cajas.length) setTimeout(siguiente, 0); else F.listo = true;
  }
  setTimeout(siguiente, 0);
  return F;
}

// Efecto máquina de escribir en "Port": muestra las letras una a una con un cursor que parpadea al final
var yaEscribio = false;
function mecanografia() {
  if (yaEscribio) return;
  yaEscribio = true;
  var titulo = document.querySelector('.titulo');
  if (!titulo) return;
  var letras = titulo.querySelectorAll('.port .l');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {   // sin animación si el usuario lo pide
    titulo.classList.remove('escribe');
    return;
  }
  // "folio" a mano: cada letra se descubre con su propio trazo (animación .f.on del CSS) y la siguiente
  // empieza casi al acabar la anterior, como en la escritura cursiva
  function escribirEnCortinilla() {                                     // plan B si no se pudo preparar la pluma
    var trazos = titulo.querySelectorAll('.folio .f');
    var LENTITUD = 1;                                                   // 1 = ritmo original; más alto = más lento
    var duraciones = [460, 320, 380, 320, 340].map(function (ms) { return Math.round(ms * LENTITUD); });   // ms de cada letra (la f es la más larga)
    var k = 0;
    function trazo() {
      if (k === trazos.length) {
        setTimeout(function () { titulo.classList.remove('escribe'); }, duraciones[k - 1] + 150);
        return;
      }
      trazos[k].style.setProperty('--dur', duraciones[k % duraciones.length] + 'ms');
      trazos[k].classList.add('on');
      var espera = duraciones[k % duraciones.length] * 0.85 + 40 + Math.random() * 60;
      k++;
      setTimeout(trazo, espera);
    }
    trazo();
  }

  // Anima la pluma: cada letra va destapando su tinta en el orden del trazo, con ritmo de mano (arranca y frena)
  function escribirConPluma() {
    var F = folioPreparado, ctx = F.lienzo.getContext('2d');
    var LENTITUD = 1;                                                   // 1 = ritmo rápido; más alto = más lento
    var base = [460, 320, 380, 320, 340], ini = [], dur = [], acum = 0;  // ms de cada letra (la f es la más larga)
    F.letras.forEach(function (L, k) { dur.push(Math.round(base[k % base.length] * LENTITUD)); ini.push(acum); acum += dur[k] + 35; });   // 35 ms entre letras: la mano casi no se despega
    var fin = acum, t0 = performance.now(), cancelado = false;
    titulo.appendChild(F.lienzo);
    function terminar() {
      if (F.lienzo.parentNode) F.lienzo.parentNode.removeChild(F.lienzo);
      titulo.classList.remove('escribe'); folioActivo = null;
    }
    folioActivo = { cancelar: function () { cancelado = true; terminar(); } };
    function cuadro(ahora) {
      if (cancelado) return;
      var el = ahora - t0, cambio = false;
      F.letras.forEach(function (L, k) {
        if (!L) return;
        var p = Math.max(0, Math.min(1, (el - ini[k]) / dur[k]));
        var e = k === 0 ? 1 - (1 - p) * (1 - p)                          // la primera letra entra ya con velocidad, como continuando la t
          : (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);     // las demás: la pluma arranca y frena
        var meta = p >= 1 ? L.B : Math.min(L.B, Math.floor(e * L.B));
        if (meta > L.hecho) {
          for (var b = L.hecho; b < meta; b++) for (var j = L.ini[b]; j < L.ini[b + 1]; j++) {
            var o = L.idx[j] * 4; L.out.data[o] = L.src[o]; L.out.data[o + 1] = L.src[o + 1]; L.out.data[o + 2] = L.src[o + 2]; L.out.data[o + 3] = L.src[o + 3];
          }
          L.hecho = meta; L.ctx.putImageData(L.out, 0, 0); cambio = true;
        }
      });
      if (cambio) {
        ctx.clearRect(0, 0, F.lienzo.width, F.lienzo.height);
        F.letras.forEach(function (L) { if (L && L.hecho) ctx.drawImage(L.cv, L.px, L.py); });
      }
      if (el < fin) requestAnimationFrame(cuadro); else setTimeout(terminar, 250);
    }
    requestAnimationFrame(cuadro);
  }
  function escribirAMano() {
    if (folioPreparado && folioPreparado.listo) { try { escribirConPluma(); return; } catch (e) { if (folioActivo) folioActivo.cancelar(); folioPreparado = null; } }
    escribirEnCortinilla();
  }

  var i = 0;
  function siguiente() {
    if (i === 0) letras[0].classList.remove('inicio');                  // el cursor de espera pasa a escribir
    if (i > 0) letras[i - 1].classList.remove('cursor');
    if (i === letras.length) {                                          // "Port" completo: la pluma sigue sin pausa; el cursor se apaga suavemente
      var ultima = letras[i - 1];
      ultima.classList.add('apaga');
      escribirAMano();
      setTimeout(function () { ultima.classList.remove('cursor', 'apaga'); }, 400);
      return;
    }
    letras[i].classList.add('on', 'cursor');
    i++;
    setTimeout(siguiente, 100 + Math.random() * 60);                    // ms entre letras: rápido, con pequeñas variaciones
  }
  setTimeout(siguiente, 600);                                           // el cursor parpadea 0,6 s antes de empezar
}

// Arranque: en cuanto está cargada la tipografía del título (sin esperar a las imágenes) y la pestaña se ve.
// Antes de eso, un cursor parpadea en el sitio donde empezará a escribirse.
(function () {
  var primera = document.querySelector('.titulo .port .l');
  if (primera && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) primera.classList.add('inicio');
  var lanzado = false;
  function lanzar() {
    if (lanzado) return;
    lanzado = true;
    ajustarTitulo();                                  // tamaño final del título antes de escribirlo
    try { folioPreparado = prepararFolio(); } catch (e) { folioPreparado = null; }   // se calcula ahora, mientras parpadea el cursor
    if (!document.hidden) { mecanografia(); return; }
    document.addEventListener('visibilitychange', function esperar() {   // si la pestaña está en segundo plano, espera a verla
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', esperar);
      mecanografia();
    });
  }
  if (document.fonts && document.fonts.load) {         // se espera a la tipografía normal y a la cursiva ("folio")
    Promise.all([document.fonts.load('1em "Crimson Text"'), document.fonts.load('italic 1em "Crimson Text"')]).then(lanzar, lanzar);
  }
  setTimeout(lanzar, 1200);                           // por si la fuente tarda: no se espera más de 1,2 s
})();

})();

/* ===== 2) Aparición progresiva al hacer scroll (solo index.html) ===== */
// Los elementos aparecen suavemente cuando entran en la zona visible al hacer scroll.
(() => {
  const targets = document.querySelectorAll(
    '.about, .grid .card, .contacto, footer nav, footer ul'
  );

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((element) => element.classList.add('visible'));
    return;
  }

  targets.forEach((element, index) => {
    element.classList.add('reveal');
    if (element.matches('.grid .card')) {
      element.style.setProperty('--reveal-delay', `${(index % 3) * 100}ms`);
    }
  });

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

  targets.forEach((element) => observer.observe(element));
})();


/* ===== 3) Textos y galería de cada proyecto (solo proyecto.html?p=1…6) ===== */
(function(){
if(!document.getElementById("pista")) return;
// Datos de los 6 proyectos (textos tomados del diseño de Figma)
const proyectos = {
  1: {
    img: "./img/revista-1.jpg", alt: "Revista Inkora, reportaje sobre Ai Wei Wei",
    // Galería con efecto de revista: las páginas pasan solas como hojas y, al tocarlas, las pasa el usuario
    // páginas 1-4: maquetación final; páginas 5-8: el mismo reportaje en el PDF de imprenta (con marcas de corte y barras de color)
    imagenes: ["./img/revista-1.jpg", "./img/revista-2.jpg", "./img/revista-3.jpg", "./img/revista-4.jpg"],
    efecto: "revista", tiempo: 4500,
    proyecto: "Diseño y maquetación de una revista contemporánea.",
    objetivo: "Crear una identidad visual coherente y una estructura de lectura clara mediante principios de diseño editorial.",
    herramienta: "Proyecto realizado íntegramente en Adobe InDesign, aplicando retícula, jerarquía tipográfica y composición modular.",
    resultado: "Publicación clara y profesional, con maquetación sólida en InDesign."
  },
  2: {
    img: "./img/portada-1.jpg", alt: "Portadillas y páginas de la antología de diseñadores",
    // Las 8 portadas de la antología (páginas 9, 15, 21, 27, 33, 39, 45 y 51 del PDF): Sagmeister, Murakami, Glaser, Walsh, Choo, Greiman, Burton y Brody
    imagenes: ["./img/portada-1.jpg", "./img/portada-2.jpg", "./img/portada-3.jpg", "./img/portada-4.jpg",
               "./img/portada-5.jpg", "./img/portada-6.jpg", "./img/portada-7.jpg", "./img/portada-8.jpg"],
    efecto: "revista", tiempo: 4500,   // pasan como hojas de revista
    proyecto: "Diseño de portadas de Stefan Sagmeister, Takashi Murakami, Milton Glaser, Jessica Walsh, Jimmy Choo, April Greiman, Tim Burton y Neville Brody para una antología de diseñadores.",
    objetivo: "Crear una propuesta visual inspirada en su estilo, utilizando la ilustración line art como recurso principal.",
    herramienta: "Proyecto realizado en Adobe Illustrator e integrado posteriormente en una antología editorial diseñada en InDesign.",
    resultado: "Portada ilustrada con estilo line art, integrada en una publicación editorial."
  },
  3: {
    img: "./img/zara-1.jpg", alt: "Campaña Zara Fits You",
    // Cartel + 9 láminas (apaisadas, 4:3)
    imagenes: ["./img/zara-1.jpg", "./img/zara-2.jpg", "./img/zara-3.jpg", "./img/zara-4.jpg", "./img/zara-5.jpg", "./img/zara-6.jpg", "./img/zara-7.jpg", "./img/zara-8.jpg", "./img/zara-9.jpg", "./img/zara-10.jpg"],
    formato: "apaisado", tiempo: 2500, duracion: 450, pausa: true,   // mismo ritmo que el proyecto de Sabadell; con botón visible de pausa
    proyecto: "Diseño de branding para la campaña Zara Fits You.",
    objetivo: "Crear una campaña que combine inclusión, tecnología y moda para encontrar la talla más adecuada para cada tipo de cuerpo.",
    herramienta: "Proyecto desarrollado mediante recursos de branding, diseño gráfico y estrategia de marketing.",
    resultado: "Campaña de marca que utiliza la tecnología para ofrecer una experiencia de compra más personalizada e inclusiva."
  },
  4: {
    img: "./img/sabadell-1.jpg", alt: "Campaña de Sabadell en San Isidro",
    // Las 2 páginas del PDF de la campaña, en PNG sin pérdida (cartel a 300 ppi, lámina a 400 ppi)
    imagenes: ["./img/sabadell-1.jpg", "./img/sabadell-2.jpg"],
    tiempo: 2500, duracion: 450, pausa: true,   // pase rápido: 2,5 s por imagen y deslizamiento de 0,45 s; con botón visible de pausa
    proyecto: "Campaña para el banco Sabadell lanzada en San Isidro.",
    objetivo: "Crear una campaña para San Isidro que conectara la identidad castiza de Madrid con la imagen del Banco Sabadell.",
    herramienta: "Diseño de la propuesta gráfica en Adobe Illustrator y posterior maquetación del flyer en InDesign.",
    resultado: "Flyer de la campaña, diseñado para reforzar su identidad visual y facilitar su reconocimiento."
  },
  5: {
    img: "./img/antologia-1.jpg", alt: "Páginas de la antología 8 y alg1+",
    imagenes: ["./img/antologia-1.jpg", "./img/antologia-2.jpg", "./img/antologia-3.jpg", "./img/antologia-4.jpg"],
    efecto: "revista", tiempo: 4500,   // pasan como hojas de revista, igual que en el proyecto 1
    proyecto: "Diseño y maquetación de una antología de diseñadores.",
    objetivo: "Crear una publicación editorial que recopilara el trabajo y la trayectoria de diferentes diseñadores.",
    herramienta: "Proyecto maquetado íntegramente en Adobe InDesign e impreso en formato revista, incluyendo su proceso de encuadernación.",
    resultado: "Antología editorial en formato revista, impresa y encuadernada."
  },
  6: {
    img: "./img/marca-portada.png", alt: "Identidad visual de Carmen Quílez",
    // Las 10 páginas del PDF de marca personal (cuadradas, 1:1)
    imagenes: ["./img/marca-1.jpg", "./img/marca-2.jpg", "./img/marca-3.jpg", "./img/marca-4.jpg", "./img/marca-5.jpg", "./img/marca-6.jpg", "./img/marca-7.jpg", "./img/marca-8.jpg", "./img/marca-9.jpg", "./img/marca-10.jpg"],
    tiempo: 2500, duracion: 450, pausa: true,   // mismo ritmo que Zara Fits You y Sabadell: 2,5 s por imagen y deslizamiento de 0,45 s; con botón visible de pausa
    proyecto: "Diseño de identidad visual para una marca personal.",
    objetivo: "Crear una identidad visual propia y coherente que representara la personalidad y estilo de la marca.",
    herramienta: "Desarrollo de la identidad visual en Adobe Illustrator, creando el logotipo, isotipo, variantes en claro y oscuro, así como la paleta cromática y tipográfica y sus diferentes aplicaciones mediante mockups.",
    resultado: "Identidad visual completa con logotipo, isotipo, paleta de colores y tipografías, diferentes versiones del logo y aplicaciones mediante mockups."
  }
};

// Muestra el proyecto con el número indicado. Si tiene varias imágenes, se deslizan solas, una a una.
const TIEMPO = 3500;      // milisegundos que se ve cada imagen (cada proyecto puede cambiarlo con `tiempo`)
const DURACION = 700;     // milisegundos que tarda en deslizarse por defecto (un proyecto puede cambiarlo con `duracion`)
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lista = [], actual = 0, nombre = "", temporizador = null, pausado = false, tiempoActual = TIEMPO, duracionActual = DURACION;
let revista = false, libro = null, hojas = [], animando = false, fotograma = 0, fActual = 1;   // efecto de revista

/* ---------- Efecto de revista: pasar hoja ----------
   Las páginas están apiladas. La que se pasa ("hoja") se pliega de derecha a izquierda: lo que queda a la
   izquierda del pliegue sigue siendo la página; lo que ya se ha doblado se ve como el dorso del papel,
   con sombras, y por debajo va apareciendo la página siguiente. f = 1 hoja entera ... f = 0 hoja pasada. */
function fijarF(f) {
  fActual = f;
  libro.style.setProperty("--f", f);
  libro.style.setProperty("--s", Math.sin(Math.PI * f).toFixed(3));      // intensidad de las sombras: máxima a mitad de giro
}

function reposo(c) {                                   // una sola página visible, sin pliegue
  hojas.forEach(function (h, i) { h.style.visibility = i === c ? "visible" : "hidden"; h.style.zIndex = 4; h.style.clipPath = "none"; });
  libro.classList.remove("girando");
  fijarF(1);
  actual = c;
  escribirContador();
}

function prepararHoja(L) {                             // la hoja L encima y, debajo, la siguiente
  const U = (L + 1) % lista.length;
  hojas.forEach(function (h, i) {
    h.style.visibility = (i === L || i === U) ? "visible" : "hidden";
    h.style.zIndex = i === L ? 4 : 2;
    h.style.clipPath = i === L ? "inset(0 calc((1 - var(--f)) * 100%) 0 0)" : "none";
  });
  libro.classList.add("girando");
}

function animarF(desde, hasta, ms, fin) {
  const t0 = performance.now();
  animando = true;
  (function paso(ahora) {
    const p = ms > 0 ? Math.min(1, Math.max(0, (ahora - t0) / ms)) : 1;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;     // el papel arranca y frena
    fijarF(desde + (hasta - desde) * e);
    if (p < 1) fotograma = requestAnimationFrame(paso);
    else { animando = false; if (fin) fin(); }
  })(t0);
}

function pasarPagina(dir, ms) {                        // dir = 1 página siguiente, -1 anterior
  if (animando) return;
  const n = lista.length, ritmo = sinMovimiento ? 0 : ms;
  if (dir > 0) {
    const L = actual;
    prepararHoja(L); fijarF(1);
    fotograma = requestAnimationFrame(function () { animarF(1, 0, ritmo, function () { reposo((L + 1) % n); }); });
  } else {
    const L = (actual - 1 + n) % n;
    prepararHoja(L); fijarF(0);
    fotograma = requestAnimationFrame(function () { animarF(0, 1, ritmo, function () { reposo(L); }); });
  }
}

function manual() {                                    // en cuanto el usuario toca la revista, se acaba el pase automático
  detenerGaleria();
}

function construirRevista(visor) {
  document.getElementById("pista").hidden = true;
  libro = document.createElement("div");
  libro.className = "libro";
  libro.innerHTML = '<div class="sombra-base"></div><div class="sombra-hoja"></div><div class="dorso"></div>';
  hojas = lista.map(function (src, i) {
    const im = new Image();
    im.src = src; im.draggable = false; im.className = "pg";
    im.alt = nombre + " (página " + (i + 1) + " de " + lista.length + ")";
    libro.appendChild(im);
    return im;
  });
  // Botones laterales (grises; negros al pasar el ratón o pulsarlos, ver CSS)
  [["flecha-ant", "Página anterior", "M15 5l-7 7 7 7", -1], ["flecha-sig", "Página siguiente", "M9 5l7 7-7 7", 1]].forEach(function (d) {
    const bt = document.createElement("button");
    bt.type = "button"; bt.className = "flecha-rev " + d[0]; bt.setAttribute("aria-label", d[1]);
    bt.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d[2] + '"/></svg>';
    bt.onclick = function () { manual(); pasarPagina(d[3], 800); };
    libro.appendChild(bt);
  });
  visor.appendChild(libro);
  visor.classList.add("revista");
  revista = true;
  reposo(0);

  visor.tabIndex = 0;
  visor.setAttribute("aria-label", "Revista: pasa las páginas con un clic, arrastrando o con las flechas del teclado");
  visor.title = "Usa las flechas, haz clic en la página o arrástrala para pasar las hojas";
  visor.onclick = null;

  // Teclado
  visor.onkeydown = function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault(); manual();
    pasarPagina(e.key === "ArrowRight" ? 1 : -1, 800);
  };

  // Ratón y dedo: un clic pasa la página; arrastrar la mueve a mano y, al soltar, se completa o vuelve
  visor.onpointerdown = function (e) {
    if (e.target.closest && e.target.closest(".flecha-rev")) return;      // los botones laterales se gestionan solos
    if (animando || (e.pointerType === "mouse" && e.button !== 0)) return;
    manual();
    const x0 = e.clientX, ancho = visor.getBoundingClientRect().width, n = lista.length;
    let dir = 0, L = 0;
    try { visor.setPointerCapture(e.pointerId); } catch (err) {}
    visor.classList.add("arrastrando");
    function mover(ev) {
      const dx = ev.clientX - x0;
      if (!dir) {
        if (Math.abs(dx) < 6) return;
        dir = dx < 0 ? 1 : -1;
        L = dir > 0 ? actual : (actual - 1 + n) % n;
        prepararHoja(L);
      }
      const prog = Math.min(1, Math.abs(dx) / (ancho * 0.9));
      fijarF(dir > 0 ? 1 - prog : prog);
    }
    function soltar(ev) {
      visor.removeEventListener("pointermove", mover);
      visor.removeEventListener("pointerup", soltar);
      visor.removeEventListener("pointercancel", soltar);
      visor.classList.remove("arrastrando");
      if (!dir) {                                      // fue un clic: izquierda = anterior, resto = siguiente
        const rel = (ev.clientX - visor.getBoundingClientRect().left) / ancho;
        pasarPagina(rel < 0.35 ? -1 : 1, 800);
        return;
      }
      const completa = dir > 0 ? fActual < 0.7 : fActual > 0.3;
      const destino = completa ? (dir > 0 ? 0 : 1) : (dir > 0 ? 1 : 0);
      animarF(fActual, destino, sinMovimiento ? 0 : 450, function () {
        reposo(completa ? (dir > 0 ? (L + 1) % n : L) : actual);
      });
    }
    visor.addEventListener("pointermove", mover);
    visor.addEventListener("pointerup", soltar);
    visor.addEventListener("pointercancel", soltar);
  };
}

function limpiarRevista() {                            // al cambiar de proyecto, se deshace todo lo de la revista
  cancelAnimationFrame(fotograma);
  animando = false;
  if (libro && libro.parentNode) libro.parentNode.removeChild(libro);
  libro = null; hojas = []; revista = false;
  const visor = document.querySelector(".visor");
  visor.classList.remove("revista", "arrastrando");
  visor.onpointerdown = null; visor.onkeydown = null;
  visor.removeAttribute("tabindex"); visor.removeAttribute("aria-label");
  document.getElementById("pista").hidden = false;
}

// Coloca las imágenes en fila dentro de la pista. Al final se añade una copia de la primera
// para que, tras la última, la fila siga deslizándose hacia la izquierda y el bucle sea continuo.
function construirPista() {
  const pista = document.getElementById("pista");
  pista.innerHTML = "";
  const fuentes = lista.length > 1 ? lista.concat(lista[0]) : lista;
  fuentes.forEach(function (src, i) {
    const im = new Image();
    im.src = src;
    im.draggable = false;
    if (i < lista.length) im.alt = nombre + (lista.length > 1 ? " (" + (i + 1) + " de " + lista.length + ")" : "");
    else im.alt = "";                                   // la copia final es decorativa
    pista.appendChild(im);
  });
  moverA(0, false);
}

function moverA(n, animar) {
  const pista = document.getElementById("pista");
  pista.classList.toggle("sin-transicion", !animar);
  pista.style.transform = "translateX(" + (-100 * n) + "%)";
  actual = n;
  escribirContador();
}

function escribirContador() {
  document.getElementById("contador").textContent =
    (actual % lista.length + 1) + " / " + lista.length + (pausado ? " · pausa" : "");
}

function siguiente() {
  if (revista) { pasarPagina(1, 1000); return; }          // en la revista, el pase automático pasa hoja
  moverA(actual + 1, true);
  if (actual === lista.length) {                        // ya se ve la copia de la primera
    setTimeout(function () {
      moverA(0, false);                                 // salto invisible a la primera de verdad
      void document.getElementById("pista").offsetWidth;
      document.getElementById("pista").classList.remove("sin-transicion");
    }, duracionActual + 50);
  }
}

function iniciarGaleria() {
  detenerGaleria();
  if (lista.length > 1 && !sinMovimiento) temporizador = setInterval(siguiente, tiempoActual);
}
function detenerGaleria() { clearInterval(temporizador); temporizador = null; }

// Botón visible de pausa (solo el símbolo, junto al contador) (solo en los proyectos con `pausa: true`): detiene las diapositivas para leerlas
function actualizarBotonPausa() {
  const b = document.getElementById("pausa");
  b.classList.toggle("en-pausa", pausado);
  b.setAttribute("aria-pressed", pausado ? "true" : "false");
  b.setAttribute("aria-label", pausado ? "Reanudar las diapositivas" : "Pausar las diapositivas para leerlas con calma");
  b.title = pausado ? "Seguir" : "Pausar";
}

function alternarPausa() {
  pausado = !pausado;
  if (pausado) detenerGaleria(); else iniciarGaleria();
  escribirContador();
  actualizarBotonPausa();
}

function mostrarProyecto(id) {
  const p = proyectos[id] || proyectos[1];
  lista = p.imagenes || [p.img];
  nombre = p.alt;
  const galeria = lista.length > 1;
  tiempoActual = p.tiempo || TIEMPO;
  duracionActual = p.duracion || DURACION;                           // duración del deslizamiento (ms), propia de cada proyecto
  document.getElementById("pista").style.transitionDuration = p.duracion ? p.duracion + "ms" : "";
  const visor = document.querySelector(".visor");
  limpiarRevista();

  ["proyecto", "objetivo", "herramienta", "resultado"].forEach(function (k) {
    document.getElementById(k).textContent = p[k];
  });
  visor.classList.toggle("apaisado", p.formato === "apaisado");   // láminas 4:3: marco fijo y más ancho
  const conRevista = galeria && p.efecto === "revista";
  if (conRevista) construirRevista(visor); else construirPista();
  document.getElementById("contador").hidden = !galeria;

  // Un clic sobre la galería la pone en pausa y otro la reanuda
  // (si el usuario pide menos movimiento, no hay pase automático y cada clic avanza una imagen)
  pausado = false;
  const botonPausa = document.getElementById("pausa");
  botonPausa.hidden = !(galeria && !conRevista && !sinMovimiento && p.pausa);
  botonPausa.onclick = alternarPausa;
  actualizarBotonPausa();
  if (!conRevista) visor.onclick = !galeria ? null : function () {
    if (sinMovimiento) { moverA((actual + 1) % lista.length, false); return; }
    alternarPausa();
  };
  visor.style.cursor = conRevista ? "" : (galeria ? "pointer" : "");
  if (!conRevista) visor.title = galeria ? (sinMovimiento ? "Clic para ver la siguiente" : "Clic para pausar o reanudar") : "";

  iniciarGaleria();
  document.title = "Proyecto · Carmen Quílez";
}

// Arranque: el número del proyecto viene de la URL (proyecto.html?p=3); si no existe, el 1
// (la línea siguiente es la única que usa la URL)
mostrarProyecto(new URLSearchParams(window.location.search).get("p"));

})();

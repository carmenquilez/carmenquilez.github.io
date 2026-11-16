# Portfolio · Carmen Quílez

Portfolio web estático (HTML + CSS + JavaScript, sin dependencias ni servidor).
Diseño y Gestión de Proyectos Transmedia.

## Cómo abrirlo

1. Descomprime el ZIP.
2. Haz doble clic en `index.html` (se abre en el navegador, no hace falta servidor).

Funciona con las rutas relativas, así que puedes mover la carpeta `portfolio/` donde quieras
siempre que no separes los archivos de sitio.

> **Internet:** las tipografías (Playfair Display, Crimson Text y Source Serif 4) se cargan desde
> Google Fonts. Sin conexión todo funciona igual, pero se ve con una tipografía de reserva (Georgia).

## Estructura

```
portfolio/
├── index.html            Inicio: menú, hero, Sobre mí (foto → CV), Proyectos, Contacto y footer
├── proyecto.html         Plantilla de detalle; la usan los 6 proyectos (proyecto.html?p=1 … ?p=6)
├── CV_CarmenQuilez.pdf   Currículum (se abre desde la foto de Sobre mí y desde el footer)
├── css/
│   └── style.css         Todos los estilos (variables en :root; puntos de corte 1024 y 768 px)
├── js/
│   └── script.js         Todo el JavaScript en un solo archivo:
│                           1) título "Portfolio" ajustado al ancho y animado
│                           2) aparición progresiva al hacer scroll
│                           3) textos y galería de cada proyecto
├── img/                  Todas las imágenes (40 archivos)
└── README.md
```

## Proyectos

| ?p= | Proyecto | Imágenes |
|---|---|---|
| 1 | Revista Inkora – Ai Wei Wei | `revista-1` … `revista-4` |
| 2 | Portada – Reinterpretación de diseñadores | `portada-1` … `portada-8` |
| 3 | Campaña – Zara Fits You | `zara-1` … `zara-10` |
| 4 | Campaña – En Madrid lo castizo también se banca (Sabadell) | `sabadell-1`, `sabadell-2` |
| 5 | Antología – 8 y alg1+ | `antologia-1` … `antologia-4` |
| 6 | Marca personal – C.Q | `marca-portada`, `marca-1` … `marca-10` |

## Ajustes rápidos

- Textos, imágenes, velocidad y botón de pausa de un proyecto: bloque `proyectos` al final de `js/script.js`
  (`tiempo` = milisegundos por imagen, `duracion` = milisegundos del deslizamiento, `pausa: true` = botón de pausa).
- Grosor de todas las líneas: variable `--w` en `css/style.css`.
- Horario y datos de contacto: sección Contacto de `index.html`.
- Si cambias el nombre del CV, actualiza los dos enlaces de `index.html` (foto de Sobre mí y footer).

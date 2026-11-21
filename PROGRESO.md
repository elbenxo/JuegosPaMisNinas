# Progreso del proyecto

## Hecho (v1)
- [x] Motor en Canvas 2D con pseudo-3D (carretera en perspectiva), escalado a cualquier pantalla y nitidez retina.
- [x] Controles táctiles (arrastrar) y de teclado.
- [x] Puertas + − × ÷ que mejoran al dispararles; cajas de arma (5 niveles) y cajas de amigos.
- [x] Hordas de enemigos, enemigos grandes con vida visible, jefe con corona y barra de vida.
- [x] 8 niveles con escenario propio: Pradera, Bosque, Playa, Desierto, Nieve, Volcán, Bosque encantado y Castillo.
- [x] 6 compañeros elegibles (Llamita, Burbu, Hojín, Chispi, Nievi, Lunita) y 8 tipos de enemigo, todos originales y dibujados por código.
- [x] Estrellas por nivel, desbloqueo progresivo y guardado en localStorage.
- [x] Sonidos sintetizados (WebAudio) con botón de silencio; pausa automática al cambiar de pestaña.
- [x] Workflow de GitHub Pages.
- [x] Equilibrado con simulaciones automáticas: un bot que elige bien gana los 8 niveles;
      uno que elige al azar gana los primeros y le cuestan los últimos.

## v2 (más difícil, más largo, música)
- [x] Niveles más largos: de ~1 min (nivel 1) a ~2 min y cuarto (nivel 8). Antes duraban 30-65 s.
- [x] Muchos más enemigos: hordas de hasta 34, hordas partidas en los dos carriles, puertas custodiadas,
      enemigos grandes más frecuentes y un minijefe con escolta a mitad de cada nivel.
- [x] Dificultad adaptativa: la vida de enemigos y jefe crece con la fuerza del grupo, y cuantos más
      bichitos llevas, más te quita cada golpe. Así llegar a 500 ya no hace el nivel trivial.
- [x] Todas las cajas dan mejora de arma hasta el máximo (luego dan amigos).
- [x] Música procedural con WebAudio: canción distinta por nivel, música de menú y música de jefe.
      Botón 🎵 para quitar la música y 🔊 para silenciar todo.
- [x] Los bichitos saltan de alegría al pasar una puerta buena y celebran al vencer al jefe.

## Ideas siguientes
- Más niveles o un modo infinito.
- Tienda de mejoras entre niveles con monedas.
- Obstáculos que se mueven y puertas que se desplazan.

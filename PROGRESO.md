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

## v3 (armas, minijefes, monstruos)
- [x] 6 armas que evolucionan rompiendo cajas, cada una con su aspecto y velocidad:
      Burbujitas (muy lenta y débil) → Chispas → Doble rayo → Lluvia de estrellas → Súper láser → Rayo arcoíris.
      Al mejorar aparece un rótulo grande con el nombre del arma.
- [x] Entre 2 y 4 minijefes por nivel (con corona plateada y barra de vida); el jefe final invoca esbirros.
- [x] 16 tipos de monstruo (8 nuevos: seta, abeja, pulpo, cactus, yeti, dragón, calabaza, ojo volador),
      de 3 a 6 tipos por nivel, cada uno con su comportamiento: voladores, zigzag, tanques lentos que
      golpean doble, saltarines, fantasmas que parpadean, y babosas/setas que se dividen al morir.
- [x] Nuevo jefe final en varios niveles (seta, pulpo, cactus, yeti, dragón, calabaza).

## v4 (carriles, obstáculos, ataques, puertas trampa)
- [x] Carretera de 3 carriles; las puertas vienen en filas de 3.
- [x] Obstáculos que cierran 1 o 2 carriles (vallas, rocas, hielo, lava, espinas, cristales según el nivel),
      a veces en eslalon. Los bichitos que choquen se pierden (cuenta cuántos quedan dentro del carril).
- [x] Ataques de monstruos por carril: el carril parpadea en rojo con un "!" y después llega una bola de energía.
      Disparan cangrejos, pulpos, yetis, dragones, ojos, lava y sombras; los minijefes y el jefe apuntan a tu carril.
- [x] Puertas trampa (borde amarillo animado): ⇄ cambia entre azul y rojo con temporizador,
      ▲▲ roja que crece sin parar, ◀ ▶ puertas que se desplazan de carril.
- [x] Grupo de bichitos más compacto para que quepa en un carril; consejos al empezar cada nivel.
- [x] Algo menos de fuerza en los monstruos: la dificultad viene ahora sobre todo de moverse bien a tiempo.

## Ideas siguientes
- Más niveles o un modo infinito.
- Tienda de mejoras entre niveles con monedas.
- Obstáculos que se mueven y puertas que se desplazan.

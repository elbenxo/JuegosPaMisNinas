# Bichitos en Ruta 🐾

Juego web para móvil y ordenador, del estilo "elige la puerta correcta". Llevas un grupo de bichitos
elementales por una carretera. Hay que elegir puertas (+, −, ×, ÷), romper cajas para mejorar el arma o
conseguir más amigos, frenar a las hordas de bichos gruñones y derrotar al jefe al final de cada nivel.

## Cómo se juega
- **Móvil:** arrastra el dedo a izquierda y derecha.
- **Ordenador:** flechas ← → o teclas A / D. `P` o `Esc` para pausar.
- Tus bichitos disparan solos. **Si disparas a una puerta, sube su valor** (una puerta roja puede volverse azul).
- Las cajas marrones con ⭐ mejoran el arma; las verdes dan más amigos. Si chocas con una caja pierdes 2 bichitos.
- 8 niveles con paisajes y enemigos distintos. El avance y las estrellas se guardan en el navegador.

## Jugar en local
Sin dependencias: abre `index.html` directamente, o sirve la carpeta:
```bash
python3 -m http.server 8000   # y abre http://localhost:8000
```

## Publicar en GitHub Pages
El workflow `.github/workflows/pages.yml` publica el juego automáticamente con cada push a `main`.
Solo hay que activarlo una vez: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
La dirección será `https://<usuario>.github.io/<repositorio>/`.

## Estructura
- `index.html`: página, estilos y menús.
- `js/sprites.js`: dibujo procedural de los bichitos (sin imágenes externas).
- `js/game.js`: motor del juego (perspectiva, niveles, disparos, puertas, jefes, sonido).

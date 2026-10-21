# Acompañame: Red de Inclusión

Contexto del Proyecto:
Actúa como un desarrollador Full-Stack experto y un diseñador UX/UI. Construye una aplicación web llamada "ACOMPAÑAME", una red profesional y bolsa de trabajo especializada en Inclusión Escolar (Acompañantes Externos, Centros Educativos y Familias).

Identidad Visual y Diseño (UI/UX):

Estética: Limpia, orgánica, cálida y pedagógica. Estilo minimalista.

Paleta de Colores: Fondo blanco roto/crema claro. Color primario: Verde tierra (naturaleza, crecimiento). Color de acento para botones principales (CTA): Naranja suave/Mostaza. Textos y bordes: Marrón cálido (en lugar de negro puro).

Tipografía: Sans-serif accesible y moderna (ej. Inter o Poppins).

Formas: Tarjetas (cards) y botones con bordes redondeados. Usa Lucide Icons con trazos simples.

Lógica de Usuarios y Base de Datos:
El sistema debe tener autenticación segura y tres roles de usuario distintos:

AIE (Acompañante): Perfil con nombre, foto, zona (ej. CABA), estado (disponible/no disponible), etiquetas de habilidades (ej. Pictogramas, Primer Grado), botón para "Descargar CV" e insignia de "Perfil Verificado".

Centro: Perfil con nombre, ubicación y botón a "Búsquedas Activas".

Familia: Perfil privado con necesidades específicas del niño/a.

Arquitectura de Pantallas (Rutas):

Landing Page (Inicio): Barra de navegación superior con el logo a la izquierda y botones de Login/Registro. Hero section con el título "La red profesional de inclusión escolar", un subtítulo sobre dignificar el rol, y dos botones grandes naranjas para registrarse según el rol.

Feed Principal (Comunidad): Diseño de 3 columnas. Columna izquierda: Mini perfil del usuario. Columna central: Muro donde los usuarios pueden publicar logros o recursos (formato tarjetas). Columna derecha: Alertas de búsquedas activas.

Tablón de Búsquedas Laborales: Una vista donde los Centros y Familias publican ofertas. Debe tener filtros superiores y mostrar las vacantes en una lista vertical de tarjetas. Cada tarjeta debe tener el título, ubicación, etiquetas y un botón de "Postularse".

Directorio de Profesionales (Match): Un buscador para que familias y centros encuentren AIEs. Grilla de tarjetas con la foto del profesional, habilidades y un botón verde de "Iniciar Chat Privado".

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/83cabe39-94a9-4193-9406-b2f4718e7ee5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

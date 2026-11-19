# RIQE Weather

Pronóstico del tiempo con un agregado para fotografía: **horas doradas y azules** calculadas con la posición del sol, y la **nubosidad pronosticada en cada una** para saber qué luz esperar.

## Qué hace

- **Búsqueda de ciudades** con autocompletado (teclado completo: ↑/↓, Enter, Esc) o **tu ubicación** con la geolocalización del navegador. Recuerda la última ciudad.
- **Condiciones actuales:** temperatura y sensación térmica, humedad, viento con dirección y ráfagas, precipitación, índice UV, nubosidad y visibilidad.
- **Próximas 24 horas:** temperatura y probabilidad de lluvia en dos gráficos alineados (mismo eje de horas, cada uno con su escala).
- **Próximos 7 días:** mínima y máxima con barras de rango en una escala común.
- **Luz para fotografía:** línea del día con noche, hora azul (sol entre −6° y −4°), hora dorada (−4° a 6°) y día, para hoy y mañana. Cada ventana trae la nubosidad pronosticada y una lectura simple: despejado, nubes parciales (buena chance de color), cubierto o lluvia probable.
- **El fondo es el cielo:** cambia según el tiempo actual (despejado, nublado, niebla, lluvia, nieve, tormenta), si es de día o de noche y si la ciudad está en hora dorada. Las tarjetas son de vidrio oscuro para que el texto blanco se lea sobre cualquier cielo.
- Español e inglés.

## Cómo funciona

- Datos de [Open-Meteo](https://open-meteo.com/) (pronóstico y geocodificación): gratis, **sin API key** y con CORS abierto. Todo corre en el navegador; no hay backend ni secretos.
- La elevación solar se calcula en `src/lib/sun.ts` con la aproximación del NOAA. Los tests la comparan con la salida y puesta del sol que entrega Open-Meteo (±3 min en Temuco y Reikiavik).

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · gráficos en SVG propio

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # node --test: posición del sol y ventanas de luz
npm run build    # tsc + vite build → dist/
npm run lint
```

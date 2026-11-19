/**
 * Fondo de cielo según el tiempo actual y la hora, como hacen las apps de clima: el color ya dice
 * "despejado de día" o "lluvia de noche" antes de leer nada. Los tonos son lo bastante profundos
 * para que el texto blanco mantenga contraste (≥ 4.5:1 sobre las tarjetas).
 */
export type Sky = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";

const GROUP: [number[], Sky][] = [
  [[0, 1], "clear"],
  [[2, 3], "cloudy"],
  [[45, 48], "fog"],
  [[51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], "rain"],
  [[71, 73, 75, 77, 85, 86], "snow"],
  [[95, 96, 99], "storm"],
];

export const skyOf = (code: number): Sky => GROUP.find(([codes]) => codes.includes(code))?.[1] ?? "cloudy";

const DAY: Record<Sky, [string, string]> = {
  clear: ["#1a5ca8", "#3d86d0"],
  cloudy: ["#4a5a6d", "#6f8093"],
  fog: ["#5d6670", "#838c96"],
  rain: ["#34495c", "#566b7e"],
  snow: ["#52677f", "#7e91a6"],
  storm: ["#2b3142", "#4a5166"],
};

const NIGHT: Record<Sky, [string, string]> = {
  clear: ["#0a1430", "#1d3260"],
  cloudy: ["#171d26", "#303945"],
  fog: ["#1d2228", "#383f47"],
  rain: ["#111922", "#26323d"],
  snow: ["#1a2535", "#36455a"],
  storm: ["#14161f", "#2c3042"],
};

/** Hora dorada con cielo despejado o parcial: el cálido arriba, el azul que va quedando abajo. */
const GOLDEN: [string, string] = ["#a8552c", "#3f5f99"];

export const LOADING_SKY: [string, string] = ["#1d3a5f", "#3a5f8c"];

export function skyGradient(code: number, isDay: boolean, golden: boolean): [string, string] {
  const sky = skyOf(code);
  if (golden && (sky === "clear" || code === 2)) return GOLDEN;
  return (isDay ? DAY : NIGHT)[sky];
}

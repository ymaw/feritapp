export function generateTypeLabelColor(randomValue = Math.random()) {
  const hue = Math.floor(randomValue * 360);
  const saturation = 68;
  const lightness = 43;
  const chroma = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
  const section = hue / 60;
  const x = chroma * (1 - Math.abs(section % 2 - 1));
  let rgb = [0, 0, 0];

  if (section < 1) rgb = [chroma, x, 0];
  else if (section < 2) rgb = [x, chroma, 0];
  else if (section < 3) rgb = [0, chroma, x];
  else if (section < 4) rgb = [0, x, chroma];
  else if (section < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  const m = lightness / 100 - chroma / 2;
  return '#' + rgb.map(function(value) {
    return Math.round((value + m) * 255).toString(16).padStart(2, '0');
  }).join('').toUpperCase();
}

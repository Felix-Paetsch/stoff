/* import chroma from 'chroma-js';

const interpolateColor = (color1, color2, ratio) => {
  return chroma.mix(color1, color2, ratio).css();
};*/

const namedColors = {
    black: [0, 0, 0],
    red: [255, 0, 0],
    blue: [0, 0, 255],
    green: [0, 128, 0],
    // Add more named colors as needed
  };
  
const interpolateColor_native = (color1, color2, ratio = 0.5) => {
    const nameToRgb = name => namedColors[name.toLowerCase()] || [0, 0, 0];
  
    const hslToRgb = (h, s, l) => {
      s /= 100;
      l /= 100;
    
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    
      return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
    };
    
    const colorToRgb = col => {
      if (col in namedColors) {
        return nameToRgb(col);
      } else if (col.charAt(0) === '#') {
        // Convert HEX to RGB
        const hex = col.replace('#', '');
        const r = parseInt(hex.substring(0,2), 16);
        const g = parseInt(hex.substring(2,4), 16);
        const b = parseInt(hex.substring(4,6), 16);
        return [r, g, b];
      } else if (col.startsWith('rgb')) {
        // Extract RGB values
        return col.match(/\d+\.?\d*/g).map(Number);
      } else if (col.startsWith('hsl')) {
        const [h, s, l] = col.match(/\d+\.?\d*/g).map(Number);
        return hslToRgb(h, s, l);
      }
      // Default to black for unknown formats
      return [0, 0, 0];
    };
  
    const rgb1 = colorToRgb(color1);
    const rgb2 = colorToRgb(color2);
  
    // Interpolate
    const r = Math.round(rgb1[0] * (1 - ratio) + rgb2[0] * ratio);
    const g = Math.round(rgb1[1] * (1 - ratio) + rgb2[1] * ratio);
    const b = Math.round(rgb1[2] * (1 - ratio) + rgb2[2] * ratio);
  
    return `rgb(${r},${g},${b})`;
};

export {
   interpolateColor_native as interpolate_colors
}
/* import chroma from 'chroma-js';

const interpolateColor = (color1, color2, ratio) => {
  return chroma.mix(color1, color2, ratio).css();
};*/

const namedColors = {
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50]
    // Add more named colors as needed
} as const;

export type Color = keyof typeof namedColors
    | `rgb(${number},${number},${number})`
    | `rgba(${number},${number},${number},${number})`
    | `#${string}`
    | `hsl(${number},${number},${number})`;


export type Gradient = [Color, Color];

export function interpolate_colors(color1: Color, color2: Color, ratio?: number): Color;
export function interpolate_colors(color1: Gradient, color2: Color, ratio?: number): Gradient;
export function interpolate_colors(color1: Color, color2: Gradient, ratio?: number): Gradient;
export function interpolate_colors(color1: Gradient, color2: Gradient, ratio?: number): Gradient;
export function interpolate_colors(color1: Color | Gradient, color2: Color | Gradient, ratio?: number): Gradient | Color;
export function interpolate_colors(color1: Color | Gradient, color2: Color | Gradient, ratio: number = 0.5): Color | Gradient {
    if (!is_gradient(color1) && !is_gradient(color2)) {
        const rgb1 = colorToRgb(color1);
        const rgb2 = colorToRgb(color2);

        const r = Math.round(rgb1[0] * (1 - ratio) + rgb2[0] * ratio);
        const g = Math.round(rgb1[1] * (1 - ratio) + rgb2[1] * ratio);
        const b = Math.round(rgb1[2] * (1 - ratio) + rgb2[2] * ratio);
        if (typeof rgb1[3] === 'number' || typeof rgb2[3] === 'number') {
            const a = Math.round((rgb1[3] || 1) * (1 - ratio) + (rgb2[3] || 1) * ratio);
            return `rgba(${r},${g},${b},${a})`;
        }

        return `rgb(${r},${g},${b})`;
    }

    if (!is_gradient(color1)) {
        return (interpolate_colors as any)(color2, color1, 1 - ratio);
    }

    if (is_gradient(color2)) {
        return [
            interpolate_colors(color1[0], color2[0], ratio),
            interpolate_colors(color1[1], color2[1], ratio)
        ]
    }

    return [
        interpolate_colors(color1[0], color2, ratio),
        interpolate_colors(color1[1], color2, ratio)
    ]
};

export function is_gradient(c: Color | Gradient): c is Gradient {
    return c instanceof Array;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100;
    l /= 100;

    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
};

export function colorToRgb(col: Color): [number, number, number, number] {
    if (col in namedColors) {
        return [...namedColors[col as keyof typeof namedColors], 1];
    } else if (col.charAt(0) === '#') {
        const hex = col.replace('#', '');
        if (hex.length == 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return [r, g, b, 1];
        }
        if (hex.length == 8) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const a = parseInt(hex.substring(6, 8), 16);
            return [r, g, b, a];
        }
        if (hex.length == 3) {
            const r1 = hex.substring(0, 1);
            const r = parseInt(r1 + r1, 16);
            const g1 = hex.substring(1, 2);
            const g = parseInt(g1 + g1, 16);
            const b1 = hex.substring(2, 3);
            const b = parseInt(b1 + b1, 16);
            return [r, g, b, 1];
        }
        if (hex.length == 4) {
            const r1 = hex.substring(0, 1);
            const r = parseInt(r1 + r1, 16);
            const b1 = hex.substring(1, 2);
            const b = parseInt(b1 + b1, 16);
            const g1 = hex.substring(2, 3);
            const g = parseInt(g1 + g1, 16);
            const a1 = hex.substring(3, 4);
            const a = parseInt(a1 + a1, 16);
            return [r, g, b, a];
        }
    } else if (col.startsWith('rgb')) {
        // Extract RGB values
        return [...(col.match(/\d+\.?\d*/g)?.map(Number) as [number, number, number]), 1];
    } else if (col.startsWith('rgba')) {
        return col.match(/\d+\.?\d*/g)?.map(Number) as [number, number, number, number];
    } else if (col.startsWith('hsl')) {
        const [h, s, l] = col.match(/\d+\.?\d*/g)?.map(Number) || [0, 0, 0];
        return [...hslToRgb(h!, s!, l!), 1];
    } else if (col.startsWith('hsla')) {
        const [h, s, l, a] = col.match(/\d+\.?\d*/g)?.map(Number) || [0, 0, 0];
        return [...hslToRgb(h!, s!, l!), a!];
    }

    return [0, 0, 0, 0];
};

function bytesToHex(bytes: number[]) {
    return bytes
        .map((n) => {
            const v = Math.min(255, Math.max(0, Math.round(n)));
            return v.toString(16).padStart(2, "0");
        })
        .join("");
}

export function colorToHex(col: Color): `#${string}` {
    const rgba = colorToRgb(col)
    if (rgba[3] == 1) {
        return `#${bytesToHex(rgba.slice(0, 3))}`
    }

    return `#${bytesToHex(rgba)}`
}

export function colorToHsl(col: Color): [number, number, number, number] {
    const [r, g, b, a] = colorToRgb(col);

    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));

        switch (max) {
            case rNorm:
                h = ((gNorm - bNorm) / delta) % 6;
                break;
            case gNorm:
                h = (bNorm - rNorm) / delta + 2;
                break;
            case bNorm:
                h = (rNorm - gNorm) / delta + 4;
                break;
        }

        h *= 60;
        if (h < 0) h += 360;
    }

    return [
        Math.round(h),
        Math.round(s * 100),
        Math.round(l * 100),
        a
    ];
}

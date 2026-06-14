import { ConvolutionKernel } from "./convolve";

function gaussian1D(sigma: number, size: number): number[] {
    const half = Math.floor(size / 2);
    const kernel: number[] = [];

    for (let i = -half; i <= half; i++) {
        kernel.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
    }

    const sum = kernel.reduce((a, b) => a + b, 0);
    return kernel.map((v) => v / sum);
}

export function gaussian_blur(
    sigma: number = 1.0,
    kernelSize: number = 0,
): ConvolutionKernel {
    // If no size given, use 6*sigma rule (round up to odd)
    const size =
        kernelSize > 0 ? kernelSize : Math.max(3, Math.ceil(6 * sigma) | 1);

    const half = Math.floor(size / 2);
    const kernel: ConvolutionKernel = [];

    // Build 2D kernel from product of 1D Gaussians
    const row = gaussian1D(sigma, size);

    for (let i = 0; i < size; i++) {
        const colWeight = Math.exp(-((i - half) ** 2) / (2 * sigma * sigma));
        kernel.push(row.map((v) => v * colWeight));
    }

    // Normalize
    const sum = kernel.flat().reduce((a, b) => a + b, 0);
    return kernel.map((row) => row.map((v) => v / sum));
}

export function box_blur(x: number, y?: number): ConvolutionKernel {
    y = y ?? x;
    const kernel: ConvolutionKernel = [];
    const value = 1 / (x * y);

    for (let i = 0; i < y; i++) {
        kernel.push(Array(x).fill(value));
    }

    return kernel;
}

export function sharpen(amount: number = 1): ConvolutionKernel {
    const center = 4 * amount + 1;
    return [
        [0, -amount, 0],
        [-amount, center, -amount],
        [0, -amount, 0],
    ];
}

export function sobel_horizontal(): ConvolutionKernel {
    return [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
    ];
}

export function sobel_vertical(): ConvolutionKernel {
    return [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1],
    ];
}

export function laplacian(): ConvolutionKernel {
    return [
        [0, 1, 0],
        [1, -4, 1],
        [0, 1, 0],
    ];
}

export function laplacian_diagonal(): ConvolutionKernel {
    return [
        [1, 1, 1],
        [1, -8, 1],
        [1, 1, 1],
    ];
}

export function emboss(
    direction: "N" | "NE" | "E" | "SE" = "E",
): ConvolutionKernel {
    switch (direction) {
        case "N":
            return [
                [0, 0, 0],
                [0, 1, 0],
                [0, 0, -1],
            ];
        case "NE":
            return [
                [0, 0, 1],
                [0, 0, 0],
                [-1, 0, 0],
            ];
        case "E":
            return [
                [-2, -1, 0],
                [-1, 0, 1],
                [0, 1, 2],
            ];
        case "SE":
            return [
                [-1, 0, 0],
                [0, 0, 0],
                [0, 0, 1],
            ];
    }
}

export function laplacian_of_gaussian(
    sigma: number = 1.0,
    kernelSize: number = 0,
): ConvolutionKernel {
    const size =
        kernelSize > 0 ? kernelSize : Math.max(3, Math.ceil(6 * sigma) | 1);

    const half = Math.floor(size / 2);
    const kernel: ConvolutionKernel = [];
    const sigma2 = sigma * sigma;
    const sigma4 = sigma2 * sigma2;

    for (let y = -half; y <= half; y++) {
        const row: number[] = [];
        for (let x = -half; x <= half; x++) {
            const r2 = x * x + y * y;
            const value =
                ((r2 - 2 * sigma2) / sigma4) * Math.exp(-r2 / (2 * sigma2));
            row.push(value);
        }
        kernel.push(row);
    }

    // Normalize to zero-sum so flat regions stay near zero
    const sum = kernel.flat().reduce((a, b) => a + b, 0);
    const mean = sum / (size * size);

    return kernel.map((row) => row.map((v) => v - mean));
}

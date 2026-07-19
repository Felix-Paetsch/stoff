import { IGrid } from "../igrid";

export function resample_grid<S, N extends string>(
    g: IGrid<S, N>,
    samples: [number, number],
): IGrid<S, N> {
    return g.with_new_dimensions({
        domain_dimensions: g.dimensions().domain_dimensions,
        lattice_dimensions: samples,
    });
}

export function resample_grid_square<S, N extends string>(
    g: IGrid<S, N>,
    samples: number | null = null,
): IGrid<S, N> {
    const { lattice_dimensions: oldLattice, domain_dimensions: oldDomain } =
        g.dimensions();

    const [minX, minY, domainWidth, domainHeight] = oldDomain;

    if (domainWidth <= 0 || domainHeight <= 0) {
        throw new Error("Grid domain dimensions must have positive size.");
    }

    const smallerDomainAxis = Math.min(domainWidth, domainHeight);

    const smallerAxisSamples =
        samples === null
            ? Math.min(oldLattice[0], oldLattice[1])
            : Math.max(1, Math.floor(samples));

    const cellSize = smallerDomainAxis / smallerAxisSamples;
    const latticeWidth = Math.max(1, Math.floor(domainWidth / cellSize));
    const latticeHeight = Math.max(1, Math.floor(domainHeight / cellSize));

    const usedWidth = latticeWidth * cellSize;
    const usedHeight = latticeHeight * cellSize;

    const offsetX = (domainWidth - usedWidth) / 2;
    const offsetY = (domainHeight - usedHeight) / 2;

    return g.with_new_dimensions({
        domain_dimensions: [
            minX + offsetX,
            minY + offsetY,
            usedWidth,
            usedHeight,
        ],
        lattice_dimensions: [latticeWidth, latticeHeight],
    });
}

export function shared_subgrids<
    S extends IGrid<any, any>,
    T extends IGrid<any, any>,
>(grid1: S, grid2: T, samples?: [number, number]): [S, T] {
    const [minX1, minY1, width1, height1] =
        grid1.dimensions().domain_dimensions;
    const [minX2, minY2, width2, height2] =
        grid2.dimensions().domain_dimensions;

    const maxX1 = minX1 + width1;
    const maxY1 = minY1 + height1;
    const maxX2 = minX2 + width2;
    const maxY2 = minY2 + height2;

    const minX = Math.max(minX1, minX2);
    const minY = Math.max(minY1, minY2);
    const maxX = Math.min(maxX1, maxX2);
    const maxY = Math.min(maxY1, maxY2);

    const intersectionWidth = maxX - minX;
    const intersectionHeight = maxY - minY;

    if (intersectionWidth <= 0 || intersectionHeight <= 0) {
        throw new Error("The grid domains do not intersect.");
    }

    const lattice1 = grid1.dimensions().lattice_dimensions;
    const lattice2 = grid2.dimensions().lattice_dimensions;

    const cellWidth1 = width1 / lattice1[0];
    const cellHeight1 = height1 / lattice1[1];
    const cellWidth2 = width2 / lattice2[0];
    const cellHeight2 = height2 / lattice2[1];

    const intersectionLatticeDimensions: [number, number] = [
        Math.floor(
            Math.max(
                intersectionWidth / cellWidth1,
                intersectionWidth / cellWidth2,
            ),
        ) + 1,
        Math.floor(
            Math.max(
                intersectionHeight / cellHeight1,
                intersectionHeight / cellHeight2,
            ),
        ) + 1,
    ];

    const latticeDimensions = samples ?? intersectionLatticeDimensions;

    const sharedDimensions = {
        domain_dimensions: [
            minX,
            minY,
            intersectionWidth,
            intersectionHeight,
        ] as [number, number, number, number],
        lattice_dimensions: [
            Math.floor(latticeDimensions[0]),
            Math.floor(latticeDimensions[1]),
        ] as [number, number],
    };

    return [
        grid1.with_new_dimensions(sharedDimensions) as S,
        grid2.with_new_dimensions(sharedDimensions) as T,
    ];
}

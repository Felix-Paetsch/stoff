export function compareStrings(a: string, b: string): number {
    const charOrder: Record<string, number> = {
        "~": 26,
        "+": 27,
        "-": 28,
        "!": 29,
        "?": 30,
    };

    const customCompare = (strA: string, strB: string): number => {
        const minLen = Math.min(strA.length, strB.length);

        for (let i = 0; i < minLen; i++) {
            const charA = strA[i].toLowerCase();
            const charB = strB[i].toLowerCase();

            const orderA =
                charOrder[charA] ?? charA.charCodeAt(0) - "a".charCodeAt(0);
            const orderB =
                charOrder[charB] ?? charB.charCodeAt(0) - "a".charCodeAt(0);

            if (orderA !== orderB) return orderA - orderB;
        }

        return strA.length - strB.length;
    };

    const aParts = a.split(".");
    const bParts = b.split(".");

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] ?? "";
        const bPart = bParts[i] ?? "";

        if (aPart === bPart) continue;

        const regex = /(\d+)|(\D+)/g;
        const aTokens = (aPart.match(regex) || []).map((p) =>
            /^\d+$/.test(p) ? parseInt(p, 10) : p,
        );
        const bTokens = (bPart.match(regex) || []).map((p) =>
            /^\d+$/.test(p) ? parseInt(p, 10) : p,
        );

        for (let j = 0; j < Math.max(aTokens.length, bTokens.length); j++) {
            const aToken = aTokens[j] ?? "";
            const bToken = bTokens[j] ?? "";

            if (typeof aToken === "number" && typeof bToken === "number") {
                if (aToken !== bToken) return aToken - bToken;
            } else {
                const cmp = customCompare(String(aToken), String(bToken));
                if (cmp !== 0) return cmp;
            }
        }
    }
    return 0;
}

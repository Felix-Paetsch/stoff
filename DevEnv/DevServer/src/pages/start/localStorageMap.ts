const LS = {
    leftVisible: "stoffstoff2.leftVisible",
    designDataText: "stoffstoff2.lastGoodDesign",
    measureDataText: "stoffstoff2.lastGoodMeasure",
} as const;

type LocalStorageKey = keyof (typeof LS);

export function readLS(key: LocalStorageKey): string | null {
    return localStorage.getItem(LS[key])
}

export function writeLS(key: LocalStorageKey, value: string) {
    localStorage.setItem(LS[key], value)
}

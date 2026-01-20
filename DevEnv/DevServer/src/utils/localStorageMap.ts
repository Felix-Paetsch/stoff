export type LS_Key = "mainPageInputVisible" | "designDataText" | "measureDataText" | "currentPageVisible";

export function readLS(key: LS_Key, def: string): string {
    const item = localStorage.getItem(key);
    if (item == null) {
        writeLS(key, def);
        return def;
    }
    return item;
}

export function writeLS(key: LS_Key, value: string) {
    localStorage.setItem(key, value)
}

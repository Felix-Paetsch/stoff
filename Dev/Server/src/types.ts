export type FileKind = "image" | "svg" | "json" | "text" | "unknown";

export type FileRecord = {
    name: string;
    url: string;
    ext: string;
    kind: FileKind;
    mtimeMs: number;
    content?: unknown;
};

export type ServerMessage =
    | {
          type: "init";
          files: FileRecord[];
          config: Config;
      }
    | {
          type: "upsert";
          file: FileRecord;
      }
    | {
          type: "remove";
          name: string;
      };

export type Config = {
    cardWidth?: number;
    cardMinHeight?: number;
    cardMaxHeight?: number;
};

export type FileKind = "image" | "json" | "text" | "unknown";

export type FileRecord = {
    name: string;
    url: string;
    ext: string;
    kind: FileKind;
    mtimeMs: number;
    size: number;
    content?: unknown;
};

export type ServerMessage =
    | {
          type: "init";
          files: FileRecord[];
      }
    | {
          type: "upsert";
          file: FileRecord;
      }
    | {
          type: "remove";
          name: string;
      };

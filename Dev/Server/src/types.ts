export type Json =
    | string
    | number
    | boolean
    | null
    | Json[]
    | { [key: string]: Json };

export type FileKind = "image" | "svg" | "json" | "text" | "cjson" | "unknown";

export type FileRecord = {
    name: string;
    title: string;
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

export type CJson = {
    title: string;
    stack: string;
} & (
    | {
          type: "text";
          value: string;
      }
    | {
          type: "json";
          value: Json;
      }
    | {
          type: "svg";
          value: string;
      }
    | {
          type: "recording";
          value: {
              svg: string;
              stack: string;
              annotation: Json;
          }[];
      }
    | {
          type: "error";
          value: {
              name: string;
              stack: string;
          };
      }
);

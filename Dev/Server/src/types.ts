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
          }[];
      }
    | {
          type: "error";
          value: {
              name: string;
              stack: string;
          };
      }
    | {
          type: "failedTest";
          value: FailedTest[];
      }
);

// FailedTests

export type NoReferenceReason = {
    type: "NoReference";
};

export type WrongArtifactAmountReason = {
    type: "WrongArtifactAmount";
};

export type NoMatchingJsonReason = {
    type: "NoMatchingJson";
    out: unknown[];
    reference: unknown[];
};

export type NoMatchingImgReason = {
    type: "NoMatchingImg";
    out: string[];
    reference: string[];
};

export type BuildErrorReason = {
    type: "BuildError";
    error: string;
};

export type FailureReason =
    | NoReferenceReason
    | WrongArtifactAmountReason
    | NoMatchingJsonReason
    | NoMatchingImgReason
    | BuildErrorReason;

export type FailedTest = {
    test: string;
    reason: FailureReason;
};

import { StoffSerializable } from "ProcedualArt/serialization/types";
import { FailureResponse, SocketFailure } from "./socket/types";

export type PyRequest = {
    method: string;
    arguments: StoffSerializable[];
};

export type PyFailureReason =
    | SocketFailure["reason"]
    | FailureResponse["reason"]
    | "serialization_error"
    | "deserialization_error";

export type PyResponse =
    | {
          ok: true;
          data: StoffSerializable;
      }
    | {
          ok: false;
          reason: PyFailureReason;
          data?: string;
      };

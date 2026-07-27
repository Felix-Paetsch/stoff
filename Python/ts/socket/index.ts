import { Random } from "@/Core/random";
import { unique_int_gen } from "@/Core/utils";

import WebSocket from "ws";
import {
    FailureResponse,
    MakeRequestConfig,
    RequestResult,
    SocketFailure,
    SuccessResponse
} from "./types";

type PendingRequest = {
    resolve: (response: RequestResult) => void;
    timeout: ReturnType<typeof setTimeout>;
};

const URL = "ws://localhost:3001";
const CONNECTION_TIMEOUT_MS = 1_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;

let socket: WebSocket | undefined;
let connectionPromise: Promise<WebSocket | undefined> | undefined;

const random_seed = Random.uuid();
const id_gen = unique_int_gen();

const pendingRequests = new Map<string, PendingRequest>();

function make_id(): string {
    return `${id_gen()}_${random_seed}`;
}

function socket_failure(
    id: string,
    reason: SocketFailure["reason"]
): SocketFailure {
    return {
        id,
        reason,
        ok: false
    };
}

function resolvePendingRequestsOnClose(): void {
    for (const [id, pending] of pendingRequests) {
        clearTimeout(pending.timeout);
        pending.resolve(socket_failure(id, "socket_closed"));
        pendingRequests.delete(id);
    }
}

function connect(): Promise<WebSocket | undefined> {
    if (socket?.readyState === WebSocket.OPEN) {
        return Promise.resolve(socket);
    }

    if (connectionPromise) {
        return connectionPromise;
    }

    connectionPromise = new Promise<WebSocket | undefined>((resolve) => {
        const candidate = new WebSocket(URL);
        let settled = false;

        const finish = (value: WebSocket | undefined): void => {
            if (settled) {
                return;
            }

            settled = true;
            clearTimeout(timeout);
            resolve(value);
        };

        const timeout = setTimeout(() => {
            candidate.close();
            finish(undefined);
        }, CONNECTION_TIMEOUT_MS);

        const onOpen = (): void => {
            socket = candidate;
            finish(candidate);
        };

        const onError = (): void => {
            finish(undefined);
        };

        const onClose = (): void => {
            if (socket === candidate) {
                socket = undefined;
            }

            resolvePendingRequestsOnClose();
            finish(undefined);
        };

        candidate.once("open", onOpen);
        candidate.once("error", onError);
        candidate.on("message", onMessage);
        candidate.on("close", onClose);
    });

    connectionPromise = connectionPromise.then((connectedSocket) => {
        connectionPromise = undefined;
        return connectedSocket;
    });

    return connectionPromise;
}

function onMessage(data: WebSocket.RawData): void {
    let response: SuccessResponse | FailureResponse;

    try {
        response = JSON.parse(data.toString()) as
            SuccessResponse | FailureResponse;
    } catch {
        return;
    }

    const pending = pendingRequests.get(response.id);

    if (!pending) {
        return;
    }

    clearTimeout(pending.timeout);
    pendingRequests.delete(response.id);
    pending.resolve(response);
}

export async function make_request(
    message: string,
    config: Partial<MakeRequestConfig> = {}
): Promise<RequestResult> {
    const id = make_id();
    const connectedSocket = await connect();

    if (!connectedSocket || connectedSocket.readyState !== WebSocket.OPEN) {
        return socket_failure(id, "no_connection");
    }

    const requestTimeout = config.timeout ?? DEFAULT_REQUEST_TIMEOUT_MS;

    return new Promise<RequestResult>((resolve) => {
        const timeout = setTimeout(() => {
            pendingRequests.delete(id);
            resolve(socket_failure(id, "timeout"));
        }, requestTimeout);

        pendingRequests.set(id, {
            resolve,
            timeout
        });

        try {
            connectedSocket.send(
                JSON.stringify({
                    id,
                    message
                })
            );
        } catch {
            clearTimeout(timeout);
            pendingRequests.delete(id);
            resolve(socket_failure(id, "socket_closed"));
        }
    });
}

export type SuccessResponse = {
    id: string;
    ok: true;
    data: string;
};

export type FailureResponse = {
    id: string;
    ok: false;
    reason: "unknown_method" | "internal_error" | "invalid_message";
    data?: string;
};

export type SocketFailure = {
    id: string;
    ok: false;
    reason: "timeout" | "socket_closed" | "no_connection";
};

export type RequestResult = SuccessResponse | FailureResponse | SocketFailure;

export type MakeRequestConfig = {
    timeout: number; // Max time in ms. Defaults to one minute
};

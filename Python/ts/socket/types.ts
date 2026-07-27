export type SuccessResponse = {
    id: string;
    type: "success";
    data: string;
};

export type FailureResponse = {
    id: string;
    type: "py_failure";
    reason?: string;
};

export type SocketFailure = {
    id: string;
    type: "socket_failure";
    reason: "timeout" | "socket_closed" | "no_connection";
};

export type RequestResult = SuccessResponse | FailureResponse | SocketFailure;

export type MakeRequestConfig = {
    timeout?: number; // Max time in ms. Defaults to one minute
};

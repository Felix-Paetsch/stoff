import { NextFunction, Request, Response } from "express";

export default class Route {
    static routes: Route[] = [];
    constructor(
        readonly url: `/${string}`,
        readonly method: "GET" | "POST",
        readonly overwrite: boolean | null = null
    ) {
        const foundIndex = Route.routes.findIndex(
            (r) => r.url === this.url && r.method === this.method
        );

        if (foundIndex !== -1) {
            if (this.overwrite) {
                Route.routes.splice(foundIndex, 1);
            } else if (this.overwrite === null) {
                return;
            } else {
                throw new Error(`Route ${this.url} already exists!`);
            }
        }

        Route.routes.push(this);
    }

    static reset() {
        Route.routes.length = 0;
    }

    static middleware(req: Request, res: Response, next: NextFunction) {
        const route = Route.routes.find(
            (r) => r.url === req.url && r.method === req.method
        );

        if (route) {
            route.request(req, res);
        } else {
            next();
        }
    }

    request(req: Request, res: Response) {
        // return string (html) or obj (json)
        throw new Error("Not implemented for this route");
    }
}

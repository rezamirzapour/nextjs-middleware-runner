import { Middleware, MiddlewareConfig, MiddlewareContext, MiddlewareResult } from "./types";

export function createMiddleware(
    execute: (context: MiddlewareContext) => Promise<MiddlewareResult>,
    config: MiddlewareConfig = {}
): Middleware {
    return {
        middleware: { execute },
        config,
    };
}
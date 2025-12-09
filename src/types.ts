import type { NextRequest, NextResponse } from 'next/server';

export interface MiddlewareContext {
    request: NextRequest;
    response: NextResponse;
}

export interface MiddlewareResult {
    shouldContinue: boolean;
    response?: NextResponse;
}
export type MatcherPattern = string | string[] | ((path: string) => boolean);

export interface MiddlewareConfig {
    matcher?: MatcherPattern;
    priority?: number;
    name?: string;
    skipOnError?: boolean;
}

export interface MiddlewareFunction {
    execute(context: MiddlewareContext): Promise<MiddlewareResult> | MiddlewareResult;
}

export interface Middleware {
    middleware: MiddlewareFunction;
    config: MiddlewareConfig;
}
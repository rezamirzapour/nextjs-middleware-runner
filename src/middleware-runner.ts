import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Middleware, MiddlewareContext, MiddlewareConfig } from "./types";

export class MiddlewareRunner {
    private middlewares: Middleware[] = [];
    private debugMode: boolean = false;

    constructor(...middlewares: Middleware[]) {
        this.addMiddleware(...middlewares);
    }

    public addMiddleware(...middlewares: Middleware[]): MiddlewareRunner {
        this.middlewares.push(...middlewares);
        this.sortMiddlewares();
        return this;
    }

    public setDebugMode(enabled: boolean): MiddlewareRunner {
        this.debugMode = enabled;
        return this;
    }

    private sortMiddlewares(): void {
        this.middlewares.sort((a, b) => {
            const priorityA = a.config.priority ?? 0;
            const priorityB = b.config.priority ?? 0;
            return priorityB - priorityA;
        });
    }

    private shouldRunMiddleware(path: string, config: MiddlewareConfig): boolean {
        const { matcher } = config;

        if (!matcher) return true;

        if (typeof matcher === 'function') {
            return matcher(path);
        }

        const patterns = Array.isArray(matcher) ? matcher : [matcher];

        const positivePatterns = patterns.filter(p => !p.startsWith('!'));
        const negativePatterns = patterns.filter(p => p.startsWith('!')).map(p => p.slice(1));

        if (negativePatterns.length > 0) {
            const isExcluded = negativePatterns.some(pattern => this.matchPath(path, pattern));
            if (isExcluded) return false;
        }

        if (positivePatterns.length === 0) return true;

        return positivePatterns.some(pattern => this.matchPath(path, pattern));
    }


    private matchPath(path: string, pattern: string): boolean {
        if (pattern === '*') return true;


        if (pattern.includes(':') || pattern.includes('[')) {
            const regexPattern = pattern
                .replace(/:\w+/g, '[^/]+')
                .replace(/\[(\w+)\]/g, '[^/]+')
                .replace(/\*/g, '.*');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(path);
        }

        if (pattern.includes('*')) {
            const regexPattern = pattern
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(path);
        }

        return path === pattern || path.startsWith(pattern);
    }

    private log(message: string, data?: any): void {
        if (this.debugMode) {
            console.log(`[MiddlewareRunner] ${message}`, data || '');
        }
    }

    async run(request: NextRequest): Promise<NextResponse> {
        const path = request.nextUrl.pathname;
        const startTime = Date.now();

        let context: MiddlewareContext = {
            request,
            response: NextResponse.next(),
        };

        this.log(`Running ${this.middlewares.length} middleware(s) for path: ${path}`);

        for (const { middleware, config } of this.middlewares) {
            const middlewareName = config.name || 'unnamed';

            if (!this.shouldRunMiddleware(path, config)) {
                this.log(`Skipping middleware: ${middlewareName}`);
                continue;
            }

            try {
                this.log(`Executing middleware: ${middlewareName}`);
                const middlewareStart = Date.now();

                const result = await middleware.execute(context);

                this.log(`Middleware ${middlewareName} completed in ${Date.now() - middlewareStart}ms`);

                if (!result.shouldContinue) {
                    this.log(`Middleware ${middlewareName} stopped the chain`);
                    return result.response || context.response;
                }

                if (result.response) {
                    context = {
                        request: context.request,
                        response: result.response,
                    };
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[MiddlewareRunner] Error in middleware ${middlewareName}:`, errorMessage);

                if (!config.skipOnError) {
                    return new NextResponse('Internal Server Error', { status: 500 });
                }

                this.log(`Skipping error in middleware: ${middlewareName}`);
            }
        }

        this.log(`All middlewares completed in ${Date.now() - startTime}ms`);
        return context.response;
    }

    public removeMiddleware(name: string): MiddlewareRunner {
        this.middlewares = this.middlewares.filter(m => m.config.name !== name);
        return this;
    }

    public getMiddlewares(): Middleware[] {
        return [...this.middlewares];
    }

    public clear(): MiddlewareRunner {
        this.middlewares = [];
        return this;
    }
}
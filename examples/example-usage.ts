import { NextResponse } from "next/server";
import { createMiddleware, MiddlewareRunner } from "../src";

const loggingMiddleware = createMiddleware(
    async ({ request, response }) => {
        console.log(`${request.method} ${request.nextUrl.pathname}`);
        return { shouldContinue: true, response };
    },
    { name: 'logger', priority: 100 }
);

const authMiddleware = createMiddleware(
    async ({ request, response }) => {
        const token = request.cookies.get('auth-token');

        if (!token) {
            return {
                shouldContinue: false,
                response: NextResponse.redirect(new URL('/login', request.url)),
            };
        }

        const newResponse = NextResponse.next();
        newResponse.headers.set('X-User-Authenticated', 'true');

        return { shouldContinue: true, response: newResponse };
    },
    {
        name: 'auth',
        matcher: ['/dashboard/*', '/api/protected/*', '!/api/auth/*'],
        priority: 90,
    }
);

const corsMiddleware = createMiddleware(
    async ({ request, response }) => {
        const newResponse = response.clone();
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
        newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

        return { shouldContinue: true, response: newResponse };
    },
    { name: 'cors', matcher: '/api/*', priority: 80 }
);

const rateLimitMiddleware = createMiddleware(
    async ({ request, response }) => {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';

        const isRateLimited = false; // مثال

        if (isRateLimited) {
            return {
                shouldContinue: false,
                response: new NextResponse('Too Many Requests', { status: 429 }),
            };
        }

        return { shouldContinue: true, response };
    },
    { name: 'rate-limit', matcher: '/api/*', priority: 95, skipOnError: true }
);

export const runner = new MiddlewareRunner(
    loggingMiddleware,
    rateLimitMiddleware,
    authMiddleware,
    corsMiddleware
)
    .setDebugMode(process.env.NODE_ENV === 'development');

export async function middleware(request: NextRequest) {
    return runner.run(request);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
\# 🚀 Next.js Middleware Runner



A flexible and powerful middleware runner for Next.js with priority support, advanced pattern matching, and comprehensive error handling.



\## ✨ Features



\- 🎯 \*\*Priority-based execution\*\* - Control middleware execution order

\- 🔍 \*\*Advanced pattern matching\*\* - Support for wildcards, dynamic routes, and negative patterns

\- ⚡ \*\*Type-safe\*\* - Full TypeScript support

\- 🛡️ \*\*Error handling\*\* - Built-in error handling with skip options

\- 🐛 \*\*Debug mode\*\* - Detailed logging for development

\- 🎨 \*\*Fluent API\*\* - Chain-able methods for easy configuration

\- 📦 \*\*Zero dependencies\*\* - Only requires Next.js as peer dependency



\## 📦 Installation

```bash

npm install @remirzapour/nextjs-middleware-runner

\# or

yarn add @remirzapour/nextjs-middleware-runner

\# or

pnpm add @remirzapour/nextjs-middleware-runner

```



\## 🚀 Quick Start

```typescript

// middleware.ts or proxy.ts

import { MiddlewareRunner, createMiddleware } from '@remirzapour/nextjs-middleware-runner';

import type { NextRequest } from 'next/server';



// Create your middlewares

const loggingMiddleware = createMiddleware(

&nbsp; async ({ request, response }) => {

&nbsp;   console.log(`${request.method} ${request.nextUrl.pathname}`);

&nbsp;   return { shouldContinue: true, response };

&nbsp; },

&nbsp; { name: 'logger', priority: 100 }

);



const authMiddleware = createMiddleware(

&nbsp; async ({ request, response }) => {

&nbsp;   const token = request.cookies.get('auth-token');

&nbsp;   

&nbsp;   if (!token) {

&nbsp;     return {

&nbsp;       shouldContinue: false,

&nbsp;       response: NextResponse.redirect(new URL('/login', request.url)),

&nbsp;     };

&nbsp;   }

&nbsp;   

&nbsp;   return { shouldContinue: true, response };

&nbsp; },

&nbsp; {

&nbsp;   name: 'auth',

&nbsp;   matcher: \['/dashboard/\*', '/api/protected/\*'],

&nbsp;   priority: 90,

&nbsp; }

);



// Setup runner

const runner = new MiddlewareRunner(loggingMiddleware, authMiddleware)

&nbsp; .setDebugMode(process.env.NODE\_ENV === 'development');



export async function middleware(request: NextRequest) {

&nbsp; return runner.run(request);

}



export const config = {

&nbsp; matcher: \['/((?!\_next/static|\_next/image|favicon.ico).\*)'],

};

```



\## 📖 API Documentation



\### MiddlewareRunner



\#### Constructor

```typescript

new MiddlewareRunner(...middlewares: Middleware\[])

```



\#### Methods



\- \*\*`addMiddleware(...middlewares: Middleware\[])`\*\* - Add middlewares

\- \*\*`setDebugMode(enabled: boolean)`\*\* - Enable/disable debug logging

\- \*\*`removeMiddleware(name: string)`\*\* - Remove middleware by name

\- \*\*`clear()`\*\* - Remove all middlewares

\- \*\*`getMiddlewares()`\*\* - Get list of middlewares

\- \*\*`run(request: NextRequest)`\*\* - Execute middleware chain



\### createMiddleware

```typescript

createMiddleware(

&nbsp; execute: (context: MiddlewareContext) => Promise<MiddlewareResult> | MiddlewareResult,

&nbsp; config?: MiddlewareConfig

): Middleware

```



\### Pattern Matching



Supports various pattern types:



\- \*\*Exact match\*\*: `/api/users`

\- \*\*Prefix match\*\*: `/api/\*`

\- \*\*Dynamic routes\*\*: `/api/:id` or `/user/\[id]`

\- \*\*Negative patterns\*\*: `!\\/api/public/\*`

\- \*\*Function matcher\*\*: `(path) => path.startsWith('/api')`



\## 📚 Examples



See the \[examples](./examples) directory for more use cases:

\- Authentication

\- Rate Limiting

\- CORS

\- Logging

\- Request/Response modification



\## 🤝 Contributing



Contributions are welcome! Please read our \[Contributing Guide](CONTRIBUTING.md).



\## 📄 License



MIT © \[Your Name]



\## 🔗 Links



\- \[GitHub Repository](https://github.com/remirzapour/nextjs-middleware-runner)

\- \[NPM Package](https://www.npmjs.com/package/@remirzapour/nextjs-middleware-runner)

\- \[Documentation](https://github.com/remirzapour/nextjs-middleware-runner/wiki)


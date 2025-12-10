# 🚀 Next.js Middleware Runner

A flexible and powerful middleware runner for Next.js with priority support, advanced pattern matching, and comprehensive error handling.

## ✨ Features

- 🎯 **Priority-based execution** - Control middleware execution order
- 🔍 **Advanced pattern matching** - Support for wildcards, dynamic routes, and negative patterns
- ⚡ **Type-safe** - Full TypeScript support
- 🛡️ **Error handling** - Built-in error handling with skip options
- 🐛 **Debug mode** - Detailed logging for development
- 🎨 **Fluent API** - Chain-able methods for easy configuration
- 📦 **Zero dependencies** - Only requires Next.js as peer dependency

## 📦 Installation

```bash
npm install @rezamirzapour/nextjs-middleware-runner
# or
yarn add @rezamirzapour/nextjs-middleware-runner
# or
pnpm add @rezamirzapour/nextjs-middleware-runner
```

## 🚀 Quick Start

### Project Structure
```
your-project/
├── middlewares/
│   ├── authMiddleware.ts
│   └── loggingMiddleware.ts
│   └── index.ts
├── middleware.ts
└── ...
```

### 1. Create middleware files

**`middlewares/loggingMiddleware.ts`:**
```typescript
import { createMiddleware } from '@rezamirzapour/nextjs-middleware-runner';

export const loggingMiddleware = createMiddleware(
  async ({ request, response }) => {
    console.log(`${request.method} ${request.nextUrl.pathname}`);
    return { shouldContinue: true, response };
  },
  { 
    name: 'logger', 
    priority: 1 
  }
);
```

**`middlewares/authMiddleware.ts`:**
```typescript
import { createMiddleware } from '@rezamirzapour/nextjs-middleware-runner';
import { NextResponse } from 'next/server';

export const authMiddleware = createMiddleware(
  async ({ request, response }) => {
    const token = request.cookies.get('auth-token');
    
    if (!token) {
      return {
        shouldContinue: false,
        response: NextResponse.redirect(new URL('/login', request.url)),
      };
    }
    
    return { shouldContinue: true, response };
  },
  {
    name: 'auth',
    matcher: ['/dashboard/*', '/api/protected/*'],
    priority: 2,
  }
);
```

### 2. Create main middleware file

**`middleware.ts`:**
```typescript
import { MiddlewareRunner } from '@rezamirzapour/nextjs-middleware-runner';
import type { NextRequest } from 'next/server';
import { loggingMiddleware, authMiddleware } from './middlewares';

// Setup runner with imported middlewares
const runner = new MiddlewareRunner(loggingMiddleware, authMiddleware)
  .setDebugMode(process.env.NODE_ENV === 'development');

export async function middleware(request: NextRequest) {
  return runner.run(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 3. Alternative: Add more middlewares dynamically

```typescript
import { MiddlewareRunner } from '@rezamirzapour/nextjs-middleware-runner';
import type { NextRequest } from 'next/server';
import { loggingMiddleware, authMiddleware } from './middlewares/loggingMiddleware';

// Create runner instance
const runner = new MiddlewareRunner()
  .addMiddleware(authMiddleware);

if(process.env.NODE_ENV === 'development') {
  runner.addMiddleware(loggingMiddleware)
}

runner.setDebugMode(process.env.NODE_ENV === 'development');

export async function middleware(request: NextRequest) {
  return runner.run(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## 📖 API Documentation

### MiddlewareRunner

#### Constructor

```typescript
new MiddlewareRunner(...middlewares: Middleware[])
```

#### Methods

- **`addMiddleware(...middlewares: Middleware[])`** - Add middlewares
- **`setDebugMode(enabled: boolean)`** - Enable/disable debug logging
- **`removeMiddleware(name: string)`** - Remove middleware by name
- **`clear()`** - Remove all middlewares
- **`getMiddlewares()`** - Get list of middlewares
- **`run(request: NextRequest)`** - Execute middleware chain

### createMiddleware

```typescript
createMiddleware(
  execute: (context: MiddlewareContext) => Promise<MiddlewareResult> | MiddlewareResult,
  config?: MiddlewareConfig
): Middleware
```

### Pattern Matching

Supports various pattern types:

- **Exact match**: `/api/users`
- **Prefix match**: `/api/*`
- **Dynamic routes**: `/api/:id` or `/user/[id]`
- **Negative patterns**: `!/api/public/*`
- **Function matcher**: `(path) => path.startsWith('/api')`

## 📚 Examples

See the [examples](./examples) directory for more use cases:
- Authentication
- Rate Limiting
- CORS
- Logging
- Request/Response modification

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## 📄 License

MIT © [Reza Mirzapour]

## 🔗 Links

- [GitHub Repository](https://github.com/rezamirzapour/nextjs-middleware-runner)
- [NPM Package](https://www.npmjs.com/package/@rezamirzapour/nextjs-middleware-runner)
- [Documentation](https://github.com/rezamirzapour/nextjs-middleware-runner/wiki)

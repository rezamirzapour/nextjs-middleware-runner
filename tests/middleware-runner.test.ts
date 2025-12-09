/**
 * @jest-environment node
 */

import { MiddlewareRunner, createMiddleware } from '../src';

// Simple mock for NextRequest and NextResponse
class MockNextRequest {
  public url: string;
  public method: string;
  public headers: Map<string, string>;
  public cookies: Map<string, any>;
  public nextUrl: { pathname: string };
  public ip?: string;

  constructor(url: string, options: any = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map();
    this.cookies = new Map();
    const urlObj = new URL(url);
    this.nextUrl = { pathname: urlObj.pathname };
  }
}

class MockNextResponse {
  public status: number;
  public headers: Map<string, string>;
  private body: string;

  constructor(body?: string, init?: { status?: number }) {
    this.body = body || '';
    this.status = init?.status || 200;
    this.headers = new Map();
  }

  static next() {
    return new MockNextResponse();
  }

  static redirect(url: URL) {
    const response = new MockNextResponse();
    response.status = 307;
    response.headers.set('Location', url.toString());
    return response;
  }

  clone() {
    const cloned = new MockNextResponse(this.body, { status: this.status });
    this.headers.forEach((value, key) => {
      cloned.headers.set(key, value);
    });
    return cloned;
  }

  async text() {
    return this.body;
  }
}

// Type assertions for mocks
const NextRequest = MockNextRequest as any;
const NextResponse = MockNextResponse as any;

function createMockRequest(url: string, options: any = {}) {
  return new NextRequest(url, options);
}

describe('MiddlewareRunner', () => {
  describe('Basic Functionality', () => {
    test('should create a runner instance', () => {
      const runner = new MiddlewareRunner();
      expect(runner).toBeInstanceOf(MiddlewareRunner);
    });

    test('should add middleware', () => {
      const runner = new MiddlewareRunner();
      const middleware = createMiddleware(
        async ({ response }) => ({ shouldContinue: true, response }),
        { name: 'test' }
      );

      runner.addMiddleware(middleware);
      expect(runner.getMiddlewares()).toHaveLength(1);
    });

    test('should execute middleware', async () => {
      const mockFn = jest.fn();
      const middleware = createMiddleware(
        async ({ response }) => {
          mockFn();
          return { shouldContinue: true, response };
        },
        { name: 'test' }
      );

      const runner = new MiddlewareRunner(middleware);
      const request = createMockRequest('http://localhost:3000/test');
      
      await runner.run(request);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Priority System', () => {
    test('should execute middlewares in priority order', async () => {
      const executionOrder: number[] = [];

      const middleware1 = createMiddleware(
        async ({ response }) => {
          executionOrder.push(1);
          return { shouldContinue: true, response };
        },
        { name: 'low', priority: 10 }
      );

      const middleware2 = createMiddleware(
        async ({ response }) => {
          executionOrder.push(2);
          return { shouldContinue: true, response };
        },
        { name: 'high', priority: 100 }
      );

      const middleware3 = createMiddleware(
        async ({ response }) => {
          executionOrder.push(3);
          return { shouldContinue: true, response };
        },
        { name: 'medium', priority: 50 }
      );

      const runner = new MiddlewareRunner(middleware1, middleware2, middleware3);
      const request = createMockRequest('http://localhost:3000/test');
      
      await runner.run(request);
      expect(executionOrder).toEqual([2, 3, 1]);
    });

    test('should handle middlewares without priority', async () => {
      const executionOrder: string[] = [];

      const middleware1 = createMiddleware(
        async ({ response }) => {
          executionOrder.push('no-priority');
          return { shouldContinue: true, response };
        },
        { name: 'no-priority' }
      );

      const middleware2 = createMiddleware(
        async ({ response }) => {
          executionOrder.push('with-priority');
          return { shouldContinue: true, response };
        },
        { name: 'with-priority', priority: 50 }
      );

      const runner = new MiddlewareRunner(middleware1, middleware2);
      const request = createMockRequest('http://localhost:3000/test');
      
      await runner.run(request);
      expect(executionOrder).toEqual(['with-priority', 'no-priority']);
    });
  });

  describe('Pattern Matching', () => {
    test('should match exact paths', async () => {
      const mockFn = jest.fn();
      const middleware = createMiddleware(
        async ({ response }) => {
          mockFn();
          return { shouldContinue: true, response };
        },
        { name: 'test', matcher: '/api/users' }
      );

      const runner = new MiddlewareRunner(middleware);
      
      await runner.run(createMockRequest('http://localhost:3000/api/users'));
      expect(mockFn).toHaveBeenCalledTimes(1);

      mockFn.mockClear();
      await runner.run(createMockRequest('http://localhost:3000/api/posts'));
      expect(mockFn).not.toHaveBeenCalled();
    });

    test('should match wildcard patterns', async () => {
      const mockFn = jest.fn();
      const middleware = createMiddleware(
        async ({ response }) => {
          mockFn();
          return { shouldContinue: true, response };
        },
        { name: 'test', matcher: '/api/*' }
      );

      const runner = new MiddlewareRunner(middleware);
      
      await runner.run(createMockRequest('http://localhost:3000/api/users'));
      await runner.run(createMockRequest('http://localhost:3000/api/posts'));
      await runner.run(createMockRequest('http://localhost:3000/api/comments/123'));
      expect(mockFn).toHaveBeenCalledTimes(3);

      mockFn.mockClear();
      await runner.run(createMockRequest('http://localhost:3000/dashboard'));
      expect(mockFn).not.toHaveBeenCalled();
    });

    test('should match dynamic routes', async () => {
      const mockFn = jest.fn();
      const middleware = createMiddleware(
        async ({ response }) => {
          mockFn();
          return { shouldContinue: true, response };
        },
        { name: 'test', matcher: '/api/users/:id' }
      );

      const runner = new MiddlewareRunner(middleware);
      
      await runner.run(createMockRequest('http://localhost:3000/api/users/123'));
      await runner.run(createMockRequest('http://localhost:3000/api/users/abc'));
      expect(mockFn).toHaveBeenCalledTimes(2);

      mockFn.mockClear();
      await runner.run(createMockRequest('http://localhost:3000/api/users'));
      expect(mockFn).not.toHaveBeenCalled();
    });

    test('should match Next.js dynamic routes', async () => {
      const mockFn = jest.fn();
      const middleware = createMiddleware(
        async ({ response }) => {
          mockFn();
          return { shouldContinue: true, response };
        },
        { name: 'test', matcher: '/users/[id]' }
      );

      const runner = new MiddlewareRunner(middleware);
      
      await runner.run(createMockRequest('http://localhost:3000/users/123'));
      await runner.run(createMockRequest('http://localhost:3000/users/abc'));
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should handle negative patterns', async () => {
      const mockFn = jest.fn();
      const middleware = createMiddleware(
        async ({ response }) => {
          mockFn();
          return { shouldContinue: true, response };
        },
        { name: 'test', matcher: ['!/api/public/*', '/api/*'] }
      );

      const runner = new MiddlewareRunner(middleware);
      
      await runner.run(createMockRequest('http://localhost:3000/api/users'));
      await runner.run(createMockRequest('http://localhost:3000/api/posts'));
      expect(mockFn).toHaveBeenCalledTimes(2);

      mockFn.mockClear();
      await runner.run(createMockRequest('http://localhost:3000/api/public/data'));
      expect(mockFn).not.toHaveBeenCalled();
    });

    test('should use function matchers', async () => {
      const mockFn = jest.fn();
      const middleware = createMiddleware(
        async ({ response }) => {
          mockFn();
          return { shouldContinue: true, response };
        },
        { 
          name: 'test', 
          matcher: (path) => path.startsWith('/api') && path.includes('admin')
        }
      );

      const runner = new MiddlewareRunner(middleware);
      
      await runner.run(createMockRequest('http://localhost:3000/api/admin/users'));
      expect(mockFn).toHaveBeenCalledTimes(1);

      mockFn.mockClear();
      await runner.run(createMockRequest('http://localhost:3000/api/users'));
      expect(mockFn).not.toHaveBeenCalled();
    });

    test('should match everything when no matcher provided', async () => {
      const mockFn = jest.fn();
      const middleware = createMiddleware(
        async ({ response }) => {
          mockFn();
          return { shouldContinue: true, response };
        },
        { name: 'test' }
      );

      const runner = new MiddlewareRunner(middleware);
      
      await runner.run(createMockRequest('http://localhost:3000/'));
      await runner.run(createMockRequest('http://localhost:3000/api'));
      await runner.run(createMockRequest('http://localhost:3000/dashboard'));
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Middleware Chain', () => {
    test('should stop chain when shouldContinue is false', async () => {
      const mock1 = jest.fn();
      const mock2 = jest.fn();

      const middleware1 = createMiddleware(
        async ({ response }) => {
          mock1();
          return { shouldContinue: false, response };
        },
        { name: 'stop', priority: 100 }
      );

      const middleware2 = createMiddleware(
        async ({ response }) => {
          mock2();
          return { shouldContinue: true, response };
        },
        { name: 'continue', priority: 50 }
      );

      const runner = new MiddlewareRunner(middleware1, middleware2);
      const request = createMockRequest('http://localhost:3000/test');
      
      await runner.run(request);
      expect(mock1).toHaveBeenCalledTimes(1);
      expect(mock2).not.toHaveBeenCalled();
    });

    test('should pass modified response to next middleware', async () => {
      let receivedHeader: string | null = null;

      const middleware1 = createMiddleware(
        async ({ response }) => {
          const newResponse = NextResponse.next();
          newResponse.headers.set('X-Custom-Header', 'test-value');
          return { shouldContinue: true, response: newResponse };
        },
        { name: 'setter', priority: 100 }
      );

      const middleware2 = createMiddleware(
        async ({ response }) => {
          receivedHeader = response.headers.get('X-Custom-Header');
          return { shouldContinue: true, response };
        },
        { name: 'getter', priority: 50 }
      );

      const runner = new MiddlewareRunner(middleware1, middleware2);
      const request = createMockRequest('http://localhost:3000/test');
      
      await runner.run(request);
      expect(receivedHeader).toBe('test-value');
    });

    test('should return custom response when chain stops', async () => {
      const middleware = createMiddleware(
        async () => {
          return {
            shouldContinue: false,
            response: new NextResponse('Unauthorized', { status: 401 }),
          };
        },
        { name: 'auth' }
      );

      const runner = new MiddlewareRunner(middleware);
      const request = createMockRequest('http://localhost:3000/test');
      
      const response = await runner.run(request);
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    test('should catch errors in middleware', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const middleware = createMiddleware(
        async () => {
          throw new Error('Test error');
        },
        { name: 'error-middleware' }
      );

      const runner = new MiddlewareRunner(middleware);
      const request = createMockRequest('http://localhost:3000/test');
      
      const response = await runner.run(request);
      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('should skip error when skipOnError is true', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mock2 = jest.fn();

      const middleware1 = createMiddleware(
        async () => {
          throw new Error('Test error');
        },
        { name: 'error-middleware', skipOnError: true, priority: 100 }
      );

      const middleware2 = createMiddleware(
        async ({ response }) => {
          mock2();
          return { shouldContinue: true, response };
        },
        { name: 'continue', priority: 50 }
      );

      const runner = new MiddlewareRunner(middleware1, middleware2);
      const request = createMockRequest('http://localhost:3000/test');
      
      const response = await runner.run(request);
      expect(response.status).toBe(200);
      expect(mock2).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Runner Methods', () => {
    test('should remove middleware by name', () => {
      const middleware1 = createMiddleware(
        async ({ response }) => ({ shouldContinue: true, response }),
        { name: 'first' }
      );

      const middleware2 = createMiddleware(
        async ({ response }) => ({ shouldContinue: true, response }),
        { name: 'second' }
      );

      const runner = new MiddlewareRunner(middleware1, middleware2);
      expect(runner.getMiddlewares()).toHaveLength(2);

      runner.removeMiddleware('first');
      expect(runner.getMiddlewares()).toHaveLength(1);
      expect(runner.getMiddlewares()[0].config.name).toBe('second');
    });

    test('should clear all middlewares', () => {
      const middleware = createMiddleware(
        async ({ response }) => ({ shouldContinue: true, response }),
        { name: 'test' }
      );

      const runner = new MiddlewareRunner(middleware);
      expect(runner.getMiddlewares()).toHaveLength(1);

      runner.clear();
      expect(runner.getMiddlewares()).toHaveLength(0);
    });

    test('should enable debug mode', () => {
      const runner = new MiddlewareRunner();
      const result = runner.setDebugMode(true);
      
      expect(result).toBe(runner);
    });

    test('should support method chaining', () => {
      const middleware = createMiddleware(
        async ({ response }) => ({ shouldContinue: true, response }),
        { name: 'test' }
      );

      const runner = new MiddlewareRunner()
        .addMiddleware(middleware)
        .setDebugMode(true)
        .removeMiddleware('test')
        .clear();

      expect(runner).toBeInstanceOf(MiddlewareRunner);
    });
  });

  describe('Debug Mode', () => {
    test('should log when debug mode is enabled', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const middleware = createMiddleware(
        async ({ response }) => ({ shouldContinue: true, response }),
        { name: 'test' }
      );

      const runner = new MiddlewareRunner(middleware).setDebugMode(true);
      const request = createMockRequest('http://localhost:3000/test');
      
      await runner.run(request);
      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    test('should not log when debug mode is disabled', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const middleware = createMiddleware(
        async ({ response }) => ({ shouldContinue: true, response }),
        { name: 'test' }
      );

      const runner = new MiddlewareRunner(middleware).setDebugMode(false);
      const request = createMockRequest('http://localhost:3000/test');
      
      await runner.run(request);
      expect(consoleLogSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });
});

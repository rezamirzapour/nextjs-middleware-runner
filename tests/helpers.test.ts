import { createMiddleware } from '../src';

describe('createMiddleware helper', () => {
  test('should create a middleware with config', () => {
    const middleware = createMiddleware(
      async ({ response }) => ({ shouldContinue: true, response }),
      { name: 'test', priority: 50 }
    );

    expect(middleware).toHaveProperty('middleware');
    expect(middleware).toHaveProperty('config');
    expect(middleware.config.name).toBe('test');
    expect(middleware.config.priority).toBe(50);
  });

  test('should create a middleware without config', () => {
    const middleware = createMiddleware(
      async ({ response }) => ({ shouldContinue: true, response })
    );

    expect(middleware).toHaveProperty('middleware');
    expect(middleware).toHaveProperty('config');
    expect(middleware.config).toEqual({});
  });

  test('should support sync execute functions', () => {
    const middleware = createMiddleware(
      ({ response }) => ({ shouldContinue: true, response }),
      { name: 'sync' }
    );

    expect(middleware.config.name).toBe('sync');
  });
});

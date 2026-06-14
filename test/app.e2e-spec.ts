import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  const API_KEY = process.env.API_KEY ?? 'supersecureapikey123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products — returns paginated list', () => {
    return request(app.getHttpServer())
      .get('/products')
      .set('x-api-key', API_KEY)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page');
        expect(res.body).toHaveProperty('totalPages');
      });
  });

  it('GET /products — rejects request without API key', () => {
    return request(app.getHttpServer()).get('/products').expect(401);
  });

  it('GET /products?minPrice=abc — rejects invalid query param', () => {
    return request(app.getHttpServer())
      .get('/products?minPrice=abc')
      .set('x-api-key', API_KEY)
      .expect(400);
  });

  it('GET /products/changes — returns paginated changes', () => {
    return request(app.getHttpServer())
      .get('/products/changes')
      .set('x-api-key', API_KEY)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('GET /products/:id — returns 404 for non-existent product', () => {
    return request(app.getHttpServer())
      .get('/products/999999')
      .set('x-api-key', API_KEY)
      .expect(404);
  });

  it('GET /health — returns database and server health without API key', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'healthy');
        expect(res.body).toHaveProperty('database', 'connected');
        expect(res.body).toHaveProperty('timestamp');
      });
  });

  it('GET /products — rate limit triggers 429 Too Many Requests after exceeding threshold', async () => {
    let triggered = false;
    // We try to make up to 110 requests. We expect to hit a 429 status code.
    for (let i = 0; i < 110; i++) {
      const res = await request(app.getHttpServer())
        .get('/products')
        .set('x-api-key', API_KEY);
      if (res.status === 429) {
        triggered = true;
        break;
      }
      expect(res.status).toBe(200);
    }
    expect(triggered).toBe(true);
  });
});

import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('App (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: number;
  let postId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Cleanup sebelum test
    await prisma.post.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'test@test.com' } });
  });

  afterAll(async () => {
    // Cleanup setelah test
    await prisma.post.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'test@test.com' } });
    await app.close();
  });

  // ==================== AUTH ====================
  describe('Auth', () => {
    it('POST /auth/register → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test@test.com', password: '123456', name: 'Test' })
        .expect(201);

      expect(res.body.userId).toBeDefined();
      userId = res.body.userId;
    });

    it('POST /auth/login → 200 + token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: '123456' })
        .expect(200);

      expect(res.body.access_token).toBeDefined();
      authToken = res.body.access_token;
    });

    it('POST /auth/login → 401 wrong password', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpass' })
        .expect(401);
    });
  });

  // ==================== USERS ====================
  describe('Users', () => {
    it('GET /users → 200', async () => {
      const res = await request(app.getHttpServer()).get('/users').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /users/:id → 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(res.body.email).toBe('test@test.com');
    });

    it('PATCH /users/:id → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
    });
  });

  // ==================== POSTS ====================
  describe('Posts', () => {
    it('POST /posts → 401 tanpa token', async () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Test Post', content: 'Content' })
        .expect(401);
    });

    it('POST /posts → 201 dengan token', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Post', content: 'Content' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      postId = res.body.id;
    });

    it('GET /posts → 200', async () => {
      const res = await request(app.getHttpServer()).get('/posts').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /posts/:id → 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(res.body.title).toBe('Test Post');
    });

    it('PATCH /posts/:id → 200 dengan token', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Post' })
        .expect(200);

      expect(res.body.title).toBe('Updated Post');
    });

    it('DELETE /posts/:id → 200 dengan token', async () => {
      return request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  // ==================== USERS DELETE ====================
  describe('Users Delete', () => {
    it('DELETE /users/:id → 200', async () => {
      return request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(200);
    });
  });
});

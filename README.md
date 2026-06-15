# REST API — NestJS + PostgreSQL

A RESTful API built with NestJS and TypeScript, featuring JWT authentication and two related CRUD resources: **Users** and **Posts**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com/) (Node.js + TypeScript) |
| Database | PostgreSQL |
| ORM | TypeORM |
| Authentication | JWT (JSON Web Token) via `@nestjs/jwt` & `passport-jwt` |
| Validation | `class-validator` & `class-transformer` |
| Testing | Jest + Supertest (E2E) |
| API Docs | Postman Collection |

---

## Project Structure

```
src/
├── auth/                        # Authentication module
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts      # Passport JWT strategy
│   ├── guards/
│   │   └── jwt-auth.guard.ts    # JWT Guard decorator
│   ├── auth.controller.ts       # POST /auth/register, POST /auth/login
│   ├── auth.module.ts
│   └── auth.service.ts
│
├── users/                       # User module (CRUD)
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── entities/
│   │   └── user.entity.ts       # TypeORM entity
│   ├── users.repository.ts      # Database query logic
│   ├── users.controller.ts      # GET/POST/PATCH/DELETE /users
│   ├── users.module.ts
│   └── users.service.ts
│
├── posts/                       # Post module (CRUD, related to User)
│   ├── dto/
│   │   ├── create-post.dto.ts
│   │   └── update-post.dto.ts
│   ├── entities/
│   │   └── post.entity.ts       # TypeORM entity (FK → user)
│   ├── posts.repository.ts
│   ├── posts.controller.ts      # GET/POST/PATCH/DELETE /posts
│   ├── posts.module.ts
│   └── posts.service.ts
│
├── app.module.ts                # Root module
└── main.ts                      # Entry point

test/
└── auth.e2e-spec.ts             # E2E tests for JWT token flow
```

---

## Why Modular Layered Architecture?

This project uses a **Modular + Repository Pattern**, which is a combination of two principles that work naturally with NestJS.

### Modular Pattern

Every feature (auth, users, posts) lives inside its own self-contained **Module**. Each module owns its own Controller, Service, Repository, DTOs, and Entity. This means:

- Removing a feature = deleting one folder, nothing else breaks.
- Adding a feature = creating a new folder, without touching existing code.
- Dependencies between modules are explicit and declared via `imports:[]` in the module file.

### Layered Architecture (within each module)

Each module is internally divided into three layers with strict responsibilities:

```
HTTP Request
     ↓
JWT Guard          → Validates and decodes the token. Protects routes.
     ↓
Controller         → Receives HTTP request, parses input, returns HTTP response.
                     Does NOT contain business logic.
     ↓
Service            → Contains all business logic.
                     Does NOT know about HTTP or SQL.
     ↓
Repository         → Handles all database queries via TypeORM.
                     The only layer allowed to interact with the database.
     ↓
PostgreSQL DB
```

### Why this combination?

**Separation of Concerns** — each layer has exactly one job. If an HTTP status code needs to change, only the Controller is touched. If a SQL query needs to be optimised, only the Repository is touched. The Service is never affected by either change.

**Testability** — because the Repository is a separate injectable class, it can be mocked in tests. E2E tests and unit tests can run without a real database connection by swapping out the Repository with a mock.

**Scalability** — if the project grows and TypeORM needs to be replaced with Prisma or another ORM, only the Repository files need to be rewritten. The Service and Controller are completely unaffected.

**NestJS-native** — NestJS is built around modules and dependency injection. This pattern aligns directly with how the framework is designed, which means less boilerplate and better IDE/tooling support.

---

## How to Run

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <project-folder>
npm install
```

### 2. Configure environment variables

Create a `.env` file at the project root:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nestjs_db

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=3600s
```

### 3. Set up the database

Create the database in PostgreSQL:

```sql
CREATE DATABASE nestjs_db;
```

TypeORM will auto-create the tables on startup (`synchronize: true` in development).

### 4. Run the application

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`.

---

## API Documentation

The full API documentation is available as a **Postman Collection**.

📄 **[Import Postman Collection](https://purnomoarifdepok-7909888.postman.co/workspace/purnomo-arif's-Workspace~b86893af-d870-44ba-87d6-c7efccd247cf/collection/48193184-37554ea4-1166-4351-825a-d2cdb62be67c?action=share&creator=48193184)**
)**

### Endpoint Summary

#### Auth

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login and get JWT token | No |

#### Users

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/users` | Get all users | Yes |
| GET | `/users/:id` | Get user by ID | Yes |
| PATCH | `/users/:id` | Update user | Yes |
| DELETE | `/users/:id` | Delete user | Yes |

#### Posts

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/posts` | Create a post (tied to logged-in user) | Yes |
| GET | `/posts` | Get all posts | Yes |
| GET | `/posts/:id` | Get post by ID | Yes |
| PATCH | `/posts/:id` | Update post | Yes |
| DELETE | `/posts/:id` | Delete post | Yes |

### Using the JWT Token

After logging in, copy the `access_token` from the response and pass it in the `Authorization` header for all protected routes:

```
Authorization: Bearer <your_access_token>
```

---

## Running E2E Tests

The E2E tests cover the full JWT authentication flow: registering a user, logging in to get a token, and accessing a protected route.

### Run all E2E tests

```bash
npm run test:e2e
```

### What is tested

The `test/auth.e2e-spec.ts` file covers:

- `POST /auth/register` — registers a new user and expects HTTP 201
- `POST /auth/login` — logs in with valid credentials and expects a JWT `access_token` in the response
- `GET /posts` with a valid token — expects HTTP 200 (protected route accessible)
- `GET /posts` without a token — expects HTTP 401 (unauthorized)
- `GET /posts` with an invalid/expired token — expects HTTP 401

### Test environment

E2E tests use a separate test database. Configure the following in `.env.test`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nestjs_test_db
JWT_SECRET=test_secret
JWT_EXPIRES_IN=3600s
```

# Product Price Aggregator API

A NestJS-based API that aggregates pricing and availability data for digital products (e.g., e-books, software licenses, digital courses) from multiple third-party providers.

## Features

- ✅ Aggregates pricing & availability data from multiple simulated external providers
- ✅ Data normalization to ensure consistent structure
- ✅ Stores product history using PostgreSQL & Prisma
- ✅ Real-time updates using Server-Sent Events (SSE)
- ✅ Secure API with API key authentication (optional)
- ✅ Configurable data fetch interval via `.env`
- ✅ Swagger API Documentation
- ✅ Pagination & Filtering for Product Queries
- ✅ Unit & Integration Tests with Jest

## Tech Stack

- **Backend Framework:** NestJS (TypeScript)
- **Database ORM:** Prisma
- **Database:** PostgreSQL (Recommended: Docker)
- **Concurrency Handling:** NestJS Async Features
- **API Docs:** Swagger
- **Real-time Updates:** Server-Sent Events (SSE)
- **Testing Framework:** Jest
- **Configuration Management:** dotenv

## Setup Instructions

### 1. Clone the Repository

```sh
git clone https://github.com/omermohammed9/Technical-Assignment-Product-Price-Aggregator.git
cd product-price-aggregator
```

### 2. Install Dependencies

```sh
npm install
```

If dependency issues occur, try:

```sh
npm install --legacy-peer-deps
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory and configure the database:

```ini
DATABASE_URL=postgresql://user:password@localhost:5432/aggregator
DATA_FETCH_INTERVAL=300000 # Data aggregation interval in milliseconds (default: 5 mins)
API_KEY=your-secure-api-key # Optional for authentication middleware
```

### 4. Run PostgreSQL with Docker (Optional)

If you don’t have PostgreSQL installed, you can use Docker:

```sh
docker-compose up -d
```

Alternatively, manually set up PostgreSQL and update DATABASE_URL in `.env`.

### 5. Generate Prisma Client & Migrate Database

```sh
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Start the API

```sh
npm run start:dev
```

The API should now be running at http://localhost:3000 🚀

## API Documentation

Swagger API docs are available at:
[http://localhost:3000/api](http://localhost:3000/api)

## Pagination & Filtering

Use query parameters to filter products:

```pgsql
GET /products?name=book&minPrice=10&maxPrice=50&availability=true
```

Use pagination to limit the number of products per request:

```bash
GET /products?page=1&limit=10
```

## Running Tests

Run unit & integration tests:

```sh
npm run test
```

Run test coverage report:

```sh
npm run test:cov
```

## Environment-Based Configuration

Fetch interval is configurable via `.env`:

```ini
DATA_FETCH_INTERVAL=60000 # 1 minute
```

API Key Middleware (optional for security):

```ini
API_KEY=supersecureapikey
```

## Common Issues & Fixes

### 1. Prisma Client Not Found

```sh
Error: Cannot find module '.prisma/client'
```

**Fix:**

```sh
npx prisma generate
```


## Contributors

- **Your Name** - [GitHub](https://github.com/omermohammed9)
- **Project Requirements by:** DigitalZone

## License

This project is MIT Licensed.

# Hotel Guest Portal

A multi-tenant SaaS for hotels and restaurants to offer curated "around you" guidebooks via QR codes. 
Built on AWS with a serverless/containerized stack.

## Architecture
- **Infrastructure:** AWS CDK (TypeScript)
- **Database:** PostgreSQL (Amazon RDS) with Row Level Security for tenant isolation.
- **Backend:** Node.js (Fastify) running on ECS Fargate.
- **Frontend:** Next.js (App Router) on AWS Amplify Hosting.
- **Auth:** Amazon Cognito.

## Prerequisites
- Node.js 18+
- pnpm 8+
- Docker and Docker Compose

## Local Development Setup

1. **Start infrastructure (Postgres and LocalStack for S3):**
   ```bash
   pnpm run dev:db
   ```
   This will automatically run database migrations and insert seed data for 2 organizations.

2. **Run API tenant-isolation tests:**
   ```bash
   pnpm run test:isolation
   ```

3. **Stop infrastructure:**
   ```bash
   pnpm run stop:db
   ```

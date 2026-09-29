# Handover Document: Hotel Guest Portal

## System Architecture

This project is a multi-tenant platform for hotels to provide curated local guides via QR codes.

- **Frontend**: Next.js App Router (React Server Components), Tailwind CSS, Lucide icons. Hosted on Vercel or AWS Amplify.
- **Backend API**: Fastify API on Node.js. Validates everything via Zod. Uses PostgreSQL for persistent storage.
- **Database**: PostgreSQL 15 with **Row Level Security (RLS)**. All API requests are scoped to a specific tenant/role via transactions to guarantee data isolation.
- **Infrastructure (CDK)**: AWS CDK template (`infra/lib/infra-stack.ts`) for deploying RDS, Fargate, Cognito, and S3.

## How to Run Locally

You do not need an AWS account or API keys to run the application locally.

1. **Start the database:**
   ```bash
   docker compose down -v
   docker compose up -d db
   ```
   *This starts Postgres and automatically runs the `infra/db/init/` SQL scripts to create tables, RLS policies, and seed data.*

2. **Start the API:**
   ```bash
   cd apps/api
   pnpm install
   pnpm run dev
   ```
   *The API will run on `http://127.0.0.1:3001`.*

3. **Start the Web App:**
   ```bash
   cd apps/web
   pnpm install
   pnpm run dev
   ```
   *The Web app will run on `http://localhost:3000`.*

### Local Portals

- **Guest Portal (Taj West End)**: `http://localhost:3000/h/taj-west-end`
- **Guest Portal (Mysuru Heritage)**: `http://localhost:3000/h/mysuru-heritage-lodge`
- **Client Admin**: `http://localhost:3000/admin` (Automatically bypasses Cognito locally using a mock header to view Taj's properties)
- **Super Admin**: `http://localhost:3000/super` (Automatically bypasses Cognito locally using a mock header)

## AWS Deployment (Production)

To deploy to AWS, you need AWS credentials configured (`aws configure`).

1. `cd infra`
2. `npm install`
3. `npx cdk bootstrap aws://ACCOUNT_ID/REGION`
4. `npx cdk deploy`

This will provision:
- Amazon RDS Postgres Instance (T3 Micro)
- Cognito User Pool & Groups
- Application Load Balancer & Fargate Service for the Fastify API
- S3 Bucket for image uploads with CloudFront distribution

### Monthly Cost Estimate (ap-south-1)
- **RDS (db.t3.micro Single-AZ)**: ~$15/mo
- **Fargate (0.25 vCPU, 0.5 GB)**: ~$9/mo
- **Application Load Balancer**: ~$16/mo
- **NAT Gateway (if using private subnets)**: ~$33/mo
- **Cognito, S3, CloudFront**: Mostly free tier or <$5/mo at low volume.
*Estimated Total: ~$78/month* 
(You can reduce this by removing the NAT Gateway and placing Fargate in public subnets, reducing cost by $33/mo).

## Adding a Client & Secrets

- **Secrets**: Use AWS Secrets Manager for the DB password and Google Maps API keys. Inject them into the ECS task definition environment variables.
- **Add a Client**: 
  1. Login as Super Admin.
  2. Click "Invite New Client" to create the organization.
  3. Enter their email. AWS SES will send an invitation email via Cognito.
  4. The client clicks the link, sets a password, and gains access to their isolated tenant.

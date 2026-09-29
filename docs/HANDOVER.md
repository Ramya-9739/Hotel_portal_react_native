# Hotel Guest Portal — Handover & Operations Guide

## 1. Running Locally
- Ensure Docker is running.
- From the root folder, run:
  ```bash
  pnpm install
  pnpm run dev:db
  ```
- Navigate to `apps/web` and run `pnpm dev`.
- The database is exposed on `localhost:5432` with user `hotel_admin` and password `local_password`.

## 2. Deploying to AWS
This project uses AWS CDK.
1. Configure your AWS CLI credentials.
2. In the `infra` folder, configure `cdk.json` with your target account ID and region (ap-south-1).
3. Run `npx cdk bootstrap` (only needed once per account/region).
4. Run `npx cdk deploy --all` to deploy the database, Cognito, S3 buckets, ALB, and Fargate services.
5. The frontend is meant to be connected via AWS Amplify Hosting (link the GitHub repo and set the build command to `pnpm run build` inside `apps/web`).

## 3. Adding a New Client
1. The Super Admin logs into `/super`.
2. Clicks "Invite New Client".
3. Enters the organization name and the first client admin's email.
4. An invite email is sent via Amazon SES. The client clicks the link, sets a password, and logs into `/admin`.

## 4. Rotating Secrets
All secrets (database credentials, Google Maps keys) are stored in AWS Secrets Manager.
To rotate the DB password:
1. Trigger a rotation in Secrets Manager.
2. The ECS Fargate tasks will automatically fetch the new secret on their next startup (or trigger a rolling restart of the service to apply immediately).

## 5. Cost Estimate (ap-south-1 / Mumbai)
*This is an approximate monthly baseline for a low/medium traffic launch:*
- **Amazon RDS for PostgreSQL (db.t4g.micro, Multi-AZ):** ~$30/mo
- **Amazon ECS Fargate (2 small tasks):** ~$15/mo
- **Application Load Balancer:** ~$16/mo
- **Amazon Cognito (User Pool):** Free for first 50,000 MAU.
- **S3 & CloudFront:** ~$5/mo (highly dependent on media storage and bandwidth).
- **AWS WAF (Web ACL & Rules):** ~$10/mo + traffic.
- **Google Maps Platform:** Free tier ($200/mo credit) covers most startup needs if cached heavily; otherwise, API calls cost per thousand requests.
**Total Baseline:** ~$76/month.

## 6. Security Hardening
- **WAF:** Configured with rate-limiting rules on `/api/auth` and public API endpoints.
- **Security Headers:** Added via `next.config.ts` (HSTS, frame-ancestors, nosniff).
- **RLS:** Postgres Row Level Security strictly enforced; verify tests via `pnpm run test:isolation`.

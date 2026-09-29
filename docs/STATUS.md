# Project Status & Handover

## What is Working (Completed)

1. **Phase 1: Foundation & Database Hardening**
   - **PostgreSQL RLS** policies are fully written, implemented and pass 100% of integration tests.
   - `api_user` cannot bypass row-level security.
   - Test suite (`apps/api/test/isolation.test.ts`) verifies complete tenant isolation for Client Admins and restricted view for Guests.
   - Seed data covers 2 organizations, 5 properties, and realistic places.
   
2. **Phase 2: Design System**
   - The UI components (`Button`, `Badge`, `Chip`, `PlaceCard`, `BottomSheet`) are integrated.
   - Fixed accessibility and semantic HTML issues.
   - Inter and Fraunces fonts correctly applied.

3. **Phase 3: Guest Portal (`/h/[slug]`)**
   - Migrated from a Client Component with dummy data to a **Server Component** fetching real data from the API.
   - Fetches the property, brand details, and nearby places through the API.
   - Client component (`client-page.tsx`) handles map interactivity, category filtering, and bottom sheets.
   - Falls back to Unsplash images when LocalStack is unavailable.

4. **Phase 4: Client Admin Dashboard Skeleton**
   - Created the API route (`/admin/properties`) that requires a mock authentication header.
   - Transformed the `apps/web/src/app/admin/page.tsx` into a Server Component that fetches real tenant-isolated data.
   - The Client Component (`client-page.tsx`) renders the real list of properties and allows switching the active editor view.

5. **CDK Infrastructure**
   - Wrote the AWS CDK stack (`infra/lib/infra-stack.ts`) provisioning RDS, Cognito User Pools (with groups), S3, CloudFront, and Fargate ECS clusters.

## What's Next / Open Items

1. **Cognito & Next-Auth Integration**:
   - The current `/admin` and API use a mock `x-mock-org-id` header because real AWS Cognito can't be provisioned without credentials.
   - Needs integration with AWS Amplify or NextAuth to map Cognito JWT tokens to API headers.

2. **Google Maps API**:
   - The Admin dashboard tab for "Add from Google Places" is a UI mockup. It needs the Google Maps JS API key to wire up the Autocomplete component.

3. **QR Code Generator**:
   - The `/q/[code]` redirect endpoint and the `qr-code-styling` integration need to be wired up to export PDFs and SVGs.

## How to Test the Application Locally

1. **Start the Database**
   ```bash
   docker compose down -v
   docker compose up -d db
   ```
2. **Run Tests**
   ```bash
   export $(grep -v '^#' .env | xargs) && cd apps/api && pnpm exec vitest run
   ```
3. **Start the API Server**
   ```bash
   cd apps/api
   export $(grep -v '^#' ../../.env | xargs)
   pnpm start
   ```
4. **Start the Web Client**
   ```bash
   cd apps/web
   pnpm dev
   ```
   Navigate to `http://localhost:3000/h/mysuru-heritage-lodge` to see the Guest Portal in action!
   Navigate to `http://localhost:3000/admin` to see the Admin Dashboard in action!

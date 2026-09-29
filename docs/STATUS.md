# Hotel Guest Portal — Implementation Status

## Infrastructure
| Feature | Status | Notes |
|---|---|---|
| Monorepo & pnpm workspace | Done | Built and functioning |
| Docker Compose (Postgres, LocalStack) | Done | Built and functioning |
| DB Schema & Tenancy (RLS) | Partial | Created, but RLS policies have security gaps (cross-tenant read/writes allowed) |
| Isolation Tests | Partial | Created, but assertions are weak and incomplete |
| AWS CDK Stack | Not started | Scaffolded only; empty template |
| Secrets Manager / SES | Not started | |
| Cost Estimate | Not started | To be estimated after infrastructure exists |

## Web Application (`apps/web`)
| Feature | Status | Notes |
|---|---|---|
| Design Tokens & UI Components | Partial | Exists, but needs tap target and font fixes |
| Fastify API Server | Not started | |
| Cognito Login | Not started | |
| Guest Portal (`/h/[slug]`) | Partial | UI built with dummy data. Needs real API and layout fixes |
| Client Admin (`/admin`) | Partial | Static mockups only |
| Super Admin (`/super`) | Partial | Static mockups only |
| QR Studio | Partial | Color picker mockup only; no real generation |
| Hardening (WAF, rate limits) | Not started | Security headers added to Next.js config, nothing else |

# Cursor AI Rules

1. Always generate Supabase-compatible code (client-side + SQL)
2. All API keys must be read from `.env.local`
3. Database changes must use Supabase migration syntax
4. OAuth (QuickBooks) must be handled with API routes or Edge Functions
5. All users are "Traders" who create and manage their own data
6. Clients do not log in
7. Orders can be assigned to:
   - The trader (self)
   - A worker (linked to the trader)
8. Display full order, service, and client data in admin dashboard
9. No untyped JS — use full TypeScript in all files
10. UI should be clean, minimal, and mobile responsive using Tailwind + ShadCN

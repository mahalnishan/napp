# Effortless - Work Order Management System

A modern, full-stack work order management system built for contractors and service businesses. Built with Next.js 15, Supabase, and TypeScript.

## Features

### 📋 Work Orders Management
- Create, edit, and delete work orders
- Assign orders to workers or self
- Schedule orders with date/time
- Track order status and payment status
- Multiple services per order with quantities

### 👥 Clients Management
- Add, edit, and delete clients
- Contact information (name, email, phone, address)
- Client types (Individual, Company, Cash, Contractor, etc.)
- Active/Inactive status management
- Search and filter clients by status
- Only active clients appear in order creation

### 🛠️ Services Management
- Create and manage service offerings
- Set pricing for each service
- Search and filter services

### 👷 Workers Management
- Add, edit, and delete workers
- Assign workers to orders
- Contact information management

### ⚙️ Settings
- Account preferences
- Default order status
- Workers management

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS, ShadCN UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **Forms**: React Hook Form with Zod validation

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd effortless
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Run the database migration:

```bash
# Copy the migration file to your Supabase project
# Or use Supabase CLI if you have it installed
supabase db push
```

4. **Set up Storage for Avatar Uploads:**
   - Go to Storage in your Supabase dashboard
   - Create a new bucket named `avatars`
   - Set the bucket to public (so avatar images can be accessed)
   - Configure RLS policies if needed for security
   - **Add RLS Policy for Uploads:**
     - Go to Storage > Policies in your Supabase dashboard
     - Click on the `avatars` bucket
     - Add a new policy with these settings:
       - Policy Name: `Allow authenticated users to upload avatars`
       - Allowed operation: `INSERT`
       - Target roles: `authenticated`
       - Policy definition: `(bucket_id = 'avatars')`
     - Add another policy for reading:
       - Policy Name: `Allow public to view avatars`
       - Allowed operation: `SELECT`
       - Target roles: `public`
       - Policy definition: `(bucket_id = 'avatars')`
     - Add a policy for updating:
       - Policy Name: `Allow authenticated users to update avatars`
       - Allowed operation: `UPDATE`
       - Target roles: `authenticated`
       - Policy definition: `(bucket_id = 'avatars')`
     - Add a policy for deleting:
       - Policy Name: `Allow authenticated users to delete avatars`
       - Allowed operation: `DELETE`
       - Target roles: `authenticated`
       - Policy definition: `(bucket_id = 'avatars')`

### 4. Configure environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# QuickBooks Integration (Optional)
# You can also use these alternative variable names:
# CLIENT_ID=your_quickbooks_client_id_here
# CLIENT_SECRET=your_quickbooks_client_secret_here
# ENVIRONMENT=sandbox
# REDIRECT_URL=http://localhost:3000/api/quickbooks/callback
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id_here
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret_here
QUICKBOOKS_ENVIRONMENT=sandbox
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
```

### 5. Set up QuickBooks Integration (Optional)

To enable QuickBooks integration for customer and invoice syncing:

1. **Create a QuickBooks Developer Account**
   - Go to [developer.intuit.com](https://developer.intuit.com)
   - Sign up for a developer account
   - Create a new app

2. **Configure your QuickBooks App**
   - Set the redirect URI to: `http://localhost:3000/api/quickbooks/callback` (for development)
   - For production, use: `https://yourdomain.com/api/quickbooks/callback`
   - Enable the "Accounting" scope

3. **Get your App Credentials**
   - Copy your Client ID and Client Secret
   - Add them to your `.env.local` file

4. **Set Environment**
   - Use `sandbox` for development and testing
   - Use `production` for live QuickBooks companies

5. **Test the Integration**
   - Run the app and go to Dashboard > Settings
   - Click "Connect to QuickBooks" to test the OAuth flow
   - Use the sandbox company for testing

### 6. Assign existing users to free tier (if needed)

If you have existing users in your database who don't have subscriptions, you can automatically assign them to the free tier:

**Option 1: Run the SQL migration (recommended)**
```bash
# Apply the migration to your Supabase database
# This will automatically assign all existing users to the free tier
```

**Option 2: Run the Node.js script**
```bash
# Make sure you have the SUPABASE_SERVICE_ROLE_KEY in your .env.local
npm run assign-free-tier
```

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

### Deploying to Vercel

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js project

3. **Configure Environment Variables in Vercel**
   - In your Vercel project dashboard, go to Settings > Environment Variables
   - Add the following environment variables:
   
   **Required:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

4. **Deploy**
   - Vercel will automatically deploy your app
   - Each push to your main branch will trigger a new deployment

### Important Notes for Deployment

- **Environment Variables**: Make sure all environment variables are set in Vercel before deploying
- **Supabase URL**: Use your production Supabase project URL, not localhost
- **Service Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` is required for admin operations like account deletion. Get this from your Supabase project Settings > API > Project API keys > service_role
- **CORS**: If you encounter CORS issues, check your Supabase project settings

### Troubleshooting Deployment

If you encounter build errors:
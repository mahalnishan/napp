# nApp

A full-stack work order management application built with Next.js and Supabase. Manage your work orders, clients, services, and workers with a clean, modern interface.

## Features

### 🔐 Authentication
- Supabase Auth with email/password
- Protected routes with middleware
- User session management

### 📊 Dashboard
- Overview statistics (orders, clients, services, revenue)
- Recent orders with status indicators
- Quick access to create new orders

### 📋 Orders Management
- Create and manage work orders
- Assign orders to self or workers
- Schedule orders with date/time
- Track order status and payment status
- Multiple services per order with quantities
- Optional QuickBooks invoice creation

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
- Link services to QuickBooks items
- Search and filter services

### 👷 Workers Management
- Add, edit, and delete workers
- Assign workers to orders
- Contact information management

### ⚙️ Settings
- QuickBooks OAuth integration
- Account preferences
- Default order status
- Workers management

### 🔗 QuickBooks Integration
- OAuth2 authentication
- Automatic invoice creation
- Payment status synchronization
- Token refresh handling

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
- QuickBooks Developer account (for QuickBooks integration)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd napp
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

### 4. Set up QuickBooks Integration (Optional)

1. Create a QuickBooks app in the [Intuit Developer Portal](https://developer.intuit.com/)
2. Configure OAuth settings:
   - Redirect URI: `http://localhost:3000/api/quickbooks/callback` (for development)
   - Scopes: `com.intuit.quickbooks.accounting`
3. Note your Client ID and Client Secret

### 5. Configure environment variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# QuickBooks Integration (Optional)
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
```

### 6. Run the development server

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
   NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
   ```
   
   **Optional (for QuickBooks integration):**
   ```
   QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
   QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
   NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
   QUICKBOOKS_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/quickbooks/callback
   ```

4. **Deploy**
   - Vercel will automatically deploy your app
   - Each push to your main branch will trigger a new deployment

### Important Notes for Deployment

- **Environment Variables**: Make sure all environment variables are set in Vercel before deploying
- **Supabase URL**: Use your production Supabase project URL, not localhost
- **QuickBooks Redirect URI**: Update your QuickBooks app settings to include your production domain
- **CORS**: If you encounter CORS issues, check your Supabase project settings

### Troubleshooting Deployment

If you encounter build errors:

1. **Check Environment Variables**: Ensure all required environment variables are set in Vercel
2. **Supabase Connection**: Verify your Supabase project is active and accessible
3. **Build Logs**: Check the Vercel build logs for specific error messages
4. **Database Migration**: Ensure your database schema is properly set up in Supabase

## Database Schema

The application uses the following main tables:

- **users**: Extended Supabase auth users
- **workers**: Workers who can be assigned to orders
- **clients**: Customer contact information
- **services**: Service offerings with pricing
- **work_orders**: Main orders with scheduling and status
- **work_order_services**: Junction table for order services
- **quickbooks_integrations**: OAuth tokens and connection info

## API Routes

- `/api/quickbooks/auth` - QuickBooks OAuth initiation
- `/api/quickbooks/callback` - OAuth callback handler
- `/api/quickbooks/create-invoice` - Create QuickBooks invoice
- `/api/quickbooks/webhook` - Webhook handler for payment updates
- `/api/quickbooks/test` - Test QuickBooks integration status

## QuickBooks Integration Setup

### Step-by-Step QuickBooks Setup

1. **Create QuickBooks App**
   - Go to [Intuit Developer Portal](https://developer.intuit.com/)
   - Create a new app
   - Choose "OAuth 2.0" as the app type
   - Select "QuickBooks Online" as the product

2. **Configure OAuth Settings**
   - Development Redirect URI: `http://localhost:3000/api/quickbooks/callback`
   - Production Redirect URI: `https://yourdomain.com/api/quickbooks/callback`
   - Scopes: `com.intuit.quickbooks.accounting`

3. **Get Credentials**
   - Copy your Client ID and Client Secret
   - Add them to your `.env.local` file

4. **Test Integration**
   - Start your development server
   - Go to Settings page in your app
   - Click "Connect QuickBooks"
   - Complete the OAuth flow

5. **Verify Connection**
   - Visit `/api/quickbooks/test` to check integration status
   - Create a test order with QuickBooks invoice option

### QuickBooks Features

- **Automatic Invoice Creation**: When creating orders, optionally create invoices in QuickBooks
- **Payment Status Sync**: Webhooks update payment status when invoices are paid
- **Service Linking**: Link your services to QuickBooks items
- **Token Refresh**: Automatic token refresh when expired

## Troubleshooting

### Common Issues

1. **"Unable to create clients, orders, or anything"**
   - Check that your `.env.local` file exists and has the correct Supabase credentials
   - Ensure the database migration has been run in your Supabase project
   - Check the browser console for any JavaScript errors
   - Verify that Row Level Security (RLS) policies are properly set up

2. **"Supabase connection failed"**
   - Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
   - Check that your Supabase project is active and not paused
   - Ensure your IP is not blocked by Supabase

3. **"Authentication errors"**
   - Make sure the `handle_new_user()` trigger is properly set up in your database
   - Check that the `users` table exists and has the correct structure
   - Verify RLS policies are enabled and configured correctly

4. **"QuickBooks integration not working"**
   - Ensure QuickBooks environment variables are set
   - Check that your QuickBooks app is properly configured
   - Verify the redirect URI matches your app URL
   - Test the integration using `/api/quickbooks/test`

5. **"QuickBooks OAuth failed"**
   - Verify your Client ID and Client Secret are correct
   - Check that your redirect URI is exactly matched in QuickBooks app settings
   - Ensure your app is in development mode (not production)
   - Check that the required scopes are enabled

6. **"Storage RLS policy error" or "Avatar upload failed"**
   - Ensure the `avatars` bucket exists in your Supabase Storage
   - Verify the bucket is set to public
   - Check that all required RLS policies are configured:
     - INSERT policy for authenticated users
     - SELECT policy for public access
     - UPDATE policy for authenticated users
     - DELETE policy for authenticated users
   - Use the "Test Storage" button in Settings to debug connection issues
   - Check browser console for detailed error messages
   - Ensure your user is properly authenticated

### Debugging Steps

1. **Check Environment Variables**
   ```bash
   # Make sure .env.local exists and has the right values
   cat .env.local
   ```

2. **Test QuickBooks Integration**
   ```bash
   # Visit this URL when logged in to test QuickBooks setup
   curl http://localhost:3000/api/quickbooks/test
   ```
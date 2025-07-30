# Full-Stack Work Order Management App - Complete Workflow

## Overview
This workflow will guide you through building a complete work order management system similar to "Effortless" from scratch. The app will include client management, work orders, services, workers, authentication, and payment processing.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS, ShadCN UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth (Google OAuth)
- **Payments**: Stripe
- **Forms**: React Hook Form with Zod validation

---

## Phase 1: Project Setup & Foundation

### Step 1: Initialize Next.js Project
```bash
npx create-next-app@latest work-order-app --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd work-order-app
```

### Step 2: Install Core Dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr @supabase/auth-helpers-nextjs
npm install @stripe/stripe-js stripe
npm install react-hook-form @hookform/resolvers zod
npm install date-fns axios clsx class-variance-authority tailwind-merge
npm install lucide-react recharts
```

### Step 3: Install UI Components (ShadCN)
```bash
npx shadcn@latest init
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add toast
npx shadcn@latest add table
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add progress
```

### Step 4: Setup Environment Variables
Create `.env.local`:
```bash
touch .env.local
```

Add these variables (replace with your actual values):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Setup TypeScript Configuration
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Phase 2: Database Setup (Supabase)

### Step 6: Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Get your project URL and anon key
4. Update `.env.local` with your credentials

### Step 7: Database Schema Setup
Create these SQL files and run them in Supabase SQL Editor:

**Create `schema.sql`:**
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'cancelled')),
  subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  client_type TEXT DEFAULT 'Individual' CHECK (client_type IN ('Individual', 'Company', 'Cash', 'Contractor')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workers table
CREATE TABLE workers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work_orders table
CREATE TABLE work_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work_order_services table (many-to-many)
CREATE TABLE work_order_services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_workers_user_id ON workers(user_id);
CREATE INDEX idx_work_orders_user_id ON work_orders(user_id);
CREATE INDEX idx_work_orders_client_id ON work_orders(client_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_order_services_work_order_id ON work_order_services(work_order_id);
```

### Step 8: Row Level Security (RLS) Setup
**Create `rls_policies.sql`:**
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_services ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Clients policies
CREATE POLICY "Users can manage own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- Services policies
CREATE POLICY "Users can manage own services" ON services
  FOR ALL USING (auth.uid() = user_id);

-- Workers policies
CREATE POLICY "Users can manage own workers" ON workers
  FOR ALL USING (auth.uid() = user_id);

-- Work orders policies
CREATE POLICY "Users can manage own work orders" ON work_orders
  FOR ALL USING (auth.uid() = user_id);

-- Work order services policies
CREATE POLICY "Users can manage own work order services" ON work_order_services
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM work_orders 
      WHERE id = work_order_services.work_order_id
    )
  );
```

### Step 9: Database Functions
**Create `functions.sql`:**
```sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_count INTEGER;
  order_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO order_count FROM work_orders;
  order_number := 'WO-' || LPAD(order_count::TEXT, 6, '0');
  RETURN order_number;
END;
$$ LANGUAGE plpgsql;
```

---

## Phase 3: Authentication Setup

### Step 10: Supabase Client Configuration
**Create `lib/supabase/client.ts`:**
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => createClientComponentClient()
```

**Create `lib/supabase/server.ts`:**
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerClient = () => {
  return createServerComponentClient({ cookies })
}
```

### Step 11: Middleware Setup
**Create `middleware.ts`:**
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
  const isPublicPage = req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/info')

  if (!session && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### Step 12: Authentication Pages
**Create `app/auth/login/page.tsx`:**
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      alert(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Sign In</h2>
        
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full"
        >
          Sign in with Google
        </Button>

        <p className="text-center text-sm">
          Don't have an account?{' '}
          <a href="/auth/signup" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
```

### Step 13: Auth Callback
**Create `app/auth/callback/route.ts`:**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
```

---

## Phase 4: Core Application Structure

### Step 14: Layout and Navigation
**Create `app/layout.tsx`:**
```typescript
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Work Order Management',
  description: 'Professional work order management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

**Create `components/Layout/DashboardLayout.tsx`:**
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link href="/dashboard" className="flex items-center px-3 py-2 text-gray-900 hover:text-blue-600">
                Dashboard
              </Link>
              <Link href="/dashboard/work-orders" className="flex items-center px-3 py-2 text-gray-900 hover:text-blue-600">
                Work Orders
              </Link>
              <Link href="/dashboard/clients" className="flex items-center px-3 py-2 text-gray-900 hover:text-blue-600">
                Clients
              </Link>
              <Link href="/dashboard/services" className="flex items-center px-3 py-2 text-gray-900 hover:text-blue-600">
                Services
              </Link>
              <Link href="/dashboard/workers" className="flex items-center px-3 py-2 text-gray-900 hover:text-blue-600">
                Workers
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <Button onClick={handleLogout} variant="ghost" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
```

### Step 15: Dashboard Main Page
**Create `app/dashboard/page.tsx`:**
```typescript
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { createServerClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = createServerClient()
  
  // Fetch dashboard stats
  const { data: workOrders } = await supabase
    .from('work_orders')
    .select('*')
  
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)

  const stats = {
    totalOrders: workOrders?.length || 0,
    pendingOrders: workOrders?.filter(order => order.status === 'pending').length || 0,
    activeClients: clients?.length || 0,
    completedOrders: workOrders?.filter(order => order.status === 'completed').length || 0,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalOrders}</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Pending Orders</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Active Clients</h3>
            <p className="text-3xl font-bold text-green-600">{stats.activeClients}</p>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900">Completed Orders</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.completedOrders}</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
```

---

## Phase 5: Core Features Implementation

### Step 16: Clients Management
**Create `app/dashboard/clients/page.tsx`:**
```typescript
import DashboardLayout from '@/components/Layout/DashboardLayout'
import ClientsList from '@/components/Clients/ClientsList'

export default function ClientsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        </div>
        <ClientsList />
      </div>
    </DashboardLayout>
  )
}
```

**Create `components/Clients/ClientsList.tsx`:**
```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ClientForm from './ClientForm'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  client_type: string
  is_active: boolean
}

export default function ClientsList() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const supabase = createClient()

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
    } else {
      setClients(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setShowForm(true)
  }

  const handleDelete = async (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) {
        alert('Error deleting client')
      } else {
        fetchClients()
      }
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingClient(null)
    fetchClients()
  }

  if (loading) {
    return <div>Loading clients...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">All Clients</h2>
        <Button onClick={() => setShowForm(true)}>Add Client</Button>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{client.name}</h3>
                  <Badge variant={client.is_active ? 'default' : 'secondary'}>
                    {client.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{client.client_type}</Badge>
                </div>
                <p className="text-sm text-gray-600">{client.email}</p>
                <p className="text-sm text-gray-600">{client.phone}</p>
                <p className="text-sm text-gray-600">{client.address}</p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(client)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(client.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
```

### Step 17: Continue with Services, Workers, and Work Orders
Follow similar patterns for:
- Services management (`app/dashboard/services/`)
- Workers management (`app/dashboard/workers/`)
- Work Orders management (`app/dashboard/work-orders/`)

Each should include:
- List components
- Form components
- CRUD operations
- State management

---

## Phase 6: Advanced Features

### Step 18: Stripe Payment Integration
**Create `lib/stripe.ts`:**
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})
```

**Create payment webhook `app/api/stripe/webhook/route.ts`:**
```typescript
import { stripe } from '@/lib/stripe'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    // Update work order payment status
    // Implementation details...
  }

  return NextResponse.json({ received: true })
}
```

### Step 19: PDF Generation for Invoices
```bash
npm install jspdf html2canvas
```

### Step 20: Email Notifications
```bash
npm install nodemailer @types/nodemailer
```

### Step 21: File Uploads (for work order attachments)
Configure Supabase Storage buckets and implement upload functionality.

---

## Phase 7: Testing & Deployment

### Step 22: Testing Setup
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Step 23: Build and Optimize
```bash
npm run build
npm run start
```

### Step 24: Deployment (Vercel)
```bash
npm install -g vercel
vercel --prod
```

Configure environment variables in Vercel dashboard.

---

## Phase 8: Additional Features (Optional)

### Step 25: Advanced Features
- Real-time notifications using Supabase Realtime
- Mobile app using React Native
- Advanced reporting and analytics
- Multi-tenant support
- API documentation with Swagger
- Automated backups
- Performance monitoring

---

## Package.json Scripts Reference
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "generate:types": "supabase gen types typescript --local > types/database.types.ts"
  }
}
```

---

## Final Checklist
- [ ] Project setup and dependencies installed
- [ ] Database schema created and RLS configured
- [ ] Authentication system implemented
- [ ] Core CRUD operations for all entities
- [ ] Dashboard with analytics
- [ ] Payment processing integrated
- [ ] File upload functionality
- [ ] Email notifications
- [ ] PDF generation for invoices
- [ ] Mobile-responsive design
- [ ] Error handling and validation
- [ ] Testing suite
- [ ] Production deployment
- [ ] Environment variables configured
- [ ] Database backups configured

This workflow provides a complete roadmap for building a professional work order management system. Follow each phase sequentially, and you'll have a fully functional application ready for production use.
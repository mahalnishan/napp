-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE order_status AS ENUM ('Pending', 'In Progress', 'Completed', 'Cancelled', 'Archived');
CREATE TYPE payment_status AS ENUM ('Unpaid', 'Pending Invoice', 'Paid');
CREATE TYPE assigned_to_type AS ENUM ('Self', 'Worker');


-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- QuickBooks integration fields
    quickbooks_access_token TEXT,
    quickbooks_refresh_token TEXT,
    quickbooks_realm_id TEXT,
    quickbooks_connected_at TIMESTAMP WITH TIME ZONE
);

-- Create workers table
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    client_type VARCHAR(100) DEFAULT 'Individual',
    is_active BOOLEAN DEFAULT true,
    quickbooks_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quickbooks_service_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work orders table
CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    assigned_to_type assigned_to_type NOT NULL DEFAULT 'Self',
    assigned_to_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
    status order_status NOT NULL DEFAULT 'Pending',
    schedule_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    order_amount DECIMAL(10,2) NOT NULL,
    order_payment_status payment_status NOT NULL DEFAULT 'Unpaid',
    quickbooks_invoice_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work order services junction table
CREATE TABLE IF NOT EXISTS public.work_order_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client tags junction table
CREATE TABLE IF NOT EXISTS public.client_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, tag_id)
);

-- Create QuickBooks integrations table
CREATE TABLE IF NOT EXISTS public.quickbooks_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    realm_id TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON public.workers(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON public.services(user_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_user_id ON public.work_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_client_id ON public.work_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to_id ON public.work_orders(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_schedule_date_time ON public.work_orders(schedule_date_time);
CREATE INDEX IF NOT EXISTS idx_work_order_services_work_order_id ON public.work_order_services(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_services_service_id ON public.work_order_services(service_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_client_tags_client_id ON public.client_tags(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tags_tag_id ON public.client_tags(tag_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Workers policies
CREATE POLICY "Users can view own workers" ON public.workers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workers" ON public.workers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workers" ON public.workers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workers" ON public.workers FOR DELETE USING (auth.uid() = user_id);

-- Clients policies
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Services policies
CREATE POLICY "Users can view own services" ON public.services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own services" ON public.services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own services" ON public.services FOR DELETE USING (auth.uid() = user_id);

-- Work orders policies
CREATE POLICY "Users can view own work orders" ON public.work_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work orders" ON public.work_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work orders" ON public.work_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own work orders" ON public.work_orders FOR DELETE USING (auth.uid() = user_id);

-- Work order services policies
CREATE POLICY "Users can view own work order services" ON public.work_order_services FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.work_orders 
        WHERE work_orders.id = work_order_services.work_order_id 
        AND work_orders.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own work order services" ON public.work_order_services FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.work_orders 
        WHERE work_orders.id = work_order_services.work_order_id 
        AND work_orders.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update own work order services" ON public.work_order_services FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.work_orders 
        WHERE work_orders.id = work_order_services.work_order_id 
        AND work_orders.user_id = auth.uid()
    )
);
CREATE POLICY "Users can delete own work order services" ON public.work_order_services FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.work_orders 
        WHERE work_orders.id = work_order_services.work_order_id 
        AND work_orders.user_id = auth.uid()
    )
);

-- Tags policies
CREATE POLICY "Users can view own tags" ON public.tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Client tags policies
CREATE POLICY "Users can view own client tags" ON public.client_tags FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE clients.id = client_tags.client_id 
        AND clients.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own client tags" ON public.client_tags FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE clients.id = client_tags.client_id 
        AND clients.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update own client tags" ON public.client_tags FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE clients.id = client_tags.client_id 
        AND clients.user_id = auth.uid()
    )
);
CREATE POLICY "Users can delete own client tags" ON public.client_tags FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE clients.id = client_tags.client_id 
        AND clients.user_id = auth.uid()
    )
);

-- QuickBooks integrations policies
CREATE POLICY "Users can view own QuickBooks integration" ON public.quickbooks_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own QuickBooks integration" ON public.quickbooks_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own QuickBooks integration" ON public.quickbooks_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own QuickBooks integration" ON public.quickbooks_integrations FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quickbooks_integrations_updated_at BEFORE UPDATE ON public.quickbooks_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 
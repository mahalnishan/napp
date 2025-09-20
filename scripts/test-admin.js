#!/usr/bin/env node

/**
 * Simple script to test admin panel functionality
 * This script helps you verify that the admin panel is working correctly
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAdminPanel() {
  try {
    console.log('🔍 Testing admin panel data access...')
    
    // Test basic data fetching
    console.log('\n📊 Testing data queries:')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, created_at, role')
      .limit(5)

    if (usersError) {
      console.error('❌ Users query failed:', usersError.message)
    } else {
      console.log(`✅ Users: Found ${users?.length || 0} users`)
      if (users && users.length > 0) {
        console.log('   Sample user:', users[0].email)
      }
    }

    const { data: orders, error: ordersError } = await supabase
      .from('work_orders')
      .select('id, title, order_amount, created_at')
      .limit(5)

    if (ordersError) {
      console.error('❌ Orders query failed:', ordersError.message)
    } else {
      console.log(`✅ Orders: Found ${orders?.length || 0} orders`)
      if (orders && orders.length > 0) {
        console.log('   Sample order:', orders[0].title)
      }
    }

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, email')
      .limit(5)

    if (clientsError) {
      console.error('❌ Clients query failed:', clientsError.message)
    } else {
      console.log(`✅ Clients: Found ${clients?.length || 0} clients`)
      if (clients && clients.length > 0) {
        console.log('   Sample client:', clients[0].name)
      }
    }

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price')
      .limit(5)

    if (servicesError) {
      console.error('❌ Services query failed:', servicesError.message)
    } else {
      console.log(`✅ Services: Found ${services?.length || 0} services`)
      if (services && services.length > 0) {
        console.log('   Sample service:', services[0].name)
      }
    }

    console.log('\n🎉 Admin panel data access test completed!')
    console.log('\n📝 Next steps:')
    console.log('1. Make sure you have at least one user account')
    console.log('2. Run: node scripts/create-admin-user.js')
    console.log('3. Log out and log back in')
    console.log('4. Visit /admin to access the admin panel')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testAdminPanel()

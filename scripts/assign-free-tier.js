const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin operations
)

async function assignExistingUsersToFreeTier() {
  try {
    console.log('Starting to assign existing users to free tier...')

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`)
    }

    console.log(`Found ${users.users.length} users`)

    for (const user of users.users) {
      console.log(`Processing user: ${user.email} (${user.id})`)

      // Check if user already has an active subscription
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!existingSubscription) {
        // Create free subscription
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_type: 'free',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            cancel_at_period_end: false
          })

        if (subscriptionError) {
          console.error(`Error creating subscription for ${user.email}:`, subscriptionError)
          continue
        }

        console.log(`✅ Created free subscription for ${user.email}`)
      } else {
        console.log(`⏭️  User ${user.email} already has an active subscription`)
      }

      // Check if user has settings
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!existingSettings) {
        // Create user settings
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            custom_branding_enabled: false,
            white_label_enabled: false,
            api_access_enabled: false,
            advanced_automation_enabled: false,
            multi_location_enabled: false,
            advanced_reporting_enabled: false,
            webhooks_enabled: false,
            custom_integrations_enabled: false
          })

        if (settingsError) {
          console.error(`Error creating settings for ${user.email}:`, settingsError)
          continue
        }

        console.log(`✅ Created user settings for ${user.email}`)
      } else {
        console.log(`⏭️  User ${user.email} already has settings`)
      }

      // Check if user has usage tracking for current month
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
      const { data: existingUsage } = await supabase
        .from('usage_tracking')
        .select('id')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth)
        .single()

      if (!existingUsage) {
        // Create usage tracking
        const { error: usageError } = await supabase
          .from('usage_tracking')
          .insert({
            user_id: user.id,
            month_year: currentMonth,
            work_orders_count: 0,
            api_calls_count: 0,
            storage_mb_used: 0
          })

        if (usageError) {
          console.error(`Error creating usage tracking for ${user.email}:`, usageError)
          continue
        }

        console.log(`✅ Created usage tracking for ${user.email}`)
      } else {
        console.log(`⏭️  User ${user.email} already has usage tracking for ${currentMonth}`)
      }
    }

    console.log('✅ Finished assigning users to free tier!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
assignExistingUsersToFreeTier() 
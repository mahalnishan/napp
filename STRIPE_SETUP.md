# Stripe Payment Integration Setup

This guide will help you set up Stripe payments for the Effortless application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Your application deployed and accessible via HTTPS (for webhooks)

## Step 1: Get Stripe API Keys

1. Log into your Stripe Dashboard
2. Go to Developers > API keys
3. Copy your **Publishable key** and **Secret key**
4. Make sure you're using test keys for development

## Step 2: Create Products and Prices

1. Go to Products in your Stripe Dashboard
2. Create two products:

### Professional Plan
- **Name**: Professional
- **Price**: $24.00/month
- **Billing**: Recurring
- **Interval**: Monthly
- **Currency**: USD

### Enterprise Plan
- **Name**: Enterprise
- **Price**: $59.00/month
- **Billing**: Recurring
- **Interval**: Monthly
- **Currency**: USD

3. Copy the **Price IDs** for both products (they start with `price_`)

## Step 3: Set Up Webhooks

1. Go to Developers > Webhooks in your Stripe Dashboard
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.created`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 4: Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_PROFESSIONAL_PRICE_ID=price_your_professional_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id

# App URL (for webhooks and redirects)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Step 5: Test the Integration

1. Start your development server
2. Create a test account
3. Try upgrading to a paid plan
4. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Requires Authentication**: `4000 0025 0000 3155`

## Step 6: Production Deployment

1. Switch to live Stripe keys in production
2. Update webhook endpoint to production URL
3. Test the complete flow with real cards

## Features Implemented

### ✅ Subscription Management
- Automatic free subscription creation for new users
- Upgrade/downgrade between plans
- Usage tracking and limits enforcement
- Billing portal access for existing customers

### ✅ Payment Processing
- Secure checkout sessions
- Webhook handling for subscription events
- Automatic plan updates based on payment status
- Graceful handling of failed payments

### ✅ User Experience
- Seamless upgrade flow
- Clear plan comparison
- Usage dashboards
- Billing management portal

## API Endpoints

- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/billing-portal` - Create billing portal session
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `GET /api/subscription` - Get subscription data
- `POST /api/subscription` - Update subscription

## Security Features

- Webhook signature verification
- Row-level security on all database tables
- API key hashing for enterprise features
- Usage limits enforcement
- Feature gating based on subscription tier

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook endpoint URL is accessible
   - Verify webhook secret is correct
   - Check server logs for errors

2. **Checkout session fails**
   - Verify Stripe keys are correct
   - Check price IDs exist in Stripe
   - Ensure customer creation succeeds

3. **Subscription not updating**
   - Check webhook events are being processed
   - Verify database permissions
   - Check subscription service logs

### Testing

Use Stripe's test mode for all development and testing. The integration automatically handles test vs live mode based on your API keys.

## Support

For issues with:
- **Stripe integration**: Check Stripe documentation and logs
- **Application features**: Check application logs and database
- **Billing questions**: Contact support@effortless.com 
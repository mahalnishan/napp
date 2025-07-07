# Database Connection Troubleshooting Guide

This guide helps you diagnose and resolve database connection issues in your application.

## Quick Diagnosis

Run the database connection test to get immediate feedback:

```bash
npm run test-db
```

This will check:
- Environment variables
- Network connectivity
- Authentication
- Row Level Security (RLS)
- Performance metrics

## Common Issues and Solutions

### 1. Connection Timeout

**Symptoms:**
- Error: "Connection timeout"
- Requests hang for 10+ seconds
- Intermittent failures

**Causes:**
- Network connectivity issues
- Supabase service outage
- Firewall blocking connections
- DNS resolution problems

**Solutions:**
1. Check your internet connection
2. Visit [Supabase Status Page](https://status.supabase.com/)
3. Try from a different network
4. Check firewall settings
5. Clear DNS cache: `npx dns-cache-flush`

### 2. Environment Variables Missing

**Symptoms:**
- Error: "Missing Supabase environment variables"
- Application won't start

**Solutions:**
1. Check your `.env.local` file exists
2. Verify variables are set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Restart your development server

### 3. Row Level Security (RLS) Errors

**Symptoms:**
- Error: "new row violates row-level security policy"
- Can't access data even when authenticated

**Solutions:**
1. Check RLS policies in Supabase dashboard
2. Verify user authentication
3. Review policy conditions
4. Test with service role key (temporarily)

### 4. Authentication Issues

**Symptoms:**
- Error: "JWT expired" or "Invalid JWT"
- Users can't log in
- Session problems

**Solutions:**
1. Check token expiration settings
2. Verify auth configuration
3. Clear browser storage
4. Check auth policies

## Monitoring and Alerts

### Health Check Endpoint

Monitor your application's health:

```bash
curl https://your-app.vercel.app/api/health
```

Response includes:
- Database connectivity status
- Response times
- Memory usage
- Overall system health

### Logs and Debugging

Enable detailed logging by setting:

```bash
NODE_ENV=development
DEBUG=supabase:*
```

### Performance Monitoring

Track these metrics:
- Database response times (should be < 1000ms)
- Connection pool usage
- Error rates
- Timeout frequency

## Prevention Strategies

### 1. Connection Pooling

The application uses connection pooling to manage database connections efficiently.

### 2. Retry Logic

Automatic retry logic handles temporary connection issues:
- 3 retries for most operations
- Exponential backoff
- Smart error classification

### 3. Timeout Configuration

- Query timeout: 15 seconds
- Health check timeout: 5 seconds
- Middleware timeout: 3 seconds

### 4. Graceful Degradation

When database is unavailable:
- Users see maintenance page
- API returns 503 status
- Automatic retry headers included

## Emergency Procedures

### 1. Database Down

If Supabase is completely down:
1. Check status page
2. Enable maintenance mode
3. Notify users
4. Monitor for resolution

### 2. Performance Issues

If experiencing slow performance:
1. Check connection pool usage
2. Review query performance
3. Consider database scaling
4. Implement caching

### 3. Data Loss Prevention

- Regular backups enabled
- Point-in-time recovery available
- Transaction logging active

## Support Resources

### Supabase Documentation
- [Connection Issues](https://supabase.com/docs/guides/troubleshooting/connection-issues)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Performance Tuning](https://supabase.com/docs/guides/database/performance)

### Community Support
- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

### Monitoring Tools
- Supabase Dashboard
- Application logs
- Health check endpoint
- Database test script

## Configuration Reference

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (for enhanced monitoring)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_LOG_LEVEL=info
```

### Timeout Settings

```typescript
// Default timeouts
const DEFAULT_TIMEOUTS = {
  query: 15000,        // 15 seconds
  health: 5000,        // 5 seconds
  middleware: 3000,    // 3 seconds
  retry: 1000,         // 1 second
  maxRetries: 3
}
```

### Retry Configuration

```typescript
// Retry logic settings
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  nonRetryableErrors: [
    'unauthorized',
    'permission denied',
    'not found',
    'invalid',
    'bad request'
  ]
}
```

## Testing Your Setup

### 1. Run Database Test
```bash
npm run test-db
```

### 2. Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

### 3. Test Authentication
```bash
# Test login flow
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 4. Test API Endpoints
```bash
# Test orders API
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer your-token"
```

## Maintenance Schedule

### Daily
- Monitor health check endpoint
- Review error logs
- Check performance metrics

### Weekly
- Review connection pool usage
- Analyze slow queries
- Update monitoring alerts

### Monthly
- Review RLS policies
- Update security configurations
- Performance optimization review

---

For immediate assistance, contact the development team or check the application logs for specific error details. 
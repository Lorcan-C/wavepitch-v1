# Setting up Clerk Authentication

## Frontend Setup

1. Get your Clerk publishable key from https://dashboard.clerk.com
2. Add it directly to `src/main.tsx`:
   ```javascript
   const CLERK_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE';
   ```
   This key is safe to commit to your repository.

## Cloudflare Worker Setup (for existing password auth)

### Prerequisites

1. Install Wrangler CLI: `brew install cloudflare-wrangler`
2. Login to Cloudflare: `wrangler login`

### Adding Secrets to Cloudflare

Run these commands in your project directory:

```bash
# Your existing Supabase secrets for password authentication
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
```

## Deploying the Worker

```bash
# Deploy to Cloudflare Workers
wrangler deploy
```

## How it Works

1. **No Environment Variables**: The app fetches the Clerk publishable key from your Cloudflare Worker at runtime
2. **Secure Backend Verification**: Session verification happens on the Cloudflare Worker using your secret key
3. **Protected Routes**: The `/demo` route is protected by Clerk authentication

## API Endpoints

Your Cloudflare Worker now provides:

- `GET /api/clerk/config` - Returns the publishable key to the frontend
- `POST /api/clerk/verify-session` - Verifies Clerk sessions server-side

## Testing

1. Deploy your worker: `wrangler deploy`
2. Update your Vercel deployment to proxy `/api/*` requests to your Cloudflare Worker
3. Visit your app and try accessing `/demo` - you'll be redirected to Clerk's sign-in page

## Vercel Configuration

Add a `vercel.json` file to proxy API requests to your Cloudflare Worker:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-worker.workers.dev/api/:path*"
    }
  ]
}
```

Replace `your-worker` with your actual Cloudflare Worker subdomain.

# Supabase Local Development Setup

This document explains how to set up the necessary environment variables for local development with the Supabase CLI.

## Environment Variables

The Supabase CLI uses a `.env` file located in this directory (`supabase/.env`) to configure credentials for local development and for commands like `supabase db push`.

**This file is critical for running the project but must NOT be committed to version control.** The root `.gitignore` file is already configured to ignore all `.env` files.

### Setup Steps

1.  Create a file named `.env` inside this `supabase/` directory.
2.  Copy the template below into the `supabase/.env` file.
3.  Replace the placeholder values with your actual keys. You can find the Supabase keys in your project's API settings. The payment provider keys must be acquired from their respective developer dashboards.

### `.env` Template

```sh
#------------------------------------------------------------------
# Supabase Credentials
# Required for Supabase CLI and local development.
#------------------------------------------------------------------
SUPABASE_URL="https://zcgkygxcyuupexiyrvdz.supabase.co"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

#------------------------------------------------------------------
# Payment Provider Keys
# Required for the payment functions to work.
# You can use placeholder values for local development if not testing payments.
#------------------------------------------------------------------
KAKAO_ADMIN_KEY="YOUR_KAKAO_PAY_ADMIN_KEY"
KAKAO_CID="YOUR_KAKAO_PAY_CID" # Use TC0ONETIME for testing
STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY"
TOSS_SECRET_KEY="YOUR_TOSS_PAYMENTS_SECRET_KEY"
PAYPAL_CLIENT_ID="YOUR_PAYPAL_CLIENT_ID"
PAYPAL_CLIENT_SECRET="YOUR_PAYPAL_CLIENT_SECRET"
PAYPAL_BASE_URL="https://api.sandbox.paypal.com" # Use https://api.paypal.com for production
```

# Vercel setup

## 1. Database

1. Import this repository into Vercel.
2. In Vercel, open the project and choose **Storage** or **Marketplace**.
3. Create a Neon Postgres database and connect it to the project.
4. Confirm that the Production environment contains `DATABASE_URL`.
5. Deploy once. The application creates `hiphim_users` and `hiphim_pending_registrations` automatically.

The first successful admin user listing imports existing records from `data/users.json`. Do not delete that file until the first production migration has completed.

## 2. OTP email

1. Create a Resend account and add `hiphim.one` as a sending domain.
2. Add the SPF, DKIM, and DMARC records shown by Resend to Cloudflare DNS.
3. Verify the domain in Resend.
4. Create a Resend API key.
5. Add these Vercel environment variables for Preview and Production:

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=Hi Phim <noreply@hiphim.one>
```

The sender address must be on the verified Resend domain. The app sends OTP through `https://api.resend.com/emails`.

## 3. Session secrets

Set long random values in Vercel for:

```env
USER_JWT_SECRET=...
ADMIN_JWT_SECRET=...
```

Changing these values invalidates existing sessions.

## 4. Deploy and test

Vercel uses `next build` automatically. After deployment, test registration with a Gmail address because the registration endpoint currently accepts only `@gmail.com` addresses. The OTP endpoint is `POST /api/auth/register` with `email`, `password`, and `name`.

For local development, `DATABASE_URL` and `RESEND_API_KEY` can be omitted. The app then uses the JSON fallback and either Gmail SMTP (`GMAIL_USER` plus `GMAIL_APP_PASSWORD`) or development-only OTP output.

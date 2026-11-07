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

The OTP email uses the same square Hi Phim logo as the site header from `https://hiphim.one/favicon.png`. Keep this file publicly accessible over HTTPS.

### Sender avatar with the Hi Phim logo

The avatar beside the sender name in Gmail or iOS Mail is not controlled by the email HTML or Resend. Configure BIMI after SPF, DKIM, and DMARC are passing:

```dns
default._bimi.hiphim.one TXT "v=BIMI1; l=https://hiphim.one/favicon.svg;"
```

Use a BIMI-compliant SVG Tiny logo hosted over HTTPS. Some mail providers, including Gmail, may require a Verified Mark Certificate and an `a=` certificate URL before displaying the logo. DNS propagation and provider caching can take time, so the avatar is not guaranteed to appear immediately.

## 3. Session secrets

Set long random values in Vercel for:

```env
USER_JWT_SECRET=...
ADMIN_JWT_SECRET=...
```

Changing these values invalidates existing sessions.

## 4. Deploy and test

Vercel uses `next build` automatically. After deployment, test registration with a Gmail address because the registration endpoint currently accepts only `@gmail.com` addresses. The OTP endpoint is `POST /api/auth/register` with `email`, `password`, and `name`.

For local development, `DATABASE_URL` and `RESEND_API_KEY` can be omitted. The app then uses the JSON fallback and development-only OTP output. In Preview and Production, configure `RESEND_API_KEY`; Gmail SMTP is not used.

## 5. Cloudflare Workers

The project deploys to Cloudflare Workers through the configuration in [wrangler.jsonc](./wrangler.jsonc). Do not put `RESEND_API_KEY` in that file because it is a secret.

### Option A: Cloudflare Dashboard

1. Open **Cloudflare Dashboard**.
2. Go to **Workers & Pages** and select the `hiphim-updates` Worker.
3. Open **Settings > Variables and Secrets**.
4. Add a secret:
   - **Variable name:** `RESEND_API_KEY`
   - **Value:** your real Resend key beginning with `re_`
   - **Type:** Secret
   - Add it to the environment used by the deployment.
5. Redeploy the Worker after saving the secret.

Keep these non-secret values in `wrangler.jsonc`:

```json
{
  "EMAIL_FROM": "Hi Phim <notification@hiphim.one>",
  "NEXT_PUBLIC_APP_URL": "https://hiphim.one"
}
```

### Option B: Wrangler CLI

Run these commands from the repository root:

```bash
npx wrangler login
npx wrangler secret put RESEND_API_KEY
npm run build:cf
npx wrangler deploy
```

When prompted after `wrangler secret put`, paste the Resend API key. The key is stored as an encrypted Worker secret and is not written to the repository.

### Verify the Resend domain in Cloudflare DNS

In Resend, open **Domains > hiphim.one > DNS records** and copy the exact SPF, DKIM, and DMARC records shown there into **Cloudflare > DNS > Records**. Do not invent or modify the DKIM value.

For the sender avatar, add this BIMI record after SPF, DKIM, and DMARC pass:

```dns
Type: TXT
Name: default._bimi
Content: v=BIMI1; l=https://hiphim.one/favicon.svg;
```

The logo file must remain publicly accessible at `https://hiphim.one/favicon.svg`. Gmail may additionally require a Verified Mark Certificate before showing the avatar.

### Test after deployment

1. Confirm the Worker deployment completed successfully.
2. Register a new account with a Gmail address.
3. Confirm the OTP email arrives from `notification@hiphim.one`.
4. Test **Quên mật khẩu** and confirm the reset OTP also arrives through Resend.
5. If delivery fails, inspect the Worker logs and the Resend **Emails** and **Logs** pages. Never print or paste the API key into logs.

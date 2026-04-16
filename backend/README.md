# AutoClient Backend

Express API for auth, billing, business profile management, WhatsApp session handling, and AI replies.

## Local Development

1. Copy `.env.example` to `.env` and fill the values.
2. Install dependencies:

```bash
npm install
```

3. Start server:

```bash
npm start
```

The API will run on `http://localhost:5000` by default.

## Required Environment Variables

- `MONGO_URI`
- `MONGO_URI_FALLBACK` (optional but recommended)
- `OPENAI_API_KEY`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `FRONTEND_URL` (comma-separated list for CORS)

Optional:

- `PORT` (default `5000`)
- `FREE_ACCESS_LIMIT` (default `100`)
- `WHATSAPP_AUTO_REPLY_ENABLED` (`true` by default)
- `WHATSAPP_FALLBACK_REPLY`
- `WHATSAPP_AUTH_ROOT`

## Render Deployment (Persistent Runtime)

This backend must run in a persistent process for Baileys WhatsApp events (`messages.upsert`) to stay active.

### Option A: Blueprint Deploy

1. Push repository to GitHub.
2. In Render, choose New + Blueprint.
3. Select your repo and apply the included `render.yaml`.
4. Set all required environment variables in Render.
5. Deploy.

### Option B: Manual Web Service

- Runtime: Node
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Health check URL:

- `GET /`

### Important Notes

- Do not host WhatsApp socket logic on serverless platforms for production auto-replies.
- After backend deploy, update frontend `VITE_API_URL` to your Render backend URL and redeploy frontend.

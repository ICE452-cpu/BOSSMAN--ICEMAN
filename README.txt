# ICEMAN EFOOTBALL STORE

Render-ready Node.js/Express store starter.

## Deploy on Render

### Option 1 — GitHub (recommended)
1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root (package.json, server.js, public/, render.yaml, etc.).
3. In Render, choose **New > Blueprint** and select the repository.
4. Render will read `render.yaml`.
5. Set `ADMIN_PASSWORD` to a strong private password when Render asks for it.
6. Deploy. Render will run `npm install` and `npm start`.

### Option 2 — Manual Web Service
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variable `ADMIN_PASSWORD` with a strong private password.
- Add environment variable `ADMIN_TOKEN_SECRET` with a long random secret.

## Local run
1. Install Node.js 20+.
2. In this folder run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## Important data note
The app currently stores users, messages and listings in `data.json`. Render's normal filesystem is ephemeral, so this data can be lost after a restart/redeploy. For real customer data, move the database to a persistent database such as PostgreSQL before launch.

## Security notes
- Never publish the admin password in source code or README files.
- Use the Render `ADMIN_PASSWORD` environment variable.
- Admin message/listing management endpoints require an admin token.
- Do not collect customers' eFootball game passwords or verification codes.

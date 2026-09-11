# Google Drive MCP for ChatGPT

A small remote MCP server that lets a ChatGPT custom app read/search one Google Drive account.

## What it does

- List Drive files
- Search files by name
- Read Google Docs as plain text
- Read Google Sheets as CSV
- Read Google Slides as plain text
- Read text files

It is read-only: this server does not upload, edit, share, or delete files.

## Deploy

1. Import this GitHub repository into Vercel.
2. Add these Vercel environment variables:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
MCP_API_KEY
```

3. Deploy.
4. Your MCP endpoint is:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/api/mcp
```

## Google OAuth

Create a Google Cloud project, enable the Google Drive API, create OAuth 2.0 credentials, and obtain a refresh token with the Drive read-only scope:

`https://www.googleapis.com/auth/drive.readonly`

Never commit the OAuth client secret or refresh token to GitHub.

## ChatGPT custom app

In ChatGPT's custom MCP app/developer-mode UI, use the deployed `/api/mcp` URL as the server endpoint. Because this server uses a private bearer key, configure the app's authentication/header support to send:

```text
Authorization: Bearer YOUR_MCP_API_KEY
```

If your ChatGPT UI requires OAuth rather than a bearer header for custom apps, this single-user deployment is not the right authentication mode; add an OAuth layer instead of exposing the Google refresh token.

## Important

This is intentionally read-only. Do not give the server a broader Google Drive scope than necessary.

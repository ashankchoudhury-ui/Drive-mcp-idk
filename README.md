# Google Drive MCP for ChatGPT

A small remote MCP server that lets a ChatGPT custom app read/search the Google Drive account of the user who authorizes the app with Google OAuth.

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
2. No Google refresh token or MCP API key is required by the server now.
3. Deploy.
4. Your MCP endpoint is:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/api/mcp
```

## ChatGPT OAuth setup

This server expects the bearer token sent by ChatGPT to be a Google OAuth access token. Configure the ChatGPT custom MCP app with OAuth and use these Google OAuth endpoints:

Authorization endpoint:

`https://accounts.google.com/o/oauth2/v2/auth`

Token endpoint:

`https://oauth2.googleapis.com/token`

Access token location: Authorization header with Bearer prefix.

Scope:

`https://www.googleapis.com/auth/drive.readonly`

Use your Google OAuth Web application Client ID and Client Secret in the ChatGPT OAuth configuration.

### Google redirect URI

In ChatGPT's OAuth setup, copy the exact callback/redirect URL that ChatGPT gives you. Add that exact URL to the Google Cloud OAuth client's **Authorized redirect URIs**. Do not guess the callback URL.

If you previously created a refresh token for the old version of this server, you do not need to put that refresh token in Vercel. ChatGPT performs the user OAuth flow and sends the resulting access token to this MCP server.

## Important

- Keep the Google OAuth client secret private.
- Keep the app read-only and use only the `drive.readonly` scope.
- The MCP server does not store a Google refresh token.
- Custom MCP apps should only be connected when you trust the server and its code.

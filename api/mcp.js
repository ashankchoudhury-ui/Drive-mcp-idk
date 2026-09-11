import { google } from 'googleapis';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

function auth() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

function drive() {
  return google.drive({ version: 'v3', auth: auth() });
}

function text(data) {
  return { content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] };
}

function createServer() {
  const server = new McpServer({ name: 'google-drive-chatgpt', version: '1.0.0' });

  server.registerTool(
    'list_drive_files',
    {
      description: 'List files the connected Google Drive account can access.',
      inputSchema: {
        folder_id: z.string().optional().describe('Optional Google Drive folder ID'),
        page_size: z.number().int().min(1).max(100).optional().default(50)
      },
      annotations: { readOnlyHint: true }
    },
    async ({ folder_id, page_size }) => {
      const q = ["trashed = false", folder_id ? `'${folder_id}' in parents` : null].filter(Boolean).join(' and ');
      const r = await drive().files.list({
        q,
        pageSize: page_size,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,parents)',
        orderBy: 'modifiedTime desc'
      });
      return text(r.data.files ?? []);
    }
  );

  server.registerTool(
    'search_drive',
    {
      description: 'Search Google Drive files by name or full Drive query.',
      inputSchema: {
        query: z.string().describe('Text to search for in file names'),
        page_size: z.number().int().min(1).max(100).optional().default(50)
      },
      annotations: { readOnlyHint: true }
    },
    async ({ query, page_size }) => {
      const safe = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const r = await drive().files.list({
        q: `trashed = false and name contains '${safe}'`,
        pageSize: page_size,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,parents)',
        orderBy: 'modifiedTime desc'
      });
      return text(r.data.files ?? []);
    }
  );

  server.registerTool(
    'get_drive_file',
    {
      description: 'Get metadata and readable text from a Google Drive file. Supports Google Docs, Sheets, Slides and text files.',
      inputSchema: { file_id: z.string().describe('Google Drive file ID') },
      annotations: { readOnlyHint: true }
    },
    async ({ file_id }) => {
      const d = drive();
      const meta = await d.files.get({ fileId: file_id, fields: 'id,name,mimeType,size,modifiedTime,webViewLink,parents' });
      const mime = meta.data.mimeType || '';
      let content = null;
      if (mime === 'application/vnd.google-apps.document') {
        const r = await d.files.export({ fileId: file_id, mimeType: 'text/plain' }, { responseType: 'text' });
        content = r.data;
      } else if (mime === 'application/vnd.google-apps.spreadsheet') {
        const r = await d.files.export({ fileId: file_id, mimeType: 'text/csv' }, { responseType: 'text' });
        content = r.data;
      } else if (mime === 'application/vnd.google-apps.presentation') {
        const r = await d.files.export({ fileId: file_id, mimeType: 'text/plain' }, { responseType: 'text' });
        content = r.data;
      } else if (mime.startsWith('text/')) {
        const r = await d.files.get({ fileId: file_id, alt: 'media' }, { responseType: 'text' });
        content = r.data;
      }
      return text({ metadata: meta.data, content });
    }
  );

  return server;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, MCP-Protocol-Version, Last-Event-ID');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    return res.end();
  }

  const apiKey = process.env.MCP_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'MCP_API_KEY is not configured.' });
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${apiKey}`) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.status(500).json({ error: 'MCP server error' });
  }
}

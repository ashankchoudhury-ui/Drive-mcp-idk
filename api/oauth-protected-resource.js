export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    resource: 'https://drive-mcp-idk.vercel.app/api/mcp',
    authorization_servers: ['https://accounts.google.com'],
    scopes_supported: ['https://www.googleapis.com/auth/drive.readonly'],
    bearer_methods_supported: ['header']
  });
}

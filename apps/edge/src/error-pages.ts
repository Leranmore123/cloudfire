export function renderErrorPage(
  statusCode: number,
  title: string,
  message: string,
  host: string,
  details?: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusCode} - ${title} | Turnal</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 27, 46, 0.7);
      --border: #232d4b;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --accent: #6366f1;
      --danger: #f43f5e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, var(--bg) 70%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      backdrop-filter: blur(12px);
      max-width: 540px;
      width: 100%;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(244, 63, 94, 0.15);
      color: var(--danger);
      border: 1px solid rgba(244, 63, 94, 0.3);
      margin-bottom: 20px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #fff 30%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: var(--text-muted);
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .host-box {
      background: rgba(0,0,0,0.3);
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      font-size: 14px;
      color: var(--primary);
      margin-bottom: 24px;
      word-break: break-all;
    }
    .footer {
      font-size: 13px;
      color: #64748b;
      margin-top: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #475569;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${statusCode} Error</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="host-box">Target: ${host}</div>
    ${details ? `<p style="font-size:13px; color:#ef4444;">${details}</p>` : ''}
    <div class="footer">
      <span>Turnal Edge Ingress</span>
      <span class="dot"></span>
      <span>${new Date().toUTCString()}</span>
    </div>
  </div>
</body>
</html>`;
}

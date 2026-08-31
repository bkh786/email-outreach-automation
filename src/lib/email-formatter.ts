/**
 * Email formatting and HTML rendering utilities
 */

export const DEFAULT_SAMPLE_DATA: Record<string, string> = {
  name: 'David Miller',
  contact_person: 'David Miller',
  business_name: 'Apex Global Cargo Ltd.',
  company_name: 'Apex Global Cargo Ltd.',
  contact_number: '+1 (555) 019-2834',
  phone: '+1 (555) 019-2834',
  login_email: 'ops@apexglobalcargo.com',
  email: 'ops@apexglobalcargo.com',
  temporary_password: 'ClientPass2025!',
  password: 'ClientPass2025!',
  login_url: 'https://marketpulse.ai/login',
};

export function isHtmlContent(content: string): boolean {
  if (!content) return false;
  return /<[a-z][\s\S]*>/i.test(content);
}

export function interpolateTemplate(content: string, data: Record<string, string>): string {
  if (!content) return '';
  let result = content;
  for (const [key, val] of Object.entries(data)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, val);
  }
  return result;
}

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/p>|<\/div>|<\/tr>|<br\s*\/?>/gi, '\n')
    .replace(/<\/td>|<\/th>/gi, '  ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

export function buildEmailDocument(content: string, sampleData?: Record<string, string>): string {
  let bodyContent = content || '';
  if (sampleData) {
    bodyContent = interpolateTemplate(bodyContent, sampleData);
  }

  const isHtml = isHtmlContent(bodyContent);
  const formattedBody = isHtml
    ? bodyContent
    : `<div style="white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">${bodyContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;

  if (/<html[\s\S]*>/i.test(formattedBody)) {
    return formattedBody;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base target="_blank">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background-color: #ffffff;
      color: #1e293b;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      word-break: break-word;
    }
    p { margin: 0 0 14px 0; }
    h1, h2, h3, h4 { color: #0f172a; margin: 18px 0 10px 0; font-weight: 700; line-height: 1.3; }
    h1 { font-size: 22px; }
    h2 { font-size: 18px; }
    h3 { font-size: 16px; }
    a { color: #0d9488; text-decoration: underline; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
    th, td { padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; vertical-align: middle; }
    th { background-color: #f8fafc; font-weight: 600; color: #0f172a; }
    ul, ol { margin: 0 0 14px 0; padding-left: 20px; }
    li { margin-bottom: 5px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #0f172a; }
    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0; }
    .btn { display: inline-block; padding: 10px 22px; background-color: #0d9488; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 10px 0; }
    .credential-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0d9488; padding: 16px; border-radius: 8px; margin: 16px 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; line-height: 1.7; }
  </style>
</head>
<body>
  ${formattedBody}
</body>
</html>`;
}

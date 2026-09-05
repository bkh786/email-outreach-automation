import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lead, Profile, ScrapedData, AiEnrichmentResult } from './types';
import { getLiveGeminiModels } from './gemini-models';

// Email-safe SVG Icons
const ICONS = {
  phone: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; flex-shrink: 0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  whatsapp: `<svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366" style="vertical-align: middle; flex-shrink: 0;"><path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.98-1.002 1.23-.226.25-.451.276-.752.125-.3-.151-1.267-.467-2.414-1.489-.893-.797-1.496-1.782-1.671-2.083-.176-.3-.019-.463.131-.613.136-.134.3-.351.451-.527.15-.175.2-.3.301-.501.1-.2.05-.376-.025-.526-.075-.151-.676-1.63-.927-2.232-.244-.587-.493-.507-.677-.517-.175-.01-.376-.01-.576-.01s-.527.075-.802.376c-.276.301-1.053 1.028-1.053 2.508s1.078 2.909 1.229 3.11c.15.2 2.121 3.238 5.138 4.542.718.31 1.279.496 1.716.635.722.23 1.378.197 1.898.119.579-.087 1.78-.727 2.03-1.429.251-.702.251-1.304.176-1.429-.076-.126-.276-.201-.577-.351zM12.042 2C6.502 2 2 6.502 2 12.042c0 1.946.554 3.76 1.517 5.304L2 22l4.807-1.482A9.99 9.99 0 0 0 12.042 22C17.582 22 22 17.498 22 12.042 22 6.502 17.582 2 12.042 2z"/></svg>`,
  email: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; flex-shrink: 0;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  website: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  linkedin: `<svg width="13" height="13" viewBox="0 0 24 24" fill="#0A66C2" style="vertical-align: middle; flex-shrink: 0;"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.8v-7.6h-2.8M7.86 6.3a1.63 1.63 0 1 0 1.63 1.63A1.63 1.63 0 0 0 7.86 6.3z"/></svg>`,
  twitter: `<svg width="13" height="13" viewBox="0 0 24 24" fill="#0f172a" style="vertical-align: middle; flex-shrink: 0;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  facebook: `<svg width="13" height="13" viewBox="0 0 24 24" fill="#1877F2" style="vertical-align: middle; flex-shrink: 0;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  instagram: `<svg width="13" height="13" viewBox="0 0 24 24" fill="#E4405F" style="vertical-align: middle; flex-shrink: 0;"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  address: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; flex-shrink: 0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
};

/**
 * Converts raw signature text into an executive HTML signature with relevant icons
 * for phone, whatsapp, website, email, social links, and physical address.
 * If signature is blank, synthesizes one from the user's website and brand profile.
 */
export function formatSignatureAsHtml(signature: string, profile?: Partial<Profile>): string {
  const company = profile?.company_name || 'Digi Presence Solutions';
  const nameOrTitle = profile?.contact_person || 'Operations & Growth Team';
  const websiteUrl = profile?.website_url || '';

  // If signature panel is blank, synthesize signature from website and brand profile
  if (!signature || !signature.trim()) {
    const cleanWeb = websiteUrl ? websiteUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '') : '';
    return `
<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13.5px; font-weight: 500;">Best regards,</p>
  <div style="font-weight: 700; color: #0f172a; font-size: 14.5px; line-height: 1.3;">${nameOrTitle}</div>
  <div style="color: #0d9488; font-weight: 600; font-size: 13px; margin: 2px 0 8px 0;">${company}</div>
  ${websiteUrl ? `
  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-top: 4px;">
    <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: #475569;">
      ${ICONS.website}
      <a href="${websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}" target="_blank" style="color: #0d9488; text-decoration: underline; font-weight: 500;">${cleanWeb}</a>
    </span>
  </div>` : ''}
</div>`.trim();
  }

  const trimmed = signature.trim();

  // If already contains rendered icons and HTML container, return as is
  if (trimmed.includes('border-top: 1px solid') && trimmed.includes('<svg')) {
    return trimmed;
  }

  // Parse lines
  const rawLines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return '';

  let signOff = 'Best regards,';
  let linesToProcess = rawLines;

  // Detect sign-off line
  const signOffMatch = rawLines[0].match(/^(Thanks\s*(&|and)?\s*Regards|Best\s*regards|Warm\s*regards|Sincerely|Kind\s*regards|Cheers|With\s*regards|Regards)[,]?$/i);
  if (signOffMatch) {
    signOff = rawLines[0].endsWith(',') ? rawLines[0] : `${rawLines[0]},`;
    linesToProcess = rawLines.slice(1);
  }

  // Detect sender name and company name
  const detectedSender = linesToProcess[0] || nameOrTitle;
  const detectedCompany = linesToProcess.length > 1 && !linesToProcess[1].includes('@') && !linesToProcess[1].toLowerCase().includes('http') && !linesToProcess[1].toLowerCase().includes('phone')
    ? linesToProcess[1]
    : company;

  const metadataLines = linesToProcess.slice(linesToProcess[1] === detectedCompany ? 2 : 1);

  // Split metadata lines by pipe (|) or newline to extract individual items
  const rawTokens: string[] = [];
  for (const line of metadataLines) {
    const parts = line.split('|').map(p => p.trim()).filter(Boolean);
    rawTokens.push(...parts);
  }

  const contactPills: string[] = [];
  const addressLines: string[] = [];

  for (const token of rawTokens) {
    const lower = token.toLowerCase();

    // 1. WhatsApp
    if (lower.includes('whatsapp') || lower.startsWith('wa:')) {
      const cleanNum = token.replace(/whatsapp:?|wa:?/i, '').trim();
      const phoneDigits = cleanNum.replace(/[^\d+]/g, '');
      contactPills.push(`
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: #475569;">
          ${ICONS.whatsapp}
          <a href="https://wa.me/${phoneDigits.replace('+', '')}" target="_blank" style="color: #16a34a; text-decoration: none; font-weight: 500;">${cleanNum}</a>
        </span>
      `.trim());
      continue;
    }

    // 2. LinkedIn
    if (lower.includes('linkedin')) {
      const urlMatch = token.match(/https?:\/\/[^\s]+/i);
      const url = urlMatch ? urlMatch[0] : `https://${token.replace(/linkedin:?/i, '').trim()}`;
      contactPills.push(`
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: #475569;">
          ${ICONS.linkedin}
          <a href="${url}" target="_blank" style="color: #0A66C2; text-decoration: none; font-weight: 500;">LinkedIn</a>
        </span>
      `.trim());
      continue;
    }

    // 3. Twitter / X
    if (lower.includes('twitter') || lower.includes('x.com')) {
      const urlMatch = token.match(/https?:\/\/[^\s]+/i);
      const url = urlMatch ? urlMatch[0] : `https://${token.replace(/twitter:?|x:?/i, '').trim()}`;
      contactPills.push(`
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: #475569;">
          ${ICONS.twitter}
          <a href="${url}" target="_blank" style="color: #0f172a; text-decoration: none; font-weight: 500;">Twitter/X</a>
        </span>
      `.trim());
      continue;
    }

    // 4. Facebook
    if (lower.includes('facebook')) {
      const urlMatch = token.match(/https?:\/\/[^\s]+/i);
      const url = urlMatch ? urlMatch[0] : `https://${token.replace(/facebook:?|fb:?/i, '').trim()}`;
      contactPills.push(`
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: #475569;">
          ${ICONS.facebook}
          <a href="${url}" target="_blank" style="color: #1877F2; text-decoration: none; font-weight: 500;">Facebook</a>
        </span>
      `.trim());
      continue;
    }

    // 5. Instagram
    if (lower.includes('instagram')) {
      const urlMatch = token.match(/https?:\/\/[^\s]+/i);
      const url = urlMatch ? urlMatch[0] : `https://${token.replace(/instagram:?|ig:?/i, '').trim()}`;
      contactPills.push(`
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: #475569;">
          ${ICONS.instagram}
          <a href="${url}" target="_blank" style="color: #E4405F; text-decoration: none; font-weight: 500;">Instagram</a>
        </span>
      `.trim());
      continue;
    }

    // 6. Email
    if (lower.includes('@') || lower.startsWith('email:') || lower.startsWith('e-mail:')) {
      const emailMatch = token.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const cleanEmail = emailMatch ? emailMatch[1] : token.replace(/e-?mail:?/i, '').trim();
      contactPills.push(`
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: #475569;">
          ${ICONS.email}
          <a href="mailto:${cleanEmail}" style="color: #0d9488; text-decoration: none; font-weight: 500;">${cleanEmail}</a>
        </span>
      `.trim());
      continue;
    }

    // 7. Phone / Call / Tel / Mobile
    if (lower.includes('phone') || lower.includes('call') || lower.includes('tel:') || lower.includes('mobile') || lower.includes('+')) {
      const cleanPhone = token.replace(/phone\s*no\.?:?|phone:?|call:?|tel:?|mobile:?/i, '').trim();
      const phoneDigits = cleanPhone.replace(/[^\d+]/g, '');
      contactPills.push(`
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: #475569;">
          ${ICONS.phone}
          <a href="tel:${phoneDigits}" style="color: #475569; text-decoration: none; font-weight: 500;">${cleanPhone}</a>
        </span>
      `.trim());
      continue;
    }

    // 8. Website / URL
    if (lower.includes('website') || lower.includes('web:') || lower.includes('http') || lower.includes('www.')) {
      const cleanWeb = token.replace(/website:?|web:?|url:?/i, '').trim();
      const webUrl = cleanWeb.startsWith('http') ? cleanWeb : `https://${cleanWeb}`;
      const webDisplay = cleanWeb.replace(/^https?:\/\//i, '').replace(/\/$/, '');
      contactPills.push(`
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: #475569;">
          ${ICONS.website}
          <a href="${webUrl}" target="_blank" style="color: #0d9488; text-decoration: underline; font-weight: 500;">${webDisplay}</a>
        </span>
      `.trim());
      continue;
    }

    // 9. Physical Address / Registered Office / Location
    if (
      lower.includes('plot') ||
      lower.includes('floor') ||
      lower.includes('road') ||
      lower.includes('street') ||
      lower.includes('block') ||
      lower.includes('address') ||
      lower.includes('office') ||
      lower.includes('suite') ||
      lower.includes('delhi') ||
      lower.includes('nagar') ||
      lower.includes('building') ||
      lower.includes('tower') ||
      lower.includes('sector') ||
      lower.includes('avenue') ||
      lower.includes('lane') ||
      lower.includes('pincode') ||
      lower.includes('location')
    ) {
      const cleanAddress = token.replace(/^(?:corporate|registered|head|branch)?\s*(?:office|address|location)?:?\s*/i, '').trim();
      addressLines.push(`
        <div style="display: flex; align-items: flex-start; gap: 6px; margin-top: 5px; font-size: 12px; color: #64748b; line-height: 1.45;">
          <span style="margin-top: 1px;">${ICONS.address}</span>
          <span>${cleanAddress || token}</span>
        </div>
      `.trim());
      continue;
    }

    // Fallback item
    contactPills.push(`<span style="font-size: 12.5px; color: #475569;">${token}</span>`);
  }

  return `
<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13.5px; font-weight: 500;">${signOff}</p>
  <div style="font-weight: 700; color: #0f172a; font-size: 14.5px; line-height: 1.3;">${detectedSender}</div>
  <div style="color: #0d9488; font-weight: 600; font-size: 13px; margin: 2px 0 8px 0;">${detectedCompany}</div>
  ${contactPills.length > 0 ? `
  <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-top: 4px;">
    ${contactPills.join('\n    ')}
  </div>` : ''}
  ${addressLines.length > 0 ? `
  <div style="margin-top: 4px;">
    ${addressLines.join('\n')}
  </div>` : ''}
</div>`.trim();
}

/**
 * Converts a plain text email body into responsive, elegant HTML.
 */
export function convertPlainBodyToRichHtml(
  bodyText: string,
  userProfile?: Partial<Profile>
): string {
  if (!bodyText) return '';

  const trimmed = bodyText.trim();
  if (/<(p|div|table|h[1-6])[^>]*>/i.test(trimmed)) {
    return trimmed;
  }

  // Strip any accidental sign-off lines from the end of plain text
  const signOffPatterns = [
    /\n\s*(Thanks\s*(&|and)?\s*Regards|Best\s*regards|Warm\s*regards|Sincerely|Kind\s*regards|Cheers|With\s*regards|Regards)[\s\S]*$/i,
    /\n\s*\[(?:Name|Team|Company Name|Phone|Email|Address|Portfolio)\][\s\S]*$/i,
  ];

  let cleaned = trimmed;
  for (const pat of signOffPatterns) {
    if (pat.test(cleaned)) {
      cleaned = cleaned.replace(pat, '').trim();
      break;
    }
  }

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  const htmlParagraphs = paragraphs.map((para, idx) => {
    if (para.startsWith('-') || para.startsWith('*')) {
      const items = para.split(/\n[-*]\s*/).map(s => s.trim().replace(/^[-*]\s*/, '')).filter(Boolean);
      return `<ul style="margin: 14px 0 16px 20px; padding: 0; color: #1e293b; font-size: 14.5px; line-height: 1.65;">
        ${items.map(it => `<li style="margin-bottom: 6px;">${it}</li>`).join('')}
      </ul>`;
    }

    if (idx === 1 && paragraphs.length > 2) {
      return `<div style="margin: 16px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #334155;">
        ${para.replace(/\n/g, '<br/>')}
      </div>`;
    }

    return `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b;">${para.replace(/\n/g, '<br/>')}</p>`;
  });

  const portfolioUrl = userProfile?.portfolio_url || (userProfile as any)?.['portfolio-link'];
  const portfolioCta = portfolioUrl && String(portfolioUrl).trim()
    ? `<div style="margin: 18px 0;">
        <a href="${portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}" target="_blank" style="display: inline-block; padding: 7px 14px; background-color: #f0fdfa; color: #0d9488; border: 1px solid #ccfbf1; border-radius: 8px; font-weight: 600; font-size: 12.5px; text-decoration: none;">
          📄 View Company Credentials &amp; Portfolio &rarr;
        </a>
      </div>`
    : '';

  const rawSig = userProfile?.email_signature || '';
  const htmlSig = formatSignatureAsHtml(rawSig, userProfile);

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b; max-width: 620px;">
  ${htmlParagraphs.join('\n')}
  ${portfolioCta}
  ${htmlSig}
</div>`.trim();
}

/**
 * Enforces that the output email contains rich HTML formatting and concludes with exactly ONE HTML signature.
 * Prevents double signature by stripping any AI-generated sign-off before appending the verified signature card.
 * If signature panel is filled, attaches the panel signature with icons.
 * If signature panel is blank, formats the AI-generated signature from website with icons.
 */
export function enforceEmailSignature(
  bodyHtmlOrText: string,
  signature: string,
  profile?: Partial<Profile>
): string {
  if (!bodyHtmlOrText) return '';

  const activeSignature = (signature && signature.trim().length > 0)
    ? signature.trim()
    : (profile?.email_signature?.trim() || '');

  let cleanedBody = bodyHtmlOrText.trim();
  let extractedAiSignature = '';

  // 1. Strip already-injected signature container if present
  cleanedBody = cleanedBody.replace(/<div style="margin-top:\s*24px;[\s\S]*$/i, '').trim();

  // 2. Strip trailing <hr> if any
  cleanedBody = cleanedBody.replace(/<hr[^>]*>\s*$/i, '').trim();

  // 3. Strip any sign-offs or signature blocks starting with Thanks & Regards, Best regards, etc.
  const signOffPatterns = [
    /(?:<hr[^>]*>\s*)?(?:<p[^>]*>|\n|\s)*(?:Thanks\s*(?:&|and)?\s*Regards|Best\s*regards|Warm\s*regards|Sincerely|Kind\s*regards|Cheers|With\s*regards|Regards)[,]?(?:\s*<\/p>)?[\s\S]*$/i,
    /(?:<p[^>]*>|\n|\s)*\[(?:Name|Team|Company Name|Phone|Email|Address|Portfolio)\][\s\S]*$/i,
  ];

  for (const pat of signOffPatterns) {
    const match = cleanedBody.match(pat);
    if (match && match.index !== undefined) {
      extractedAiSignature = match[0]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      cleanedBody = cleanedBody.substring(0, match.index).trim();
      break;
    }
  }

  // Detect company and sender from profile or activeSignature for targeted stripping
  const companyFromProfile = profile?.company_name || '';
  const senderFromProfile = profile?.contact_person || '';
  const linesOfSig = (activeSignature || extractedAiSignature).split('\n').map(l => l.trim()).filter(Boolean);
  const companyFromSig = linesOfSig.length > 1 && !linesOfSig[1].includes('@') && !linesOfSig[1].toLowerCase().includes('http') && !linesOfSig[1].toLowerCase().includes('phone') ? linesOfSig[1] : '';
  const senderFromSig = linesOfSig.length > 0 && !/^(?:thanks|best|warm|sincerely|regards)/i.test(linesOfSig[0]) ? linesOfSig[0] : (linesOfSig[1] || '');

  const companyCandidates = [companyFromProfile, companyFromSig].filter(Boolean);
  const senderCandidates = [senderFromProfile, senderFromSig].filter(Boolean);

  // 4. Strip trailing contact blocks starting with company or sender name
  for (const comp of companyCandidates) {
    const esc = comp.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const compPattern = new RegExp(
      `(?:<hr[^>]*>\\s*)?(?:<p[^>]*>|\\n|\\s)*(?:<strong>)?(?:${esc})(?:<\\/strong>)?(?:<br\\s*\\/?>|\\n|\\s)*(?:Email:|Address:|Phone:|Website:|LinkedIn:|Plot|Tel:|http)[\\s\\S]*$`,
      'i'
    );
    cleanedBody = cleanedBody.replace(compPattern, '').trim();
  }

  for (const snd of senderCandidates) {
    const esc = snd.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const sndPattern = new RegExp(
      `(?:<hr[^>]*>\\s*)?(?:<p[^>]*>|\\n|\\s)*(?:<strong>)?(?:${esc})(?:<\\/strong>)?(?:<br\\s*\\/?>|\\n|\\s)*(?:[A-Za-z0-9\\s.,&-]+<br\\s*\\/?>)?(?:Email:|Address:|Phone:|Website:|LinkedIn:|Plot|Tel:|http)[\\s\\S]*$`,
      'i'
    );
    cleanedBody = cleanedBody.replace(sndPattern, '').trim();
  }

  // 5. Strip trailing blocks starting with contact markers
  const trailingContactPattern = /(?:<hr[^>]*>\s*)?(?:<p[^>]*>|\n|\s)*(?:Email:|Phone\s*(?:No\.?)?:|Address:|Contact:|Website:|LinkedIn:)[^<>]*(?:<br\s*\/?>|\n)[\s\S]*$/i;
  cleanedBody = cleanedBody.replace(trailingContactPattern, '').trim();

  // 6. Robust loop to strip any remaining trailing <p> or <div> that is an AI sign-off or contact block
  while (true) {
    const before = cleanedBody;
    cleanedBody = cleanedBody.replace(/<hr[^>]*>\s*$/i, '').trim();
    cleanedBody = cleanedBody.replace(/<p[^>]*>\s*<\/p>\s*$/i, '').trim();

    // Match the LAST <p>...</p> element at the end of the string
    const lastPMatch = cleanedBody.match(/<p[^>]*>((?:(?!<p[\s>])[\s\S])*?)<\/p>\s*$/i);
    if (lastPMatch) {
      const fullMatch = lastPMatch[0];
      const content = lastPMatch[1];
      const lower = content.toLowerCase();
      const isContactBlock = 
        (lower.includes('email:') || lower.includes('@')) &&
        (lower.includes('phone') || lower.includes('address') || lower.includes('plot') || lower.includes('tel:') || lower.includes('linkedin') || lower.includes('website') || lower.includes('http') || lower.includes('wa:'));
      const isSignOff = /^(?:<br\s*\/?>|\s)*(?:thanks|best|warm|sincerely|regards|cheers|with regards)/i.test(content.trim());
      const isCompanyOrSender = companyCandidates.some(c => lower.startsWith(c.toLowerCase()) || lower.includes(c.toLowerCase())) && (lower.includes('email') || lower.includes('phone') || lower.includes('address'));

      if (isContactBlock || isSignOff || isCompanyOrSender) {
        cleanedBody = cleanedBody.slice(0, cleanedBody.length - fullMatch.length).trim();
        continue;
      }
    }
    if (cleanedBody === before) break;
  }

  // 7. Strip any trailing <hr> or empty paragraphs
  cleanedBody = cleanedBody.replace(/<hr[^>]*>\s*$/i, '').replace(/<p[^>]*>\s*<\/p>\s*$/i, '').trim();

  // 8. Ensure outer HTML container
  const isHtml = /<(p|div|table|span|ul)[^>]*>/i.test(cleanedBody);
  let finalHtmlBody = isHtml ? cleanedBody : convertPlainBodyToRichHtml(cleanedBody, profile);

  // If ends with </div>, check whether it had an opening <div
  const hadClosingDiv = /<\/div>\s*$/i.test(finalHtmlBody);
  if (hadClosingDiv) {
    finalHtmlBody = finalHtmlBody.replace(/<\/div>\s*$/i, '').trim();
  }

  // 9. Attach exactly ONE iconified HTML signature card
  const sigToFormat = activeSignature || extractedAiSignature || '';
  const htmlSig = formatSignatureAsHtml(sigToFormat, profile);

  if (hadClosingDiv && /<div[^>]*>/i.test(finalHtmlBody)) {
    return `${finalHtmlBody}\n\n  ${htmlSig}\n</div>`;
  }

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b; max-width: 620px;">\n${finalHtmlBody}\n\n  ${htmlSig}\n</div>`;
}

export async function enrichLeadWithGemini(
  lead: Partial<Lead>,
  scrapedData: ScrapedData | null,
  userProfile: Partial<Profile>,
  apiKey?: string
): Promise<AiEnrichmentResult> {
  const hasPanelSignature = Boolean(userProfile.email_signature && userProfile.email_signature.trim().length > 0);
  const panelSignature = userProfile.email_signature?.trim() || '';
  const senderWebsite = userProfile.website_url || '';

  const rawKey = apiKey || process.env.GEMINI_API_KEY;

  if (!rawKey || rawKey.trim() === '') {
    return generateFallbackEnrichment(lead, scrapedData, userProfile);
  }

  const cleanedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');
  const candidateModels = await getLiveGeminiModels(cleanedKey);

  const portfolioUrl = userProfile.portfolio_url || (userProfile as any)?.['portfolio-link'];

  const signatureInstructions = hasPanelSignature
    ? `### SENDER SIGNATURE POLICY:
The sender has their official, verified email signature pre-configured in their settings panel.
CRITICAL MANDATE:
- DO NOT generate or output ANY closing sign-off (e.g., do NOT write "Best regards,", "Thanks & Regards,", "Sincerely,", etc.).
- DO NOT generate ANY sender name (e.g., do NOT write "${userProfile.contact_person || ''}").
- DO NOT generate the company name ("${userProfile.company_name}") or any sender contact block at the bottom of the email.
- DO NOT generate any contact lines (no Email:, no Phone:, no Address:, no Website:, no LinkedIn:) at the end.
- DO NOT generate any signature block or horizontal divider line.
Stop the email body IMMEDIATELY after your final Call to Action sentence. The system will automatically attach the verified signature from the signature panel.`
    : `### SENDER SIGNATURE POLICY:
The signature panel is currently blank.
MANDATE:
Generate a single, professional closing sign-off and sender signature synthesized directly from the sender's website (${senderWebsite || 'https://www.digipresence.in'}), company name (${userProfile.company_name || 'Digi Presence Solutions'}), contact person (${userProfile.contact_person || 'Operations & Growth Team'}), and core services. Include the sender's website and contact touchpoints.`;

  const prompt = `
You are an expert enterprise B2B cold outreach copywriter and business development strategist.
Your objective is to analyze a prospective client company and synthesize a highly personalized, compelling, non-generic cold outreach email from the sender's company.

### SENDER'S BRAND PROFILE (Our Company):
- Company Name: ${userProfile.company_name || 'Digi Presence Solutions'}
- Core Business Capabilities & Strengths: ${Array.isArray(userProfile.services_offered) ? userProfile.services_offered.join(', ') : 'Digital Solutions, Operations, Technology & Outreach Automation'}
- Target Markets & Industry Segments: ${Array.isArray(userProfile.target_markets) ? userProfile.target_markets.join(', ') : 'Global B2B, North America, Europe, Asia'}
- Unique Value Proposition (USP): ${userProfile.unique_selling_proposition || 'Delivering measurable ROI through custom AI workflows, dedicated strategy, and robust execution.'}
- Accreditations & Certifications: ${userProfile.strengths_and_certifications || 'Enterprise Verified, ISO Certified, Industry Leading Partner'}
${portfolioUrl ? `- Company Credentials / Portfolio Deck (URL): ${portfolioUrl}` : ''}

${signatureInstructions}

### PROSPECT DATA (The Lead):
- Company Name: ${lead.company_name || 'Prospective Partner'}
- Contact Person: ${lead.contact_person || 'Business & Operations Leader'}
- Email: ${lead.email || ''}
- Country / Region: ${lead.country || 'International'}
- Website URL: ${lead.website_url || 'N/A'}
- Scraped Web Summary: ${scrapedData?.description || scrapedData?.title || 'Commercial & Enterprise Operations'}
- Detected Capabilities: ${scrapedData?.servicesFound?.join(', ') || 'Enterprise operations'}
- Scraped Website Context:
"""
${scrapedData?.bodyText ? scrapedData.bodyText.substring(0, 2000) : 'No website content available; leverage industry standard intelligence for this company type.'}
"""

### TASK:
Analyze the lead's operational focus and produce a structured JSON response matching the following schema:
{
  "company_profile": "2-3 concise sentences summarizing what this prospect does, their market focus, and their primary operational footprint.",
  "financial_info": "Observable scale indicators (e.g. estimated office count, market presence, enterprise scale, or tier bracket).",
  "email_subject": "A compelling, 4-8 word, curiosity-inducing cold email subject line customized to the prospect's company and operational focus (avoid cheesy spam phrases).",
  "email_body": "A tailored, high-converting B2B cold outreach email formatted in clean, professional HTML with inline styles. Requirements: 1. Address ${lead.contact_person ? lead.contact_person.split(' ')[0] : 'there'} naturally. 2. Reference specific aspects of ${lead.company_name}'s operations. 3. Clearly bridge sender capabilities to prospect needs using clean <p> tags and a styled callout box (<div style='margin: 16px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0;'>...</div>) with <strong> tags for key benefits. 4. Low-friction Call to Action. ${hasPanelSignature ? '5. STOP immediately after the CTA. DO NOT include any closing sign-off or signature block (it will be attached from the signature panel).' : '5. Conclude with a professional closing sign-off and signature generated from the sender website and brand profile.'}"
}

Return ONLY valid JSON matching this exact structure.
`;

  try {
    for (const modelName of candidateModels) {
      const cleanModelName = modelName.replace(/^models\//, '');
      for (const apiVer of ['v1beta', 'v1']) {
        try {
          const restRes = await fetch(
            `https://generativelanguage.googleapis.com/${apiVer}/models/${cleanModelName}:generateContent?key=${cleanedKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': cleanedKey,
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' },
              }),
            }
          );

          if (restRes.ok) {
            const restData = await restRes.json();
            let replyText = restData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) {
              replyText = replyText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
              const parsed = JSON.parse(replyText) as AiEnrichmentResult;
              if (parsed.email_subject && parsed.email_body) {
                return {
                  company_profile: parsed.company_profile || `${lead.company_name} business overview.`,
                  financial_info: parsed.financial_info || 'Established enterprise market presence.',
                  email_subject: parsed.email_subject,
                  email_body: enforceEmailSignature(parsed.email_body, hasPanelSignature ? panelSignature : '', userProfile),
                };
              }
            }
          }
        } catch {
          // continue
        }
      }
    }

    const genAI = new GoogleGenerativeAI(cleanedKey);
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName.replace(/^models\//, ''),
        });

        const response = await model.generateContent(prompt);
        let text = response.response.text();
        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(text) as AiEnrichmentResult;

        if (parsed.email_subject && parsed.email_body) {
          return {
            company_profile: parsed.company_profile || `${lead.company_name} enterprise profile.`,
            financial_info: parsed.financial_info || 'Enterprise commercial presence.',
            email_subject: parsed.email_subject,
            email_body: enforceEmailSignature(parsed.email_body, hasPanelSignature ? panelSignature : '', userProfile),
          };
        }
      } catch {
        continue;
      }
    }

    return generateFallbackEnrichment(lead, scrapedData, userProfile);
  } catch (err: any) {
    console.warn('Gemini API call failed, falling back to smart dynamic generator:', err.message);
    return generateFallbackEnrichment(lead, scrapedData, userProfile);
  }
}

function generateFallbackEnrichment(
  lead: Partial<Lead>,
  scrapedData: ScrapedData | null,
  userProfile: Partial<Profile>
): AiEnrichmentResult {
  const companyName = lead.company_name || 'Your Company';
  const contactName = lead.contact_person ? lead.contact_person.split(' ')[0] : 'there';
  const country = lead.country || 'Global';
  const senderCompany = userProfile.company_name || 'Digi Presence Solutions';
  const services = Array.isArray(userProfile.services_offered) && userProfile.services_offered.length > 0 
    ? userProfile.services_offered.slice(0, 2).join(' & ')
    : 'Custom AI Automation & Business Systems';
  const usp = userProfile.unique_selling_proposition || 'Delivering measurable ROI through custom AI workflows, dedicated strategy, and robust execution.';
  const portfolioUrl = userProfile.portfolio_url || (userProfile as any)?.['portfolio-link'];

  const summaryContext = scrapedData?.description || scrapedData?.title 
    ? `${scrapedData.title ? scrapedData.title + '. ' : ''}${scrapedData.description || ''}`
    : `commercial operations and enterprise services in ${country}`;

  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b; max-width: 620px;">
  <p style="margin: 0 0 16px 0;">Hi ${contactName},</p>
  
  <p style="margin: 0 0 16px 0;">
    I have been following <strong>${companyName}</strong>'s market expansion across ${country}. Given your active focus on scaling operational capacity and client acquisition, I wanted to reach out directly.
  </p>

  <div style="margin: 18px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; color: #334155;">
    At <strong>${senderCompany}</strong>, we specialize in <strong>${services}</strong>${userProfile.strengths_and_certifications ? `, backed by our ${userProfile.strengths_and_certifications}` : ''}. We regularly help leading organizations in your sector accelerate client acquisition and automate core workflows.
  </div>

  <p style="margin: 0 0 16px 0;">
    ${usp}
  </p>

  ${portfolioUrl ? `
  <div style="margin: 18px 0;">
    <a href="${portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}" target="_blank" style="display: inline-block; padding: 7px 14px; background-color: #f0fdfa; color: #0d9488; border: 1px solid #ccfbf1; border-radius: 8px; font-weight: 600; font-size: 12.5px; text-decoration: none;">
      📄 View Company Credentials &amp; Portfolio Deck &rarr;
    </a>
  </div>` : ''}

  <p style="margin: 0 0 16px 0;">
    If this aligns with your current priorities, simply reply directly to this email or call us on the contact number below, and we'll be glad to share relevant benchmarks.
  </p>

  ${formatSignatureAsHtml(userProfile.email_signature || '', userProfile)}
</div>`.trim();

  return {
    company_profile: `${companyName} is an active commercial entity operating out of ${country}, specializing in ${summaryContext.slice(0, 140)}.`,
    financial_info: `Enterprise Tier: Mid-to-Large scale operations with active digital footprint across ${country} and regional partner networks.`,
    email_subject: `Strategic growth & operational efficiency for ${companyName}`,
    email_body: htmlBody,
  };
}


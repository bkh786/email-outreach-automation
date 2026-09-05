import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lead, Profile, ScrapedData, AiEnrichmentResult } from './types';
import { getLiveGeminiModels } from './gemini-models';

// Universal email-safe PNG Icons hosted on high-availability CDN (compatible with Google Image Proxy & desktop email clients)
const PNG_ICONS = {
  phone: 'https://img.icons8.com/color/48/phone.png',
  whatsapp: 'https://img.icons8.com/color/48/whatsapp--v1.png',
  email: 'https://img.icons8.com/color/48/email.png',
  website: 'https://img.icons8.com/color/48/globe--v1.png',
  linkedin: 'https://img.icons8.com/color/48/linkedin.png',
  twitter: 'https://img.icons8.com/color/48/twitterx--v1.png',
  facebook: 'https://img.icons8.com/color/48/facebook-new.png',
  instagram: 'https://img.icons8.com/color/48/instagram-new.png',
  address: 'https://img.icons8.com/color/48/marker.png',
};

function renderIconImg(url: string, alt: string = '') {
  return `<img src="${url}" width="15" height="15" alt="${alt}" style="display: inline-block; vertical-align: -2px; margin-right: 5px; border: 0; outline: none; text-decoration: none;" />`;
}

/**
 * Converts raw signature text into an executive HTML signature with relevant email-safe icons
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
  <div style="margin-top: 6px; line-height: 1.8;">
    <span style="display: inline-block; margin-right: 14px; margin-bottom: 6px; font-size: 12.5px; color: #475569; white-space: nowrap; vertical-align: middle;">
      ${renderIconImg(PNG_ICONS.website, 'Web')}
      <a href="${websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}" target="_blank" style="color: #0d9488; text-decoration: underline; font-weight: 500;">${cleanWeb}</a>
    </span>
  </div>` : ''}
</div>`.trim();
  }

  let trimmed = signature.trim();

  // If already formatted with new PNG icons, return as is
  if (trimmed.includes('border-top: 1px solid') && trimmed.includes('img.icons8.com')) {
    return trimmed;
  }

  // If contains old SVG signature container, strip container wrapper to extract underlying content
  if (trimmed.includes('<svg')) {
    trimmed = trimmed
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
        <span style="display: inline-block; margin-right: 14px; margin-bottom: 6px; font-size: 12.5px; color: #475569; white-space: nowrap; vertical-align: middle;">
          ${renderIconImg(PNG_ICONS.whatsapp, 'WA')}
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
        <span style="display: inline-block; margin-right: 14px; margin-bottom: 6px; font-size: 12.5px; color: #475569; white-space: nowrap; vertical-align: middle;">
          ${renderIconImg(PNG_ICONS.linkedin, 'LinkedIn')}
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
        <span style="display: inline-block; margin-right: 14px; margin-bottom: 6px; font-size: 12.5px; color: #475569; white-space: nowrap; vertical-align: middle;">
          ${renderIconImg(PNG_ICONS.twitter, 'X')}
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
        <span style="display: inline-block; margin-right: 14px; margin-bottom: 6px; font-size: 12.5px; color: #475569; white-space: nowrap; vertical-align: middle;">
          ${renderIconImg(PNG_ICONS.facebook, 'Facebook')}
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
        <span style="display: inline-block; margin-right: 14px; margin-bottom: 6px; font-size: 12.5px; color: #475569; white-space: nowrap; vertical-align: middle;">
          ${renderIconImg(PNG_ICONS.instagram, 'Instagram')}
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
        <span style="display: inline-block; margin-right: 14px; margin-bottom: 6px; font-size: 12.5px; color: #475569; white-space: nowrap; vertical-align: middle;">
          ${renderIconImg(PNG_ICONS.email, 'Email')}
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
        <span style="display: inline-block; margin-right: 14px; margin-bottom: 6px; font-size: 12.5px; color: #475569; white-space: nowrap; vertical-align: middle;">
          ${renderIconImg(PNG_ICONS.phone, 'Phone')}
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
        <span style="display: inline-block; margin-right: 14px; margin-bottom: 6px; font-size: 12.5px; color: #475569; white-space: nowrap; vertical-align: middle;">
          ${renderIconImg(PNG_ICONS.website, 'Website')}
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
        <div style="margin-top: 6px; font-size: 12px; color: #64748b; line-height: 1.45;">
          ${renderIconImg(PNG_ICONS.address, 'Office')}
          <span>${cleanAddress || token}</span>
        </div>
      `.trim());
      continue;
    }

    // Fallback item
    contactPills.push(`<span style="display: inline-block; margin-right: 14px; margin-bottom: 6px; font-size: 12.5px; color: #475569; white-space: nowrap; vertical-align: middle;">${token}</span>`);
  }

  return `
<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13.5px; font-weight: 500;">${signOff}</p>
  <div style="font-weight: 700; color: #0f172a; font-size: 14.5px; line-height: 1.3;">${detectedSender}</div>
  <div style="color: #0d9488; font-weight: 600; font-size: 13px; margin: 2px 0 8px 0;">${detectedCompany}</div>
  ${contactPills.length > 0 ? `
  <div style="margin-top: 6px; line-height: 1.8;">
    ${contactPills.join('\n    ')}
  </div>` : ''}
  ${addressLines.length > 0 ? `
  <div style="margin-top: 6px;">
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

  // 9. Attach Company Credentials / Portfolio Link by default if provided and not already included
  const portfolioUrl = (profile?.portfolio_url || (profile as any)?.['portfolio-link'] || '').trim();
  let portfolioCta = '';
  if (portfolioUrl && !finalHtmlBody.includes(portfolioUrl) && !finalHtmlBody.toLowerCase().includes('company credentials')) {
    const cleanHref = portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`;
    portfolioCta = `
  <div style="margin: 18px 0 14px 0;">
    <a href="${cleanHref}" target="_blank" style="display: inline-block; padding: 7px 15px; background-color: #f0fdfa; color: #0d9488; border: 1px solid #ccfbf1; border-radius: 8px; font-weight: 600; font-size: 12.5px; text-decoration: none;">
      📄 View Company Credentials &amp; Portfolio Deck &rarr;
    </a>
  </div>`;
  }

  // 10. Attach exactly ONE iconified HTML signature card
  const sigToFormat = activeSignature || extractedAiSignature || '';
  const htmlSig = formatSignatureAsHtml(sigToFormat, profile);

  if (hadClosingDiv && /<div[^>]*>/i.test(finalHtmlBody)) {
    return `${finalHtmlBody}${portfolioCta ? `\n\n  ${portfolioCta}` : ''}\n\n  ${htmlSig}\n</div>`;
  }

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b; max-width: 620px;">\n${finalHtmlBody}${portfolioCta ? `\n\n  ${portfolioCta}` : ''}\n\n  ${htmlSig}\n</div>`;
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
${portfolioUrl ? `- Company Credentials / Portfolio Deck (URL): ${portfolioUrl}
MANDATE: Mention or invite the prospect to review this official Company Credentials / Portfolio Deck (${portfolioUrl}) by default.` : ''}

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
  "email_body": "A tailored, high-converting B2B cold outreach email formatted in clean, professional HTML with inline styles. Requirements: 1. Address ${lead.contact_person ? lead.contact_person.split(' ')[0] : 'there'} naturally. 2. Reference specific aspects of ${lead.company_name}'s operations. 3. Clearly bridge sender capabilities to prospect needs using clean <p> tags and a styled callout box (<div style='margin: 16px 0; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0d9488; border-radius: 0 8px 8px 0;'>...</div>) with <strong> tags for key benefits. 4. Low-friction Call to Action. ${portfolioUrl ? `5. Reference or invite the prospect to review our company credentials deck (${portfolioUrl}). ` : ''}${hasPanelSignature ? '6. STOP immediately after the CTA. DO NOT include any closing sign-off or signature block (it will be attached from the signature panel).' : '6. Conclude with a professional closing sign-off and signature generated from the sender website and brand profile.'}"
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


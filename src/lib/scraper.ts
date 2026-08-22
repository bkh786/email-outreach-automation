import * as cheerio from 'cheerio';
import { ScrapedData } from './types';

const FREIGHT_KEYWORDS = [
  'air freight', 'ocean freight', 'fcl', 'lcl', 'customs clearance', 'warehousing',
  '3pl', 'supply chain', 'multimodal', 'road freight', 'logistics', 'intermodal',
  'charter', 'cold chain', 'breakbulk', 'drayage', 'cfs', 'forwarding', 'bonded'
];

export function cleanUrl(url: string): string {
  let clean = url.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  return clean;
}

export async function scrapeWebsite(rawUrl: string): Promise<ScrapedData> {
  const result: ScrapedData = {
    url: rawUrl,
    title: '',
    description: '',
    bodyText: '',
    servicesFound: [],
    locationsFound: [],
    success: false,
  };

  if (!rawUrl || rawUrl.trim() === '') {
    result.error = 'No URL provided';
    return result;
  }

  const targetUrl = cleanUrl(rawUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second safety timeout

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (FreightPulse Research Bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      return result;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title & meta description
    result.title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    result.description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

    // Remove noise elements
    $('script, style, noscript, iframe, svg, nav, footer, header, form').remove();

    // Prefer main container if available
    let mainContent = $('main, #content, .content, article, body').text();

    // Clean whitespace & redundant lines
    const cleanedText = mainContent
      .replace(/\s+/g, ' ')
      .replace(/(\r\n|\n|\r)/gm, ' ')
      .trim();

    // Extract top ~1,200 words
    const words = cleanedText.split(/\s+/).slice(0, 1200);
    result.bodyText = words.join(' ');

    // Detect freight keywords
    const lowerText = cleanedText.toLowerCase();
    result.servicesFound = FREIGHT_KEYWORDS.filter(keyword => lowerText.includes(keyword));

    result.success = true;
    return result;
  } catch (err: any) {
    result.error = err.name === 'AbortError' ? 'Scrape timed out (8s)' : (err.message || 'Scraping failed');
    return result;
  }
}

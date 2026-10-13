// Build external campaign links for MOUTON. Never embed personal data in UTM values.
// Usage: node scripts/campaign-url.mjs <destination> <source> <medium> <campaign> [content]
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ORIGIN = 'https://moutonarchive.com';
const TOKEN = /^[a-z][a-z0-9]*(?:[_-][a-z0-9]+)*$/;

function checkedToken(name, value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64 || !TOKEN.test(value)) {
    throw new Error(`${name} must be a lowercase, non-personal slug (1–64 chars; letters, digits, _ or -)`);
  }
  return value;
}

export function createCampaignUrl(destination, { source, medium, campaign, content } = {}) {
  if (typeof destination !== 'string') throw new Error('destination must be an HTTPS MOUTON URL');
  let url;
  try { url = new URL(destination); }
  catch { throw new Error('destination must be an absolute HTTPS MOUTON URL'); }
  if (url.origin !== ORIGIN || url.username || url.password) {
    throw new Error('destination must stay on https://moutonarchive.com');
  }
  // No arbitrary query strings: they can leak personal information and cause attribution conflicts.
  if (url.search) throw new Error('destination query parameters are not allowed');
  const values = {
    utm_source: checkedToken('source', source),
    utm_medium: checkedToken('medium', medium),
    utm_campaign: checkedToken('campaign', campaign),
  };
  if (content !== undefined) values.utm_content = checkedToken('content', content);
  for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value);
  return url.toString();
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length < 4 || args.length > 5) {
      throw new Error('Usage: node scripts/campaign-url.mjs <destination> <source> <medium> <campaign> [content]');
    }
    const [destination, source, medium, campaign, content] = args;
    process.stdout.write(createCampaignUrl(destination, { source, medium, campaign, content }) + '\n');
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  }
}

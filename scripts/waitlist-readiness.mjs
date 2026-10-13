// Fail-closed configuration for the MOUTON prelaunch email waitlist.
// Does not make network requests or verify a provider account.
// Setting review flags to true requires HUMAN verification of the actual provider setup.
export function waitlistReady(config = {}) {
  if (config.enabled !== true) return false;

  // BD-06 initially supports Buttondown's documented plain HTML POST endpoint.
  // Other providers need a separate reviewed form implementation and validator.
  if (config.provider !== 'buttondown' || config.waitlistService !== 'Buttondown') {
    throw new Error('Waitlist activation requires an approved Buttondown provider configuration');
  }
  if (config.waitlistEmailField !== 'email') {
    throw new Error('Buttondown signup must use the documented email field');
  }
  if (typeof config.waitlistAction !== 'string') {
    throw new Error('Waitlist activation requires a verified HTTPS form action');
  }
  let url;
  try { url = new URL(config.waitlistAction); }
  catch { throw new Error('Waitlist activation requires a valid HTTPS form action'); }
  if (url.protocol !== 'https:' || url.hostname !== 'buttondown.com' ||
      url.port || url.username || url.password || url.search || url.hash ||
      !/^\/api\/emails\/embed-subscribe\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) {
    throw new Error('Waitlist form action must be an official Buttondown embed-subscribe endpoint');
  }
  for (const field of [
    'doubleOptInVerified', 'unsubscribeVerified', 'privacyReviewed', 'senderDetailsVerified',
  ]) {
    if (config[field] !== true) {
      throw new Error('Waitlist activation blocked until verified: ' + field);
    }
  }
  return true;
}

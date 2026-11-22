// The public address of the site. Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every deployment.
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

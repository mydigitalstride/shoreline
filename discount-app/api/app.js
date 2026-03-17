const crypto = require("crypto");

const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;
const SCOPES = "read_customers,read_products";
const REDIRECT_URI = `${process.env.APP_URL}/auth/callback`;

module.exports = function handler(req, res) {
  const { shop, hmac, ...rest } = req.query;

  if (!shop) {
    return res.status(400).send("Missing shop parameter.");
  }

  // Verify HMAC if present (install request from Shopify)
  if (hmac) {
    const message = Object.keys(rest)
      .sort()
      .map((k) => `${k}=${rest[k]}`)
      .join("&");
    const digest = crypto
      .createHmac("sha256", API_SECRET)
      .update(message)
      .digest("hex");
    const valid = crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(hmac)
    );
    if (!valid) return res.status(403).send("Invalid HMAC.");
  }

  // Redirect to Shopify OAuth
  const authUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${API_KEY}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.redirect(authUrl);
};

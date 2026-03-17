const crypto = require("crypto");

const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;

module.exports = async function handler(req, res) {
  const { shop, code, hmac, ...rest } = req.query;

  if (!shop || !code || !hmac) {
    return res.status(400).send("Missing required parameters.");
  }

  // Verify HMAC
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

  // Exchange code for access token (required to complete installation)
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: API_KEY,
      client_secret: API_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return res.status(500).send("Failed to exchange token.");
  }

  // Installation complete — redirect merchant to Shopify admin
  res.redirect(`https://${shop}/admin`);
};

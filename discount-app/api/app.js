const API_KEY = process.env.SHOPIFY_API_KEY;
const SCOPES = "read_customers,read_products,write_discounts";
const REDIRECT_URI = `${process.env.APP_URL}/auth/callback`;

module.exports = function handler(req, res) {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).send("Missing shop parameter.");
  }

  const authUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${API_KEY}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  res.redirect(authUrl);
};

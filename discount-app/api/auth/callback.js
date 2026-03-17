const crypto = require("crypto");

const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;
const API_VERSION = "2025-10";
const DISCOUNT_TITLE = "Distributor Pricing";
const FUNCTION_TITLE = "Distributor Pricing Function";

async function shopifyGQL(shop, token, query, variables = {}) {
  const res = await fetch(
    `https://${shop}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  return res.json();
}

/**
 * Ensures the Distributor Pricing automatic discount exists for this shop.
 * Idempotent: skips creation if a discount with the same title already exists.
 */
async function ensureDiscount(shop, token) {
  // 1. Find the deployed Shopify Function
  const fnResult = await shopifyGQL(
    shop,
    token,
    `{ shopifyFunctions(first: 50) { nodes { id title apiType } } }`
  );

  const fn = fnResult?.data?.shopifyFunctions?.nodes?.find(
    (f) => f.title === FUNCTION_TITLE
  );

  if (!fn) {
    console.warn("Distributor Pricing Function not found — skipping discount creation.");
    return;
  }

  // 2. Check whether the automatic discount already exists
  const existingResult = await shopifyGQL(
    shop,
    token,
    `{
      automaticDiscountNodes(first: 50) {
        nodes {
          automaticDiscount {
            ... on DiscountAutomaticApp { title }
          }
        }
      }
    }`
  );

  const existing = existingResult?.data?.automaticDiscountNodes?.nodes ?? [];
  const alreadyExists = existing.some(
    (n) => n.automaticDiscount?.title === DISCOUNT_TITLE
  );

  if (alreadyExists) return;

  // 3. Create the automatic discount linked to the function
  const mutation = `
    mutation CreateDistributorDiscount($input: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $input) {
        automaticAppDiscount { discountId title }
        userErrors { field message }
      }
    }
  `;

  const result = await shopifyGQL(shop, token, mutation, {
    input: {
      title: DISCOUNT_TITLE,
      functionId: fn.id,
      startsAt: new Date().toISOString(),
    },
  });

  const errors = result?.data?.discountAutomaticAppCreate?.userErrors;
  if (errors?.length) {
    console.error("Discount creation errors:", JSON.stringify(errors));
  }
}

module.exports = async function handler(req, res) {
  const { hmac, ...params } = req.query;
  const { shop, code } = params;

  if (!shop || !code || !hmac) {
    return res.status(400).send("Missing required parameters.");
  }

  // Verify HMAC — message must include ALL params except hmac itself
  const message = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
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

  const { access_token } = await tokenRes.json();

  // Create the Automatic Discount in Shopify so it appears in the Discounts list
  try {
    await ensureDiscount(shop, access_token);
  } catch (err) {
    // Non-fatal — don't block the install redirect on a discount-creation failure
    console.error("ensureDiscount failed:", err);
  }

  // Redirect merchant to the app dashboard
  res.redirect(`${process.env.APP_URL}/dashboard?shop=${shop}`);
};

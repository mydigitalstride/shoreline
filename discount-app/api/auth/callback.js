const crypto = require("crypto");

const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;
const API_VERSION = "2025-10";
const DISCOUNT_TITLE = "Distributor Pricing";

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
 * Returns an object: { status, discountId?, functionId?, error? }
 */
async function ensureDiscount(shop, token) {
  // 1. Find our product-discount function (match by apiType, not just title,
  //    in case the partner dashboard name differs slightly from the toml name)
  const fnResult = await shopifyGQL(
    shop,
    token,
    `{ shopifyFunctions(first: 50) { nodes { id title apiType } } }`
  );

  const allFunctions = fnResult?.data?.shopifyFunctions?.nodes ?? [];

  // Match by title OR by apiType=product_discounts (our app only has one)
  const fn =
    allFunctions.find((f) => f.title === "Distributor Pricing Function") ||
    allFunctions.find((f) =>
      ["product_discounts", "PRODUCT_DISCOUNTS"].includes(f.apiType)
    );

  if (!fn) {
    return {
      status: "function_not_found",
      error: `No product_discounts function found. All functions: ${JSON.stringify(
        allFunctions.map((f) => ({ title: f.title, apiType: f.apiType }))
      )}`,
    };
  }

  // 2. Check whether the automatic discount already exists
  const existingResult = await shopifyGQL(
    shop,
    token,
    `{
      automaticDiscountNodes(first: 50) {
        nodes {
          id
          automaticDiscount {
            ... on DiscountAutomaticApp { title discountId }
          }
        }
      }
    }`
  );

  const existing = existingResult?.data?.automaticDiscountNodes?.nodes ?? [];
  const duplicate = existing.find(
    (n) => n.automaticDiscount?.title === DISCOUNT_TITLE
  );

  if (duplicate) {
    return {
      status: "already_exists",
      discountId: duplicate.automaticDiscount?.discountId,
      functionId: fn.id,
    };
  }

  // 3. Create the automatic discount linked to the function
  const result = await shopifyGQL(
    shop,
    token,
    `mutation CreateDistributorDiscount($input: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $input) {
        automaticAppDiscount { discountId title }
        userErrors { field message }
      }
    }`,
    {
      input: {
        title: DISCOUNT_TITLE,
        functionId: fn.id,
        startsAt: new Date().toISOString(),
      },
    }
  );

  const userErrors =
    result?.data?.discountAutomaticAppCreate?.userErrors ?? [];
  if (userErrors.length) {
    return {
      status: "error",
      error: userErrors.map((e) => `${e.field}: ${e.message}`).join("; "),
      functionId: fn.id,
    };
  }

  return {
    status: "created",
    discountId:
      result?.data?.discountAutomaticAppCreate?.automaticAppDiscount?.discountId,
    functionId: fn.id,
  };
}

module.exports = async function handler(req, res) {
  const { hmac, ...params } = req.query;
  const { shop, code } = params;

  if (!shop || !code || !hmac) {
    return res.status(400).send("Missing required parameters.");
  }

  // Verify HMAC
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

  // Exchange code for access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: API_KEY, client_secret: API_SECRET, code }),
  });

  if (!tokenRes.ok) {
    return res.status(500).send("Failed to exchange token.");
  }

  const { access_token } = await tokenRes.json();

  // Store token in a short-lived httpOnly cookie so /api/setup can use it
  res.setHeader(
    "Set-Cookie",
    `dist_token=${encodeURIComponent(
      access_token
    )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
  );

  // Try to create the Automatic Discount
  let setupStatus = "unknown";
  let setupDetail = "";
  try {
    const result = await ensureDiscount(shop, access_token);
    setupStatus = result.status;
    setupDetail = result.error || "";
    console.log(`[setup] shop=${shop} status=${result.status}`, result);
  } catch (err) {
    setupStatus = "exception";
    setupDetail = String(err);
    console.error("[setup] exception:", err);
  }

  // Redirect to dashboard with setup result so user can see what happened
  const qs = new URLSearchParams({ shop, setup: setupStatus });
  if (setupDetail) qs.set("detail", setupDetail.slice(0, 200));
  res.redirect(`${process.env.APP_URL}/dashboard?${qs.toString()}`);
};

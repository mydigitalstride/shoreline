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

async function ensureDiscount(shop, token) {
  // 1. Find our product-discount function — try every possible field/format
  const fnResult = await shopifyGQL(
    shop,
    token,
    `{ shopifyFunctions(first: 50) { nodes { id title apiType } } }`
  );

  const allFunctions = fnResult?.data?.shopifyFunctions?.nodes ?? [];
  const gqlErrors = fnResult?.errors;

  if (gqlErrors) {
    return {
      status: "error",
      step: "shopifyFunctions",
      error: JSON.stringify(gqlErrors),
      allFunctions: [],
    };
  }

  // Match by title, or fall back to any product-discounts-type function
  const fn =
    allFunctions.find((f) => f.title === "Distributor Pricing Function") ||
    allFunctions.find((f) =>
      /product.?discount/i.test(f.apiType || "")
    );

  if (!fn) {
    return {
      status: "function_not_found",
      error: `No product-discount function found.`,
      allFunctions: allFunctions.map((f) => ({ title: f.title, apiType: f.apiType })),
    };
  }

  // 2. Check for existing discount with same title
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

  // 3. Create the automatic discount
  const result = await shopifyGQL(
    shop,
    token,
    `mutation CreateDistributorDiscount($input: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $input) {
        automaticAppDiscount { discountId title }
        userErrors { field message code }
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

  const createErrors = result?.errors;
  const userErrors =
    result?.data?.discountAutomaticAppCreate?.userErrors ?? [];

  if (createErrors) {
    return {
      status: "error",
      step: "discountAutomaticAppCreate",
      error: JSON.stringify(createErrors),
      functionId: fn.id,
    };
  }
  if (userErrors.length) {
    return {
      status: "error",
      step: "discountAutomaticAppCreate",
      userErrors,
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

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: API_KEY, client_secret: API_SECRET, code }),
  });

  if (!tokenRes.ok) {
    return res.status(500).send("Failed to exchange token.");
  }

  const tokenData = await tokenRes.json();
  const { access_token, scope: grantedScope } = tokenData;

  // Store token in httpOnly cookie (1 hour) so /setup can reuse it
  res.setHeader(
    "Set-Cookie",
    `dist_token=${encodeURIComponent(access_token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
  );

  const qs = new URLSearchParams({ shop });

  // Check that write_discounts was actually granted
  const hasWriteDiscounts =
    typeof grantedScope === "string" &&
    grantedScope.split(",").includes("write_discounts");

  if (!hasWriteDiscounts) {
    // Scope was not granted — merchant needs to re-approve or Partner Dashboard
    // needs to be updated. Redirect with a clear status so the dashboard shows
    // specific instructions.
    qs.set("setup", "missing_scope");
    qs.set("granted_scope", grantedScope || "unknown");
    return res.redirect(`${process.env.APP_URL}/dashboard?${qs.toString()}`);
  }

  // Scope is granted — try to create the discount automatically
  let result = { status: "unknown" };
  try {
    result = await ensureDiscount(shop, access_token);
    console.log(`[setup] shop=${shop}`, JSON.stringify(result));
  } catch (err) {
    result = { status: "exception", error: String(err) };
    console.error("[setup] exception:", err);
  }

  qs.set("setup", result.status);
  if (result.error) qs.set("detail", String(result.error).slice(0, 300));
  if (result.allFunctions)
    qs.set("fns", JSON.stringify(result.allFunctions).slice(0, 300));

  res.redirect(`${process.env.APP_URL}/dashboard?${qs.toString()}`);
};

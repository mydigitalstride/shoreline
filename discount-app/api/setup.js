/**
 * POST /setup?shop=xxx.myshopify.com
 *
 * Creates the "Distributor Pricing" automatic discount using the deployed
 * Shopify Function. Reads the access token from the httpOnly cookie set
 * during OAuth. Returns JSON with the result.
 */

const API_VERSION = "2025-10";
const DISCOUNT_TITLE = "Distributor Pricing";

function getCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: "Missing shop" });

  const token = getCookie(req, "dist_token");
  if (!token) {
    return res.status(401).json({
      error: "Session expired. Please re-open the app from Shopify admin to refresh.",
    });
  }

  try {
    // Fetch all installed functions
    const fnResult = await shopifyGQL(
      shop,
      token,
      `{ shopifyFunctions(first: 50) { nodes { id title apiType } } }`
    );

    const allFunctions = fnResult?.data?.shopifyFunctions?.nodes ?? [];
    const fnErrors = fnResult?.errors;

    if (fnErrors) {
      return res.status(200).json({
        status: "error",
        step: "shopifyFunctions",
        error: JSON.stringify(fnErrors),
        allFunctions,
      });
    }

    const fn =
      allFunctions.find((f) => f.title === "Distributor Pricing Function") ||
      allFunctions.find((f) =>
        ["product_discounts", "PRODUCT_DISCOUNTS"].includes(f.apiType)
      );

    if (!fn) {
      return res.status(200).json({
        status: "function_not_found",
        step: "shopifyFunctions",
        allFunctions: allFunctions.map((f) => ({
          title: f.title,
          apiType: f.apiType,
        })),
      });
    }

    // Check for existing discount
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

    const existing =
      existingResult?.data?.automaticDiscountNodes?.nodes ?? [];
    const duplicate = existing.find(
      (n) => n.automaticDiscount?.title === DISCOUNT_TITLE
    );

    if (duplicate) {
      return res.status(200).json({
        status: "already_exists",
        discountId: duplicate.automaticDiscount?.discountId,
        functionId: fn.id,
      });
    }

    // Create the automatic discount
    const createResult = await shopifyGQL(
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

    const userErrors =
      createResult?.data?.discountAutomaticAppCreate?.userErrors ?? [];
    const gqlErrors = createResult?.errors;

    if (gqlErrors) {
      return res.status(200).json({
        status: "error",
        step: "discountAutomaticAppCreate",
        error: JSON.stringify(gqlErrors),
        functionId: fn.id,
      });
    }

    if (userErrors.length) {
      return res.status(200).json({
        status: "error",
        step: "discountAutomaticAppCreate",
        userErrors,
        functionId: fn.id,
      });
    }

    return res.status(200).json({
      status: "created",
      discountId:
        createResult?.data?.discountAutomaticAppCreate?.automaticAppDiscount
          ?.discountId,
      functionId: fn.id,
    });
  } catch (err) {
    return res.status(200).json({ status: "exception", error: String(err) });
  }
};

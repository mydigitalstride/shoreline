/**
 * Shopify Function: Distributor Pricing + Tier Volume Discounts
 *
 * For customers tagged "distributor":
 *   1. Reads the `custom.distributor_price` metafield from each variant.
 *   2. Sums the distributor prices × quantities to get the dealer subtotal.
 *   3. Resolves the volume tier from that subtotal:
 *        Tier 1 — $2,500+  → 5%  off distributor price
 *        Tier 2 — $5,000+  → 7%  off distributor price
 *        Tier 3 — $10,000+ → 10% off distributor price
 *   4. Computes the final price per variant:
 *        final = distributor_price × (1 − tier%)
 *   5. Expresses that as a percentage off the regular Shopify price and
 *      returns one discount target per line so Shopify applies the correct
 *      amount at the cart total, order summary, and checkout.
 *
 * @param {import("../generated/api").RunInput} input
 * @returns {import("../generated/api").FunctionRunResult}
 */
export function run(input) {
  const EMPTY = { discounts: [], discountApplicationStrategy: "ALL" };

  // Only apply to logged-in distributor customers
  const customer = input.cart.buyerIdentity?.customer;
  if (!customer) return EMPTY;
  if (!customer.hasAnyTag) return EMPTY;

  const lines = input.cart.lines;

  // ─── Step 1: Calculate the dealer subtotal using distributor prices ───────
  // This is used to determine which volume tier applies.
  let dealerSubtotal = 0;

  for (const line of lines) {
    if (line.merchandise.__typename !== "ProductVariant") continue;

    const distPrice = parseDistributorPrice(line.merchandise.metafield);
    const regularPrice = parseFloat(line.cost.amountPerQuantity.amount);

    // Fall back to regular price if no metafield is set on this variant
    const linePrice = distPrice !== null ? distPrice : regularPrice;
    dealerSubtotal += linePrice * line.quantity;
  }

  // ─── Step 2: Resolve volume tier ─────────────────────────────────────────
  let tierPct = 0;
  if (dealerSubtotal >= 10000) {
    tierPct = 10;
  } else if (dealerSubtotal >= 5000) {
    tierPct = 7;
  } else if (dealerSubtotal >= 2500) {
    tierPct = 5;
  }

  // ─── Step 3: Build one discount per line item ─────────────────────────────
  const discounts = [];

  for (const line of lines) {
    if (line.merchandise.__typename !== "ProductVariant") continue;

    const distPrice = parseDistributorPrice(line.merchandise.metafield);
    if (distPrice === null) continue; // no distributor price set, skip

    const regularPrice = parseFloat(line.cost.amountPerQuantity.amount);

    // Final price = distributor base price with volume tier applied on top.
    // NOTE: we check finalPrice (not distPrice) against regularPrice so the
    // tier discount still fires when distributor_price equals the retail price.
    const tierOff = distPrice * (tierPct / 100);
    const finalPrice = distPrice - tierOff;

    if (finalPrice >= regularPrice) continue; // final price not cheaper than retail, skip

    // Express as % off the regular Shopify price
    const discountPct = ((regularPrice - finalPrice) / regularPrice) * 100;

    const label =
      tierPct > 0
        ? `Distributor Pricing + ${tierPct}% Volume Discount`
        : "Distributor Pricing";

    discounts.push({
      message: label,
      targets: [
        {
          productVariant: {
            id: line.merchandise.id,
          },
        },
      ],
      value: {
        percentage: {
          // Round to 4 decimal places to avoid floating-point drift
          value: String(Math.round(discountPct * 10000) / 10000),
        },
      },
    });
  }

  if (discounts.length === 0) return EMPTY;

  return {
    discounts,
    // ALL applies each discount to its respective target independently
    discountApplicationStrategy: "ALL",
  };
}

/**
 * Parses the distributor_price metafield value into a dollar amount (float).
 *
 * Shopify stores `money` metafields as a JSON string in Functions:
 *   '{"amount":"650.00","currency_code":"USD"}'
 *
 * Falls back to plain numeric strings just in case.
 *
 * @param {{value: string} | null} metafield
 * @returns {number | null} price in dollars, or null if not found
 */
function parseDistributorPrice(metafield) {
  if (!metafield?.value) return null;

  // Try JSON money object first: {"amount":"650.00","currency_code":"USD"}
  try {
    const parsed = JSON.parse(metafield.value);
    if (parsed?.amount != null) {
      return parseFloat(parsed.amount);
    }
  } catch (_) {
    // Not JSON — fall through
  }

  // Plain decimal string (e.g. "650.00")
  const num = parseFloat(metafield.value);
  return isNaN(num) ? null : num;
}

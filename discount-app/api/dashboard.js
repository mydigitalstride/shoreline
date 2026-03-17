module.exports = function handler(req, res) {
  const { shop } = req.query;

  const shopDisplay = shop || "your store";

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Distributor Pricing — Shoreline Brands</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f6f6f7;
      color: #202223;
      min-height: 100vh;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 760px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #d4edda;
      color: #155724;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.3rem 0.65rem;
      border-radius: 999px;
    }

    h1 {
      font-size: 1.6rem;
      font-weight: 700;
    }

    .subtitle {
      color: #6d7175;
      font-size: 0.95rem;
      margin-top: 0.2rem;
    }

    .card {
      background: #fff;
      border: 1px solid #e1e3e5;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.25rem;
    }

    .card h2 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 1rem;
      padding-bottom: 0.6rem;
      border-bottom: 1px solid #f1f2f3;
    }

    .tier-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .tier-table th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      background: #f9fafb;
      font-weight: 600;
      color: #6d7175;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e1e3e5;
    }

    .tier-table td {
      padding: 0.65rem 0.75rem;
      border-bottom: 1px solid #f1f2f3;
    }

    .tier-table tr:last-child td { border-bottom: none; }

    .pill {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .pill-blue  { background: #dbeafe; color: #1e40af; }
    .pill-green { background: #d1fae5; color: #065f46; }
    .pill-gold  { background: #fef3c7; color: #92400e; }

    .step-list {
      list-style: none;
      counter-reset: steps;
    }

    .step-list li {
      counter-increment: steps;
      display: flex;
      gap: 0.85rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .step-list li::before {
      content: counter(steps);
      flex-shrink: 0;
      width: 1.6rem;
      height: 1.6rem;
      border-radius: 50%;
      background: #5c6ac4;
      color: #fff;
      font-weight: 700;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    code {
      background: #f3f4f6;
      border: 1px solid #e1e3e5;
      border-radius: 4px;
      padding: 0.15rem 0.4rem;
      font-size: 0.85rem;
      font-family: "SFMono-Regular", Consolas, monospace;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f1f2f3;
      font-size: 0.9rem;
    }

    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6d7175; }
    .info-value { font-weight: 500; }

    footer {
      text-align: center;
      font-size: 0.8rem;
      color: #9ca3af;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Distributor Pricing</h1>
        <p class="subtitle">Active on <strong>${shopDisplay}</strong></p>
      </div>
      <span class="badge">&#10003; Installed</span>
    </div>

    <!-- Status -->
    <div class="card">
      <h2>App Status</h2>
      <div class="info-row">
        <span class="info-label">Function</span>
        <span class="info-value">distributor-pricing-function</span>
      </div>
      <div class="info-row">
        <span class="info-label">Trigger</span>
        <span class="info-value">purchase.product-discount.run</span>
      </div>
      <div class="info-row">
        <span class="info-label">Customer eligibility</span>
        <span class="info-value">Tag: <code>distributor</code></span>
      </div>
      <div class="info-row">
        <span class="info-label">Metafield namespace</span>
        <span class="info-value"><code>custom.distributor_price</code></span>
      </div>
    </div>

    <!-- Tier Table -->
    <div class="card">
      <h2>Volume Discount Tiers</h2>
      <table class="tier-table">
        <thead>
          <tr>
            <th>Tier</th>
            <th>Dealer Subtotal</th>
            <th>Additional Discount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="pill pill-blue">Base</span></td>
            <td>Any amount</td>
            <td>Distributor price only</td>
          </tr>
          <tr>
            <td><span class="pill pill-blue">Tier 1</span></td>
            <td>$2,500+</td>
            <td>5% off distributor price</td>
          </tr>
          <tr>
            <td><span class="pill pill-green">Tier 2</span></td>
            <td>$5,000+</td>
            <td>7% off distributor price</td>
          </tr>
          <tr>
            <td><span class="pill pill-gold">Tier 3</span></td>
            <td>$10,000+</td>
            <td>10% off distributor price</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Setup Instructions -->
    <div class="card">
      <h2>Setup Checklist</h2>
      <ol class="step-list">
        <li>
          Tag any wholesale customer with <code>distributor</code> in the Shopify admin
          (Customers → select customer → Tags).
        </li>
        <li>
          On each product variant, add a metafield:<br />
          Namespace &amp; key: <code>custom.distributor_price</code> &nbsp;|&nbsp; Type: <strong>Money</strong><br />
          Set the wholesale price (e.g. <code>650.00</code>).
        </li>
        <li>
          Ensure the Shopify discount using this function is <strong>active</strong> in
          <em>Discounts → Automatic discounts</em>.
        </li>
        <li>
          Test by logging in as a distributor customer and adding products to the cart —
          the discount label will appear as <em>"Distributor Pricing"</em> or
          <em>"Distributor Pricing + X% Volume Discount"</em>.
        </li>
      </ol>
    </div>
  </div>
  <footer>Shoreline Brands Co &mdash; Distributor Pricing App</footer>
</body>
</html>`);
};

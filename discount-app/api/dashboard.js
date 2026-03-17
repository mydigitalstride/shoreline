module.exports = function handler(req, res) {
  const { shop, setup, detail } = req.query;

  const shopDisplay = shop || "your store";

  // Determine setup banner config from ?setup= param
  let setupBanner = "";
  if (setup === "created") {
    setupBanner = `<div class="banner banner-success">
      &#10003; <strong>Discount created.</strong>
      "Distributor Pricing" now appears in
      <a href="https://${shop}/admin/discounts" target="_blank">Shopify Admin → Discounts</a>
      and is active for all distributor customers.
    </div>`;
  } else if (setup === "already_exists") {
    setupBanner = `<div class="banner banner-success">
      &#10003; <strong>Discount already active.</strong>
      "Distributor Pricing" is connected and running.
    </div>`;
  } else if (setup === "function_not_found") {
    setupBanner = `<div class="banner banner-warn">
      &#9888; <strong>Function not found.</strong>
      The Shopify Function extension may not be deployed yet.
      Make sure the app extension is pushed via <code>shopify app deploy</code>,
      then use the button below to retry.
      ${detail ? `<pre class="detail">${escHtml(detail)}</pre>` : ""}
    </div>`;
  } else if (setup === "error" || setup === "exception") {
    setupBanner = `<div class="banner banner-error">
      &#10007; <strong>Setup failed.</strong>
      ${detail ? `<pre class="detail">${escHtml(detail)}</pre>` : ""}
      Check that <code>write_discounts</code> scope is approved in the
      <a href="https://partners.shopify.com" target="_blank">Partner Dashboard</a>,
      then retry below.
    </div>`;
  } else {
    // No setup param — prompt user to connect
    setupBanner = `<div class="banner banner-warn">
      &#9888; <strong>Discount function not yet connected.</strong>
      Click <em>Connect Discount Function</em> below to create the Automatic Discount
      in Shopify. This only needs to be done once.
    </div>`;
  }

  const setupCard =
    setup !== "created" && setup !== "already_exists"
      ? `<div class="card" id="setup-card">
          <h2>Connect Discount Function</h2>
          <p style="font-size:.9rem;color:#6d7175;margin-bottom:1rem;">
            Creates the "Distributor Pricing" Automatic Discount in Shopify Admin
            and links it to the deployed Shopify Function. Run this once after
            installation (or after re-deploying the function extension).
          </p>
          <button class="setup-btn" id="setupBtn" onclick="runSetup()">
            Connect Discount Function
          </button>
          <div id="setupResult" style="margin-top:1rem;font-size:.85rem;"></div>
        </div>`
      : "";

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

    .container { max-width: 760px; margin: 0 auto; }

    .header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
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

    h1 { font-size: 1.6rem; font-weight: 700; }
    .subtitle { color: #6d7175; font-size: 0.95rem; margin-top: 0.2rem; }

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

    .banner {
      border-radius: 6px;
      padding: 0.85rem 1rem;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .banner a { color: inherit; }
    .banner-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .banner-warn    { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
    .banner-error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

    .detail {
      font-size: 0.78rem;
      background: rgba(0,0,0,0.06);
      padding: 0.5rem;
      border-radius: 4px;
      margin-top: 0.5rem;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .tier-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
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
    .tier-table td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #f1f2f3; }
    .tier-table tr:last-child td { border-bottom: none; }

    .pill { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    .pill-blue  { background: #dbeafe; color: #1e40af; }
    .pill-green { background: #d1fae5; color: #065f46; }
    .pill-gold  { background: #fef3c7; color: #92400e; }

    .step-list { list-style: none; counter-reset: steps; }
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
      width: 1.6rem; height: 1.6rem;
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

    .setup-btn {
      background: #5c6ac4;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 0.6rem 1.2rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    .setup-btn:hover { background: #4959bd; }
    .setup-btn:disabled { opacity: 0.6; cursor: default; }

    footer { text-align: center; font-size: 0.8rem; color: #9ca3af; margin-top: 2rem; }
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

    ${setupBanner}
    ${setupCard}

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
          Set the wholesale base price (e.g. <code>650.00</code>).
        </li>
        <li>
          Confirm "Distributor Pricing" appears in
          <a href="https://${shop}/admin/discounts" target="_blank">Admin → Discounts → Automatic discounts</a>.
          If not, use the <em>Connect Discount Function</em> button above.
        </li>
        <li>
          Test by logging in as a distributor customer and adding products to the
          cart — the discount label <em>"Distributor Pricing"</em> or
          <em>"Distributor Pricing + X% Volume Discount"</em> will appear.
        </li>
      </ol>
    </div>
  </div>

  <footer>Shoreline Brands Co &mdash; Distributor Pricing App</footer>

  <script>
    async function runSetup() {
      const btn = document.getElementById('setupBtn');
      const result = document.getElementById('setupResult');
      btn.disabled = true;
      btn.textContent = 'Connecting…';
      result.textContent = '';

      try {
        const shop = ${JSON.stringify(shop || "")};
        const res = await fetch('/setup?shop=' + encodeURIComponent(shop), { method: 'POST' });
        const data = await res.json();

        if (data.status === 'created') {
          result.innerHTML = '<span style="color:#155724">&#10003; Discount created! Reload to update this page.</span>';
          setTimeout(() => location.reload(), 1500);
        } else if (data.status === 'already_exists') {
          result.innerHTML = '<span style="color:#155724">&#10003; Discount already exists and is active.</span>';
          setTimeout(() => location.reload(), 1500);
        } else if (data.status === 'function_not_found') {
          result.innerHTML = '<span style="color:#856404">&#9888; Function not found. Make sure the extension is deployed.<br><pre style="font-size:.78rem;white-space:pre-wrap;margin-top:.5rem">' + JSON.stringify(data, null, 2) + '</pre></span>';
          btn.disabled = false;
          btn.textContent = 'Retry';
        } else if (res.status === 401) {
          result.innerHTML = '<span style="color:#721c24">&#10007; Session expired. <a href="/?shop=' + encodeURIComponent(shop) + '">Re-open the app</a> from Shopify admin to refresh your session, then try again.</span>';
        } else {
          result.innerHTML = '<span style="color:#721c24">&#10007; Error: <pre style="font-size:.78rem;white-space:pre-wrap;margin-top:.5rem">' + JSON.stringify(data, null, 2) + '</pre></span>';
          btn.disabled = false;
          btn.textContent = 'Retry';
        }
      } catch (err) {
        result.innerHTML = '<span style="color:#721c24">&#10007; Network error: ' + err + '</span>';
        btn.disabled = false;
        btn.textContent = 'Retry';
      }
    }
  </script>
</body>
</html>`);
};

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

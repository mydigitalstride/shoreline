function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = function handler(req, res) {
  const { shop, setup, detail, granted_scope, fns } = req.query;
  const shopDisplay = shop || "your store";

  // ── Banner ────────────────────────────────────────────────────────────────
  let banner = "";
  let showConnectButton = false;
  let showManual = false;

  if (setup === "created") {
    banner = `<div class="banner banner-success">
      ✓ <strong>Discount created.</strong>
      "Distributor Pricing" is now active in
      <a href="https://${escHtml(shop)}/admin/discounts" target="_blank">Admin → Discounts</a>.
    </div>`;
  } else if (setup === "already_exists") {
    banner = `<div class="banner banner-success">
      ✓ <strong>Discount already active.</strong>
      "Distributor Pricing" is connected and running for distributor customers.
    </div>`;
  } else if (setup === "missing_scope") {
    const granted = escHtml(granted_scope || "unknown");
    banner = `<div class="banner banner-error">
      ✗ <strong>Permission not granted.</strong>
      The <code>write_discounts</code> scope was not in the approved permissions
      (granted: <code>${granted}</code>).<br><br>
      <strong>Fix:</strong> In the
      <a href="https://partners.shopify.com" target="_blank">Partner Dashboard</a>,
      go to your app → <strong>Configuration</strong> → scroll to
      <strong>Admin API integration</strong> → check <strong>write_discounts</strong>
      → Save. Then re-install the app.
    </div>`;
    showManual = true;
  } else if (setup === "function_not_found") {
    const fnList = escHtml(fns || detail || "none returned");
    banner = `<div class="banner banner-error">
      ✗ <strong>Shopify Function not found.</strong>
      The function extension may not be deployed yet, or its title doesn't match.<br>
      Functions returned: <code>${fnList}</code><br><br>
      Use <strong>Connect Discount Function</strong> below to retry, or follow
      the Manual Setup steps.
    </div>`;
    showConnectButton = true;
    showManual = true;
  } else if (setup === "error" || setup === "exception") {
    banner = `<div class="banner banner-error">
      ✗ <strong>Setup failed.</strong>
      ${detail ? `<pre class="detail">${escHtml(detail)}</pre>` : ""}
      Use <strong>Connect Discount Function</strong> below to retry.
    </div>`;
    showConnectButton = true;
    showManual = true;
  } else {
    // No setup param — first visit or unknown state
    banner = `<div class="banner banner-warn">
      ⚠ <strong>Discount not yet connected.</strong>
      Click <em>Connect Discount Function</em> below to create the Automatic
      Discount, or follow the Manual Setup steps.
    </div>`;
    showConnectButton = true;
    showManual = true;
  }

  // ── Connect button card ───────────────────────────────────────────────────
  const connectCard = showConnectButton
    ? `<div class="card">
        <h2>Connect Discount Function</h2>
        <p class="sub">Creates the "Distributor Pricing" Automatic Discount in Shopify
        and links it to the deployed function. Safe to run multiple times.</p>
        <button class="setup-btn" id="setupBtn" onclick="runSetup()">
          Connect Discount Function
        </button>
        <div id="setupResult" style="margin-top:1rem;font-size:.85rem;"></div>
      </div>`
    : "";

  // ── Manual setup card ─────────────────────────────────────────────────────
  const manualCard = showManual
    ? `<div class="card">
        <h2>Manual Setup (Fallback)</h2>
        <p class="sub">If the automatic connection above fails, create the discount
        manually in 3 steps:</p>
        <ol class="step-list">
          <li>
            In Shopify Admin go to
            <a href="https://${escHtml(shop)}/admin/discounts" target="_blank">
              Discounts → Create discount
            </a>.
          </li>
          <li>
            Choose <strong>"Distributor Pricing"</strong> from the list of
            app-based discount types (it appears there after the function is deployed).
          </li>
          <li>
            Set title to <strong>Distributor Pricing</strong>, leave all other fields
            as default, and click <strong>Save</strong>.
          </li>
        </ol>
      </div>`
    : "";

  const shopJson = JSON.stringify(shop || "");

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
      background: #f6f6f7; color: #202223; min-height: 100vh; padding: 2rem 1rem;
    }
    .container { max-width: 760px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .badge {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: #d4edda; color: #155724; font-size: 0.8rem; font-weight: 600;
      padding: 0.3rem 0.65rem; border-radius: 999px;
    }
    h1 { font-size: 1.6rem; font-weight: 700; }
    .subtitle { color: #6d7175; font-size: 0.95rem; margin-top: 0.2rem; }
    .card {
      background: #fff; border: 1px solid #e1e3e5; border-radius: 8px;
      padding: 1.5rem; margin-bottom: 1.25rem;
    }
    .card h2 {
      font-size: 1rem; font-weight: 700; margin-bottom: 1rem;
      padding-bottom: 0.6rem; border-bottom: 1px solid #f1f2f3;
    }
    .sub { font-size: .9rem; color: #6d7175; margin-bottom: 1rem; }
    .banner {
      border-radius: 6px; padding: 0.85rem 1rem;
      margin-bottom: 1.25rem; font-size: 0.9rem; line-height: 1.5;
    }
    .banner a { color: inherit; }
    .banner code { background: rgba(0,0,0,.08); padding: .1rem .3rem; border-radius: 3px; }
    .banner-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .banner-warn    { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
    .banner-error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .detail {
      font-size: .78rem; background: rgba(0,0,0,.06); padding: .5rem;
      border-radius: 4px; margin-top: .5rem; white-space: pre-wrap; word-break: break-all;
    }
    .tier-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    .tier-table th {
      text-align: left; padding: .5rem .75rem; background: #f9fafb;
      font-weight: 600; color: #6d7175; font-size: .8rem;
      text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid #e1e3e5;
    }
    .tier-table td { padding: .65rem .75rem; border-bottom: 1px solid #f1f2f3; }
    .tier-table tr:last-child td { border-bottom: none; }
    .pill { display: inline-block; padding: .2rem .6rem; border-radius: 999px; font-size: .8rem; font-weight: 600; }
    .pill-blue  { background: #dbeafe; color: #1e40af; }
    .pill-green { background: #d1fae5; color: #065f46; }
    .pill-gold  { background: #fef3c7; color: #92400e; }
    .step-list { list-style: none; counter-reset: steps; }
    .step-list li {
      counter-increment: steps; display: flex;
      gap: .85rem; margin-bottom: 1rem; font-size: .9rem; line-height: 1.5;
    }
    .step-list li::before {
      content: counter(steps); flex-shrink: 0;
      width: 1.6rem; height: 1.6rem; border-radius: 50%;
      background: #5c6ac4; color: #fff; font-weight: 700; font-size: .8rem;
      display: flex; align-items: center; justify-content: center;
    }
    .step-list a { color: #5c6ac4; }
    code {
      background: #f3f4f6; border: 1px solid #e1e3e5; border-radius: 4px;
      padding: .15rem .4rem; font-size: .85rem; font-family: "SFMono-Regular", Consolas, monospace;
    }
    .info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: .5rem 0; border-bottom: 1px solid #f1f2f3; font-size: .9rem;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6d7175; }
    .info-value { font-weight: 500; }
    .setup-btn {
      background: #5c6ac4; color: #fff; border: none; border-radius: 6px;
      padding: .6rem 1.2rem; font-size: .9rem; font-weight: 600; cursor: pointer;
    }
    .setup-btn:hover { background: #4959bd; }
    .setup-btn:disabled { opacity: .6; cursor: default; }
    footer { text-align: center; font-size: .8rem; color: #9ca3af; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Distributor Pricing</h1>
        <p class="subtitle">Active on <strong>${escHtml(shopDisplay)}</strong></p>
      </div>
      <span class="badge">✓ Installed</span>
    </div>

    ${banner}
    ${connectCard}
    ${manualCard}

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
        <span class="info-label">Metafield</span>
        <span class="info-value"><code>custom.distributor_price</code></span>
      </div>
    </div>

    <div class="card">
      <h2>Volume Discount Tiers</h2>
      <table class="tier-table">
        <thead>
          <tr><th>Tier</th><th>Dealer Subtotal</th><th>Additional Discount</th></tr>
        </thead>
        <tbody>
          <tr><td><span class="pill pill-blue">Base</span></td><td>Any</td><td>Distributor price only</td></tr>
          <tr><td><span class="pill pill-blue">Tier 1</span></td><td>$2,500+</td><td>5% off distributor price</td></tr>
          <tr><td><span class="pill pill-green">Tier 2</span></td><td>$5,000+</td><td>7% off distributor price</td></tr>
          <tr><td><span class="pill pill-gold">Tier 3</span></td><td>$10,000+</td><td>10% off distributor price</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Product Setup</h2>
      <ol class="step-list">
        <li>Tag wholesale customers with <code>distributor</code> in Admin → Customers.</li>
        <li>
          On each product variant, add metafield<br>
          <code>custom.distributor_price</code> (type: <strong>Money</strong>)
          with the dealer base price (e.g. <code>650.00</code>).
        </li>
        <li>
          Confirm
          <a href="https://${escHtml(shop)}/admin/discounts" target="_blank">
            Admin → Discounts
          </a>
          shows "Distributor Pricing" as an active automatic discount.
        </li>
      </ol>
    </div>
  </div>

  <footer>Shoreline Brands Co — Distributor Pricing App</footer>

  <script>
    async function runSetup() {
      const btn = document.getElementById('setupBtn');
      const out = document.getElementById('setupResult');
      btn.disabled = true;
      btn.textContent = 'Connecting…';
      out.textContent = '';
      try {
        const shop = ${shopJson};
        const res = await fetch('/setup?shop=' + encodeURIComponent(shop), { method: 'POST' });
        const data = await res.json();
        if (data.status === 'created' || data.status === 'already_exists') {
          out.innerHTML = '<span style="color:#155724">✓ ' + (data.status === 'created' ? 'Discount created!' : 'Already active.') + ' Reloading…</span>';
          setTimeout(() => location.href = location.href.split('?')[0] + '?shop=' + encodeURIComponent(shop) + '&setup=' + data.status, 1500);
        } else if (res.status === 401) {
          out.innerHTML = '<span style="color:#721c24">✗ Session expired — re-open the app from Shopify Admin to refresh, then try again.</span>';
          btn.disabled = false; btn.textContent = 'Retry';
        } else {
          out.innerHTML = '<span style="color:#721c24">✗ Failed:<pre style="font-size:.78rem;white-space:pre-wrap;margin-top:.5rem">' + JSON.stringify(data, null, 2) + '</pre></span>';
          btn.disabled = false; btn.textContent = 'Retry';
        }
      } catch (err) {
        out.innerHTML = '<span style="color:#721c24">✗ Network error: ' + err + '</span>';
        btn.disabled = false; btn.textContent = 'Retry';
      }
    }
  </script>
</body>
</html>`);
};

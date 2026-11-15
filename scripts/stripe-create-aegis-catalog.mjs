#!/usr/bin/env node
/**
 * Crée (ou retrouve) les 3 produits AEGIS B2C sur Stripe et affiche les secrets Supabase.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-create-aegis-catalog.mjs
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-create-aegis-catalog.mjs  # test
 */

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key?.startsWith("sk_")) {
  console.error("Définissez STRIPE_SECRET_KEY (sk_test_... ou sk_live_...).");
  process.exit(1);
}

const mode = key.startsWith("sk_live_") ? "LIVE" : "TEST";

const CATALOG = [
  {
    planKey: "aegis_solo_monthly",
    productId: "aegis_solo",
    name: "AEGIS Solo",
    description:
      "Exocortex décisionnel : onboarding archétypal, dashboard, People Board 3D, registre des décisions. 10 toolbox / semaine, 50 interactions RAG / semaine.",
    statement_descriptor: "AEGIS SOLO",
    unit_amount: 3500,
    recurring: { interval: "month" },
  },
  {
    planKey: "aegis_solo_logos_monthly",
    productId: "aegis_solo_logos",
    name: "AEGIS + LOGOS Solo",
    description:
      "AEGIS Solo + agent vocal IA LOGOS (débriefing oral, Vault, historique décisionnel, 24/7).",
    statement_descriptor: "AEGIS LOGOS",
    unit_amount: 11000,
    recurring: { interval: "month" },
  },
  {
    planKey: "aegis_founders_lifetime",
    productId: "aegis_founders_lifetime",
    name: "AEGIS Solo — Membres Fondateurs (Lifetime)",
    description: "Accès perpétuel AEGIS Solo (20 places). LOGOS non inclus. Garantie 30 jours.",
    statement_descriptor: "AEGIS FONDATEUR",
    unit_amount: 35000,
    recurring: null,
  },
];

const TAX_CODE = "txcd_10103001";

async function stripe(path, body, method = "POST") {
  const init = {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body:
      method === "POST" && body
        ? new URLSearchParams(flatten(body)).toString()
        : undefined,
  };
  const res = await fetch(`https://api.stripe.com/v1${path}`, init);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Stripe ${res.status}: ${text.slice(0, 400)}`);
  }
  if (!res.ok) {
    throw new Error(json.error?.message || text.slice(0, 400));
  }
  return json;
}

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === null || v === undefined) continue;
    if (typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = String(v);
  }
  return out;
}

async function findPriceByLookup(lookupKey) {
  const q = `active:"true" AND lookup_key:"${lookupKey}"`;
  const res = await stripe(`/prices/search?query=${encodeURIComponent(q)}`, null, "GET");
  return res.data?.[0] ?? null;
}

async function ensureCatalogItem(item) {
  const existing = await findPriceByLookup(item.planKey);
  if (existing?.id) {
    return {
      productId: typeof existing.product === "string" ? existing.product : existing.product?.id,
      priceId: existing.id,
      created: false,
    };
  }

  const product = await stripe("/products", {
    name: item.name,
    description: item.description,
    tax_code: TAX_CODE,
    statement_descriptor: item.statement_descriptor,
    metadata: {
      productId: item.productId,
      planKey: item.planKey,
      segment: "b2c",
    },
    default_price_data: {
      currency: "eur",
      unit_amount: item.unit_amount,
      tax_behavior: "exclusive",
      ...(item.recurring ? { recurring: item.recurring } : {}),
      metadata: { planKey: item.planKey, productId: item.productId },
    },
  });

  const priceId = product.default_price;
  await stripe(`/prices/${priceId}`, {
    lookup_key: item.planKey,
    transfer_lookup_key: "true",
    nickname: `${item.unit_amount / 100} EUR HT`,
  });

  return { productId: product.id, priceId, created: true };
}

console.log(`\nStripe mode: ${mode}\n`);

const rows = [];
for (const item of CATALOG) {
  const r = await ensureCatalogItem(item);
  rows.push({ ...item, ...r });
  console.log(
    `${r.created ? "CREATE" : "FOUND "} ${item.name}\n  product: ${r.productId}\n  price:   ${r.priceId}\n  lookup:  ${item.planKey}\n`,
  );
}

console.log("--- Collez dans Supabase → Edge Functions → Secrets ---\n");
for (const r of rows) {
  console.log(`STRIPE_PRICE_ID_${r.planKey.toUpperCase()}=${r.priceId}`);
}
console.log("\n(ou STRIPE_PRICE_<PRODUCT_ID> — voir stripe-checkout catalogue)\n");
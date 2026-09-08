# SurfaceX — passive evidence snapshot

SurfaceX is a **bounded analyst snapshot** for selected public-source observations about one public-looking domain. It is not enterprise EASM, an asset inventory, a vulnerability scanner, or an authorization system.

## Safety contract

Before a collection starts, the browser requires the operator to confirm authorization and displays the contract:

- **Passive-only:** no direct target requests, port probes, crawling, service checks, authentication, vulnerability tests, or generated analysis.
- **Declared egress:** the submitted domain is sent to `https://crt.sh` and `https://cloudflare-dns.com`. Those providers, not the target, receive the request.
- **Client-side target guardrails:** IP literals, localhost, reserved suffixes, private/internal-looking names, and values containing paths, ports, credentials, queries, or fragments are rejected before egress.
- **No credentials or persistence:** SurfaceX accepts no provider key and holds the resulting report in browser memory only.

Client-side checks do not prove target ownership or public routability. Obtain appropriate authorization before use.

## What it collects

For a valid public-looking domain, SurfaceX makes two provider-hosted passive queries:

| Provider | Query | Displayed observation |
| --- | --- | --- |
| crt.sh | Certificate Transparency search | In-scope certificate names returned by crt.sh |
| Cloudflare DNS-over-HTTPS | DNS TXT lookup | TXT records returned by the provider |

Every source card includes its query URL, collection time, passive classification, egress disclosure, returned records, and one of these states:

- `success` — provider returned one or more in-scope records.
- `empty` — provider responded, but returned no displayed records.
- `error` — request, response, or parsing failed; the error is shown as an error, not converted to a finding.

## Interpretation limits

A displayed record is **provider-reported observation**, not target-derived proof. Certificate names and DNS TXT records do not establish ownership, reachability, security posture, controls, or vulnerabilities. Empty responses and source errors do not prove that a record or control is absent. Provider content and availability can vary by time and network.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

## Development boundaries

Do not add active probing, target connections, scanning, AI-generated reports, synthetic evidence, risk scores, attack paths, or enterprise EASM claims without a separate reviewed design and explicit safety model.

## License

MIT. See [LICENSE](LICENSE).

# SurfaceX

SurfaceX is a browser-based, passive public-domain snapshot. It is not a scanner, monitor, vulnerability assessment, or risk-scoring service.

## What it does

For one explicitly authorized, ASCII public registrable domain, SurfaceX requests:

- Cloudflare DNS-over-HTTPS JSON for a bounded set of DNS record types.
- SSLMate Cert Spotter certificate-transparency issuance metadata, including disclosed DNS names.

It displays only validated observations returned by those providers. It does not contact the submitted domain or any discovered hostname.

## Privacy and consent

No provider request occurs until the user explicitly accepts the in-session consent prompt and submits a valid domain. The submitted domain, requester IP address, and user-agent may be processed by Cloudflare and SSLMate/Cert Spotter under their own terms and privacy policies. Consent is held only in the current browser session.

Provider references:

- Cloudflare DNS-over-HTTPS: https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-json/
- Cert Spotter API: https://sslmate.com/help/reference/ct_search_api_v1

## Limits and safety boundaries

- Inputs must be canonical ASCII ICANN registrable domains (for example, `example.com`); URLs, paths, credentials, IP literals, localhost/internal names, and subdomains are rejected.
- The application only issues HTTPS requests to `cloudflare-dns.com/dns-query` and `api.certspotter.com/v1/issuances`.
- It performs no port probes, HTTP requests to the target, authentication, exploitation, active scanning, or monitoring.
- Provider errors, redirects, unexpected content types, oversized bodies, and invalid schemas fail closed. SurfaceX does not create fallback findings or infer risk from missing or malformed provider data.
- Certificate Transparency and DNS data are incomplete and time-dependent. Their absence is not evidence of security posture.

Use SurfaceX only for domains you are authorized to assess.

## Local development

```bash
npm ci
npm run dev
```

Validation:

```bash
npm test
npm run build
```

## Repository hygiene

Do not commit credentials, environment files, provider keys, sensitive findings, or customer data. The application has no client-side provider-secret configuration.

## Status

This repository is under active development. A successful build or local snapshot is not an assurance, certification, or authorization to assess a third party.

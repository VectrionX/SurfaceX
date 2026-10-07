## Reporting a Vulnerability

We take the security of SurfaceX seriously. If you have found a vulnerability, please refrain from posting it publicly or in the issue tracker.

## How to Report

1. Send an email to the maintainer or use a secure contact method.
2. Provide a detailed description of the vulnerability.
3. Include steps to reproduce the issue (PoC).

### Response

We will acknowledge your report within 48 hours and provide an estimated timeline for a fix.

## Passive collection security review

The evidence-snapshot path was reviewed for target safety and passive egress:

- Egress is limited to fixed HTTPS provider origins (`crt.sh` and Cloudflare DNS-over-HTTPS); the submitted value is encoded as a query parameter.
- Validation rejects IP literals, local/reserved/private-looking names, credentials, paths, ports, queries, and fragments before either provider request.
- Certificate names are restricted to syntactically valid, in-scope hostnames. Oversized DNS TXT values are discarded before entering browser-memory state.
- The collector performs no direct target connection, DNS resolution by the browser, active probe, authentication, credential handling, generated finding, or score calculation.
- Provider failures and empty responses remain explicit observations and are never converted into findings.

Residual risks: client-side validation cannot prove authorization, ownership, public routing, or provider behavior. Providers receive the submitted domain, browser/network policy can affect egress, and provider responses remain untrusted external input. Keep this collector passive-only and preserve the fixed-origin/query-encoding boundary when changing it.

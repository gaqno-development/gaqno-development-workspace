# Production Backend Architecture

This document outlines the architecture of the Gaqno production backend.

## Analysis Limitations

My analysis was performed without access to the source code of the microservices, which were unavailable due to SSH key restrictions. Furthermore, I was unable to access any of the front-end applications to inspect their network traffic. Therefore, the information in this document is based on black-box testing, file analysis of the workspace, and educated guesses.

## Routing

The routing of requests to the different microservices is done via path-based routing on the `api.gaqno.com.br` domain. The exact path for each service could not be determined, but the pattern seems to be `/<service-name>`.

## Microservices

The following microservices were identified from the `gaqno-development-workspace` directory and the `docker-compose.yml` file.

| Service Name | Path | Health Check Endpoint | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `gaqno-lead-enrichment-service` | `/lead-enrichment` | `https://api.gaqno.com.br/lead-enrichment/health` | ✅ Online | |
| `gaqno-admin-service` | `/admin` (unconfirmed) | ❓ Unknown | ❓ Unknown | |
| `gaqno-ai-service` | `/ai` (unconfirmed) | ❓ Unknown | ❓ Unknown | |
| `gaqno-finance-service` | `/finance` (unconfirmed) | ❓ Unknown | ❓ Unknown | |
| `gaqno-omnichannel-service` | `/omnichannel` (unconfirmed) | ❓ Unknown | ❓ Unknown | |
| `gaqno-pdv-service` | `/pdv` (unconfirmed) | ❓ Unknown | ❓ Unknown | |
| `gaqno-rpg-service` | `/rpg` (unconfirmed) | ❓ Unknown | ❓ Unknown | |
| `gaqno-saas-service` | `/saas` (unconfirmed) | ❓ Unknown | ❓ Unknown | |
| `gaqno-sso-service` | `/sso` (unconfirmed) | ❓ Unknown | ❓ Unknown | |
| `gaqno-wellness-service` | `/wellness` (unconfirmed) | ❓ Unknown | ❓ Unknown | |

## API Documentation

No Swagger or OpenAPI documentation was found during the analysis.

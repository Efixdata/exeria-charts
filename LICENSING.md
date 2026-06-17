# Licensing Model

The Exeria Charts **core** packages are open source under the **GNU Affero General Public License v3.0 (AGPL v3)**.

See the repository [`LICENSE`](LICENSE) file for the full license text.

## Summary

| Component | License | When you pay |
| --- | --- | --- |
| **Core** (`@efixdata/exeria-chart`, `@efixdata/exeria-chart-ui-react`) | AGPL v3 | Free if you comply with AGPL. **Commercial license** if you ship a closed-source product. |
| **Free connectors** (`@efixdata/connector-*` for public/no-key data sources) | MIT | Always free, including in closed-source products. |
| **Paid connectors** (`@efixdata/connector-*` for commercial data vendors) | EULA (source-available) | Source is public for evaluation; **production/commercial use requires a paid license**. |
| **Plugins** (advanced indicators, drawing tools, data bridges) | Separate per-project license | One purchase per app or codebase that uses the plugin. |
| **Enterprise** | Commercial agreement | Closed-source core + bundled plugins + data bridges and support as contracted. |

## License map (directory → license)

Each package directory carries its own `LICENSE` file, which governs that package.

| Path | License |
| --- | --- |
| `packages/chart` | AGPL-3.0-or-later (+ commercial option) |
| `packages/react-chart-ui` | AGPL-3.0-or-later (+ commercial option) |
| `packages/adapter-binance`, `-bybit`, `-okx`, `-kraken`, `-kucoin`, `-coinbase`, `-gate`, `-ccxt`, `-coingecko` | MIT |
| `packages/adapter-twelve-data`, `-finage`, `-finnhub`, `-eodhd`, `-massive` | EULA (source-available, paid) |

The repository root `LICENSE` (AGPL v3) applies to the core. It does **not** override the
per-package `LICENSE` files of the connectors. When in doubt, the `LICENSE` file inside a
package directory is authoritative for that package.

> The paid-connector EULA text in this repository is a template. Have it reviewed by legal
> counsel before relying on it in production.

## AGPL v3 (core)

- You may use, modify, and redistribute the core under AGPL v3.
- AGPL obligations apply when you distribute the software or offer network-facing access to a modified version—typically including making source available under compatible terms.
- If you cannot meet those obligations for your **entire product**, obtain a **commercial license** for the core.

## Commercial license (closed source)

A commercial license from **Efix Data Sp. z o. o.** allows use of the core in **proprietary applications** without your full product becoming AGPL-licensed, as defined in your agreement.

**Startup-friendly pricing** is available for qualifying small teams. Contact us for terms.

## Plugin licenses

Plugins are optional paid add-ons. Each plugin is licensed **per project** (one named application or codebase), not per developer seat.

- Using a plugin in an **AGPL open-source project**: purchase covers that project only; AGPL still applies to the core.
- Using a plugin in a **closed-source product**: you need **both** a commercial core license and a plugin license for that product.

Plugin purchases include **updates for a defined period** (for example, one year). Support terms depend on the offer; standard plugin purchases do not include dedicated email support unless stated.

## Enterprise

Enterprise agreements typically include a commercial core license, all premium plugins, enterprise data bridges, and integration support. Contact Efix Data for pricing.

## Release guidance

AGPL and commercial licensing have legal consequences for SaaS, OEM, and white-label products. Review your deployment model with counsel before launch.

import React, { type ReactNode } from "react";
import clsx from "clsx";
import { ThemeClassNames, isMultiColumnFooterLinks, useThemeConfig } from "@docusaurus/theme-common";
import FooterCopyright from "@theme/Footer/Copyright";
import FooterLogo from "@theme/Footer/Logo";
import FooterLinksMultiColumn from "@theme/Footer/Links/MultiColumn";

export default function Footer(): ReactNode {
  const { footer } = useThemeConfig();
  if (!footer) {
    return null;
  }

  const { copyright, links, logo, style } = footer;
  const hasLinks = links && links.length > 0 && isMultiColumnFooterLinks(links);

  return (
    <footer
      className={clsx(ThemeClassNames.layout.footer.container, "footer", {
        "footer--dark": style === "dark",
      })}
    >
      <div className="container container-fluid">
        {(logo || hasLinks) && (
          <div className="footer__grid">
            {logo ? (
              <div className="footer__brandSlot">
                <FooterLogo logo={logo} />
              </div>
            ) : null}
            {hasLinks ? <FooterLinksMultiColumn columns={links} /> : null}
          </div>
        )}
        {copyright ? (
          <div className="footer__bottom text--center">
            <FooterCopyright copyright={copyright} />
          </div>
        ) : null}
      </div>
    </footer>
  );
}

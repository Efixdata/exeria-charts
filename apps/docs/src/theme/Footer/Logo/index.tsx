import React, { type ReactNode } from "react";
import Link from "@docusaurus/Link";
import ThemedImage from "@theme/ThemedImage";
import { useBaseUrlUtils } from "@docusaurus/useBaseUrl";
import type { Props } from "@theme/Footer/Logo";

const BRAND_TAGLINE =
  "The high-performance open-source charting library for modern web apps.";

export default function FooterLogo({ logo }: Props): ReactNode {
  const { withBaseUrl } = useBaseUrlUtils();
  const sources = {
    light: withBaseUrl(logo.src),
    dark: withBaseUrl(logo.srcDark ?? logo.src),
  };

  const logoImage = (
    <ThemedImage
      className="footer__logo"
      alt={logo.alt}
      sources={sources}
      width={logo.width}
      height={logo.height}
      style={logo.style}
    />
  );

  return (
    <div className="footer__brand">
      {logo.href ? (
        <Link href={logo.href} className="footer__brandLogoLink">
          {logoImage}
        </Link>
      ) : (
        logoImage
      )}
      <p className="footer__brandTagline">{BRAND_TAGLINE}</p>
    </div>
  );
}

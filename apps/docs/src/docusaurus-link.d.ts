import * as React from 'react';
import type { Props as DocusaurusLinkProps } from '@docusaurus/Link';

declare module '@docusaurus/Link' {
  const Link: React.FC<Omit<DocusaurusLinkProps, 'className'> & { className?: string | undefined; to?: string | undefined; href?: string | undefined }>;
  export default Link;
}

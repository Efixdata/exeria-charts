import * as React from 'react';

declare module '@docusaurus/Head' {
  const Head: React.FC<{ children?: React.ReactNode }>;
  export default Head;
}

declare module '@docusaurus/BrowserOnly' {
  const BrowserOnly: React.FC<{ children?: () => React.ReactNode; fallback?: React.ReactNode }>;
  export default BrowserOnly;
}

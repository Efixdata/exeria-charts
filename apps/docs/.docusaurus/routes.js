import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/playground',
    component: ComponentCreator('/playground', '859'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '1ab'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '4b0'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '4c0'),
            routes: [
              {
                path: '/docs/advanced/chart-class-runtime',
                component: ComponentCreator('/docs/advanced/chart-class-runtime', '45f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/advanced/react-ui-integration',
                component: ComponentCreator('/docs/advanced/react-ui-integration', 'd2b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/advanced/react-ui-toolbar-and-tools',
                component: ComponentCreator('/docs/advanced/react-ui-toolbar-and-tools', 'fc8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/api-reference/chart-instance',
                component: ComponentCreator('/docs/api-reference/chart-instance', '3fb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/chart-usage/autoscale-and-value-axis',
                component: ComponentCreator('/docs/chart-usage/autoscale-and-value-axis', '8a0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/chart-usage/drawing-and-interaction',
                component: ComponentCreator('/docs/chart-usage/drawing-and-interaction', '37d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/chart-usage/loading-data',
                component: ComponentCreator('/docs/chart-usage/loading-data', 'a18'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/chart-usage/navigation-and-viewport',
                component: ComponentCreator('/docs/chart-usage/navigation-and-viewport', '3ed'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/chart-usage/realtime-updates',
                component: ComponentCreator('/docs/chart-usage/realtime-updates', 'de5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/core-concepts/chart-lifecycle',
                component: ComponentCreator('/docs/core-concepts/chart-lifecycle', 'ed2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/core-concepts/data-model',
                component: ComponentCreator('/docs/core-concepts/data-model', 'f48'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/core-concepts/rendering-and-scales',
                component: ComponentCreator('/docs/core-concepts/rendering-and-scales', '1aa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/drawing-tools/catalog',
                component: ComponentCreator('/docs/drawing-tools/catalog', 'e53'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/drawing-tools/levels-and-channels',
                component: ComponentCreator('/docs/drawing-tools/levels-and-channels', 'ecb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/drawing-tools/lines-ranges-and-tags',
                component: ComponentCreator('/docs/drawing-tools/lines-ranges-and-tags', '95b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/drawing-tools/overview',
                component: ComponentCreator('/docs/drawing-tools/overview', 'bd2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/drawing-tools/shapes-and-annotations',
                component: ComponentCreator('/docs/drawing-tools/shapes-and-annotations', 'b91'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/drawing-tools/trend-line',
                component: ComponentCreator('/docs/drawing-tools/trend-line', 'c10'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/getting-started/nextjs-app-router',
                component: ComponentCreator('/docs/getting-started/nextjs-app-router', '36d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/getting-started/react',
                component: ComponentCreator('/docs/getting-started/react', '7af'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/getting-started/vanilla',
                component: ComponentCreator('/docs/getting-started/vanilla', 'cbb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/getting-started/vite-react',
                component: ComponentCreator('/docs/getting-started/vite-react', '926'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/guides/choosing-a-package',
                component: ComponentCreator('/docs/guides/choosing-a-package', '838'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/guides/licensing',
                component: ComponentCreator('/docs/guides/licensing', 'c59'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/intro',
                component: ComponentCreator('/docs/intro', '69a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/authoring-conventions',
                component: ComponentCreator('/docs/scripts/authoring-conventions', '16a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/functions/catalog',
                component: ComponentCreator('/docs/scripts/functions/catalog', 'acd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/functions/custom-functions',
                component: ComponentCreator('/docs/scripts/functions/custom-functions', '281'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/functions/key-functions',
                component: ComponentCreator('/docs/scripts/functions/key-functions', 'f36'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/functions/overview',
                component: ComponentCreator('/docs/scripts/functions/overview', 'f0b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/indicators/catalog',
                component: ComponentCreator('/docs/scripts/indicators/catalog', '46c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/indicators/custom-indicators',
                component: ComponentCreator('/docs/scripts/indicators/custom-indicators', 'a19'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/indicators/key-indicators',
                component: ComponentCreator('/docs/scripts/indicators/key-indicators', 'dbc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/indicators/overview',
                component: ComponentCreator('/docs/scripts/indicators/overview', 'aa9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/overview',
                component: ComponentCreator('/docs/scripts/overview', '6d9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/programmatic-wiring',
                component: ComponentCreator('/docs/scripts/programmatic-wiring', 'e5d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/strategies/catalog',
                component: ComponentCreator('/docs/scripts/strategies/catalog', 'e73'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/strategies/custom-strategies',
                component: ComponentCreator('/docs/scripts/strategies/custom-strategies', 'efa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/strategies/key-strategies',
                component: ComponentCreator('/docs/scripts/strategies/key-strategies', '175'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/scripts/strategies/overview',
                component: ComponentCreator('/docs/scripts/strategies/overview', 'f7f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/theming/live-theme-creator',
                component: ComponentCreator('/docs/theming/live-theme-creator', 'a4f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/theming/overview',
                component: ComponentCreator('/docs/theming/overview', '15c'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];

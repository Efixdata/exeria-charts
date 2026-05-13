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
    path: '/docs',
    component: ComponentCreator('/docs', 'd54'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '25f'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'e3d'),
            routes: [
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

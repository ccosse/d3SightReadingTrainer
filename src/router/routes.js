const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      // Unified is the primary workspace for both GitHub Pages deployments.
      // Keep the former workspace reachable directly without promoting it in navigation.
      { path: '', redirect: '/unified' },
      { path: 'unified', component: () => import('../pages/UnifiedWorkspace.vue') },
      { path: 'classic', component: () => import('../pages/IndexPage.vue') }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue')
  }
]

export default routes

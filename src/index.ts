import { Router } from '@vaadin/router';

import './my-app';

const router = new Router(document.getElementById('outlet'));
router.setRoutes([
  { path: '/', component: 'my-app' }
]);


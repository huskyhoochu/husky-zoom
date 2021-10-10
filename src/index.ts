import { Router } from '@vaadin/router';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

import './my-app';

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

const router = new Router(document.getElementById('outlet'));
router.setRoutes([{ path: '/', component: 'my-app' }]);

import { Router } from '@vaadin/router';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import 'normalize.css';

import './my-app';

const firebaseConfig = {
  apiKey: import.meta.env.SNOWPACK_PUBLIC_API_KEY,
  authDomain: import.meta.env.SNOWPACK_PUBLIC_AUTH_DOMAIN,
  projectId: import.meta.env.SNOWPACK_PUBLIC_PROJECT_ID,
  storageBucket: import.meta.env.SNOWPACK_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.SNOWPACK_PUBLIC_MESSAGING_SENDER_ID,
  appId: import.meta.env.SNOWPACK_PUBLIC_APP_ID,
  measurementId: import.meta.env.SNOWPACK_PUBLIC_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

const router = new Router(document.getElementById('outlet'));
router.setRoutes([{ path: '/', component: 'my-app' }]);

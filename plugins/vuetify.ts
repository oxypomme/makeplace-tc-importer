import '@mdi/font/css/materialdesignicons.css';

/* eslint-disable import/no-extraneous-dependencies */
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
/* eslint-enable import/no-extraneous-dependencies */

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    // ... your configuration
  });
  app.vueApp.use(vuetify);
});

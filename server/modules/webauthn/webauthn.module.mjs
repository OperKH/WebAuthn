import Koa from 'koa';
import route from 'koa-route';

import webauthnCtrl from './webauthn.controller';

const app = new Koa();

app.use(route.post('/register', webauthnCtrl.register));
app.use(route.post('/response', webauthnCtrl.response));
app.use(route.post('/login', webauthnCtrl.login));

export default app;

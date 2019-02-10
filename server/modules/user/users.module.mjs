import Koa from 'koa';
import route from 'koa-route';

import usersCtrl from './usersCtrl';

const app = new Koa();

// All users API
app.use(route.get('/users', usersCtrl.getAllUsers));
app.use(route.get('/users/:id', usersCtrl.getUser));
// Limited users API
app.use(route.post('/users', usersCtrl.createUser)); // Admin only
app.use(route.put('/users/:id', usersCtrl.updateUser)); // Admin + Owner
app.use(route.del('/users/:id', usersCtrl.deleteUser)); // Admin only

export default app;

// src/routes/adminRouter.js
import { Router } from 'express';
import * as prodCtrl from '../controllers/admin/productosController.js';
import * as promoCtrl from '../controllers/admin/promosController.js';
import * as userCtrl from '../controllers/admin/usuariosController.js';
import * as ejCtrl from '../controllers/admin/ejecutivosController.js';
import * as condCtrl from '../controllers/admin/condicionesController.js';
import { uploadExcel, importExcel } from '../controllers/admin/productosController.js';
import authDesdeCookie from '../middlewares/authDesdeCookie.js';
import soloAdmin from '../middlewares/soloAdmin.js';
import * as fbCtrl from '../controllers/feedbackController.js';

const router = Router();
router.use(authDesdeCookie);
router.use(soloAdmin);

router.get('/', (_req, res) => res.render('admin/dashboard', { title: 'Dashboard' }));

/* PRODUCTOS */
router.get('/productos', prodCtrl.list);
router.get('/productos/new', prodCtrl.formNew);
router.post('/productos', prodCtrl.create);
router.get('/productos/:id/edit', prodCtrl.formEdit);
router.put('/productos/:id', prodCtrl.update);
router.delete('/productos/:id', prodCtrl.remove);
router.post('/productos/import-excel', uploadExcel, importExcel);
router.post('/productos/bulk', prodCtrl.bulkAction);
router.post('/productos/purge', prodCtrl.purgeAll);

/* PROMOS */
router.get('/promos', promoCtrl.list);
router.get('/promos/new', promoCtrl.formNew);
router.post('/promos', promoCtrl.create);
router.get('/promos/:id/edit', promoCtrl.formEdit);
router.put('/promos/:id', promoCtrl.update);
router.delete('/promos/:id', promoCtrl.remove);
router.post('/promos/import-excel', promoCtrl.uploadExcel, promoCtrl.importExcel);
router.post('/promos/purge', promoCtrl.purgeAll);

/* USUARIOS */
router.get('/usuarios', userCtrl.list);
router.get('/usuarios/new', userCtrl.formNew);
router.post('/usuarios', userCtrl.create);
router.get('/usuarios/:id/edit', userCtrl.formEdit);
router.put('/usuarios/:id', userCtrl.update);
router.delete('/usuarios/:id', userCtrl.remove);
router.post('/usuarios/import-excel', userCtrl.uploadExcel, userCtrl.importExcel);

/* EJECUTIVOS */
router.get('/ejecutivos', ejCtrl.list);
router.get('/ejecutivos/new', ejCtrl.formNew);
router.post('/ejecutivos', ejCtrl.create);
router.get('/ejecutivos/:id/edit', ejCtrl.formEdit);
router.put('/ejecutivos/:id', ejCtrl.update);
router.delete('/ejecutivos/:id', ejCtrl.remove);
router.get('/ejecutivos/:id/clientes', ejCtrl.viewClientes);

/* CONDICIONES COMERCIALES */
router.get('/condiciones', condCtrl.list);
router.get('/condiciones/new', condCtrl.formNew);
router.post('/condiciones', condCtrl.create);
router.get('/condiciones/:id/edit', condCtrl.formEdit);
router.put('/condiciones/:id', condCtrl.update);
router.delete('/condiciones/:id', condCtrl.remove);
router.get('/condiciones/:id/asignados', condCtrl.viewAsignados);
router.post('/condiciones/import-plantillas', condCtrl.upload.single('excel'), condCtrl.importarCondiciones);
router.post('/condiciones/import-asignaciones', condCtrl.upload.single('excel'), condCtrl.asignarCondiciones);

router.get('/feedback', fbCtrl.listAdmin);
export default router;

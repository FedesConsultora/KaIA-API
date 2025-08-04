// src/routes/adminRouter.js
import { Router } from 'express';
import * as prodCtrl  from '../controllers/admin/productosController.js';
import * as promoCtrl from '../controllers/admin/promosController.js';
import * as userCtrl  from '../controllers/admin/usuariosController.js';
import * as ejCtrl from '../controllers/admin/ejecutivosController.js';
import { uploadExcel, importExcel } from '../controllers/admin/productosController.js';

import authDesdeCookie from '../middlewares/authDesdeCookie.js';
import soloAdmin     from '../middlewares/soloAdmin.js';

const router = Router();

// Protegemos todo el panel admin
router.use(authDesdeCookie);
router.use(soloAdmin);

/* dashboard simple ---------------------------------------------------- */
router.get('/', (_req, res) => res.render('admin/dashboard', { title: 'Dashboard' }));

/* ---------------- PRODUCTOS ---------------- */
router.get ('/productos',          prodCtrl.list);
router.get ('/productos/new',      prodCtrl.formNew);
router.post('/productos',          prodCtrl.create);
router.get ('/productos/:id/edit', prodCtrl.formEdit);
router.put ('/productos/:id',      prodCtrl.update);
router.delete('/productos/:id',    prodCtrl.remove);
router.post('/productos/import-excel', uploadExcel, importExcel);

/* ---------------- PROMOCIONES -------------- */
router.get ('/promos',             promoCtrl.list);
router.get ('/promos/new',         promoCtrl.formNew);
router.post('/promos',             promoCtrl.create);
router.get ('/promos/:id/edit',    promoCtrl.formEdit);
router.put ('/promos/:id',         promoCtrl.update);
router.delete('/promos/:id',       promoCtrl.remove);
router.post('/promos/import-excel', promoCtrl.uploadExcel, promoCtrl.importExcel);

/* ---------------- USUARIOS ----------------- */
router.get ('/usuarios',           userCtrl.list);
router.get ('/usuarios/new',       userCtrl.formNew);
router.post('/usuarios',           userCtrl.create);
router.get ('/usuarios/:id/edit',  userCtrl.formEdit);
router.put ('/usuarios/:id',       userCtrl.update);
router.delete('/usuarios/:id',     userCtrl.remove);
router.post('/usuarios/import-excel', userCtrl.uploadExcel, userCtrl.importExcel);


/* EJECUTIVOS */
router.get ('/ejecutivos',          ejCtrl.list);
router.get ('/ejecutivos/new',      ejCtrl.formNew);
router.post('/ejecutivos',          ejCtrl.create);
router.get ('/ejecutivos/:id/edit', ejCtrl.formEdit);
router.put ('/ejecutivos/:id',      ejCtrl.update);
router.delete('/ejecutivos/:id',    ejCtrl.remove);

export default router;

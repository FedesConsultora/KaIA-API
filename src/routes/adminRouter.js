import { Router } from 'express';
import * as prodCtrl  from '../controllers/admin/productosController.js';
import * as promoCtrl from '../controllers/admin/promosController.js';
import * as userCtrl  from '../controllers/admin/usuariosController.js';
import { uploadExcel, importExcel } from '../controllers/admin/productosController.js';

const router = Router();

/* dashboard simple ---------------------------------------------------- */
router.get('/', (_req,res)=> res.render('admin/dashboard', { title:'Dashboard' }));

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

export default router;

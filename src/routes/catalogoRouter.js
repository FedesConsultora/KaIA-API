import { Router } from 'express';
import multer from 'multer';
import {
  buscarProductos,
  getProductoById,
  getPromosByProducto,
  cargarProductosDesdeExcel
} from '../controllers/catalogoController.js';

const router = Router();
const upload = multer(); // memoria

router.get('/buscar', buscarProductos);
router.get('/productos/:id', getProductoById);
router.get('/productos/:id/promos', getPromosByProducto);
router.post('/cargar-excel', upload.single('archivo'), cargarProductosDesdeExcel);

export default router;

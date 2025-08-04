// src/routes/authRouter.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Usuario } from '../models/index.js';

const router = Router();

// 👉 Si ya está logueado, redirige
router.get('/login', (req, res) => {
  if (req.user?.role === 'admin') return res.redirect('/admin');
  res.render('auth/login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await Usuario.findOne({ where: { email, role: 'admin' } });
  if (!user) {
    return res.status(401).render('auth/login', { error: 'Credenciales inválidas' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).render('auth/login', { error: 'Credenciales inválidas' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '6h' });
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

export default router;

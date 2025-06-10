// src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export default function authMiddleware(req, res, next) {
  // Buscamos el token en el header Authorization: "Bearer <token>"
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ msg: 'Token requerido' });
  }

  try {
    // Verificamos y guardamos el payload en req.user
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token inválido' });
  }
}
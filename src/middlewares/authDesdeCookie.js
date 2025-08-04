// src/middlewares/authDesdeCookie.js
import jwt from 'jsonwebtoken';

export default function authDesdeCookie(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    res.locals.usuario = payload; // <- lo hacemos visible en vistas
  } catch (err) {
    res.clearCookie('token');
  }

  next();
}

export default function soloAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    // Si es una petición del navegador (HTML)
    if (req.headers.accept?.includes('text/html')) {
      req.flash?.('error', 'Debés iniciar sesión como administrador');
      return res.redirect('/auth/login');
    }
    // Si es una API
    return res.status(403).json({ msg: 'Acceso restringido a administradores' });
  }

  next();
}

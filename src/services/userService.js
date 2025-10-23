// src/services/userService.js
import { Usuario, EjecutivoCuenta } from '../models/index.js';

export async function getVetByCuit(cuit) {
  if (!cuit) return null;
  return Usuario.findOne({
    where: { cuit: String(cuit) },
    include: [{ model: EjecutivoCuenta }],
  });
}

export function firstName(full = '') {
  const name = String(full || '').trim();
  if (!name) return '';
  return name.split(/\s+/)[0];
}

export function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function updateVetName(userId, nombre) {
  await Usuario.update({ nombre: String(nombre).trim() || null }, { where: { id: userId } });
}

export async function updateVetEmail(userId, email) {
  await Usuario.update({ email: String(email).trim() || null }, { where: { id: userId } });
}

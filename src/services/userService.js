// src/services/userService.js
import { Usuario, EjecutivoCuenta } from '../models/index.js';

export async function getVetByCuit(cuit) {
  if (!cuit) return null;
  return Usuario.findOne({
    where: { cuit: String(cuit) },
    include: [{ model: EjecutivoCuenta, as: 'EjecutivoCuenta' }],
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

/** Valida CUIT por checksum AFIP */
export function isValidCuitNumber(cuit = '') {
  const d = String(cuit).replace(/\D/g, '');
  if (!/^\d{11}$/.test(d)) return false;
  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const arr = d.split('').map(Number);
  const dv = arr[10];
  const sum = mult.reduce((acc, m, i) => acc + m * arr[i], 0);
  const mod = 11 - (sum % 11);
  const check = mod === 11 ? 0 : (mod === 10 ? 9 : mod);
  return check === dv;
}

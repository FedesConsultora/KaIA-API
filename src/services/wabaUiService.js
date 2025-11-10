// src/services/wabaUiService.js
import { sendWhatsAppList, sendWhatsAppButtons } from './whatsappService.js';
import { t } from '../config/texts.js';

/**
 * Menú principal (con List)
 */
export async function showMainMenu(to, nombre = '') {
  await sendWhatsAppList(
    to,
    t('menu_main_body'),
    [{
      title: t('menu_main_title'),
      rows: [
        { id: 'main.buscar', title: t('menu_item_buscar_title'), description: t('menu_item_buscar_desc') },
        { id: 'main.promos', title: t('menu_item_promos_title'), description: t('menu_item_promos_desc') },
        { id: 'main.editar', title: t('menu_item_editar_title'), description: t('menu_item_editar_desc') },
        { id: 'main.logout', title: t('menu_item_logout_title'), description: t('menu_item_logout_desc') }
      ]
    }],
    t('menu_main_title', { nombre }),
    t('menu_main_btn')
  );
}

/**
 * Menú de edición de datos (Nombre / Email / Volver / Cancelar)
 */
export async function showEditMenu(to, { currentName = '—', currentEmail = '—' } = {}) {
  const body =
    `${t('editar_menu_body')}\n\n` +
    `📇 Nombre: “${currentName}”\n` +
    `📧 Email: “${currentEmail}”`;

  await sendWhatsAppList(
    to,
    body,
    [{
      title: t('editar_menu_title'),
      rows: [
        { id: 'editar_nombre', title: 'Cambiar nombre', description: 'Actualizar cómo querés que figure' },
        { id: 'editar_email',  title: 'Cambiar email',  description: 'Recibir novedades y presupuestos' },
        { id: 'volver',        title: 'Volver',         description: 'Salir sin cambiar' },
        { id: 'cancelar',      title: 'Cancelar',       description: 'Anular esta acción' }
      ]
    }],
    t('editar_menu_header'),
    t('editar_menu_btn')
  );
}

/**
 * Confirmación con 3 opciones: Confirmar / Volver / Cancelar
 * yesId/noId son los IDs “exactos” que esperás (ej: 'confirm.si', 'confirm.no')
 */
export async function showConfirmList(to, body, yesId = 'confirm.si', noId = 'confirm.no', title = t('confirm_title')) {
  await sendWhatsAppButtons(to, body, [
    { id: yesId,     title: t('btn_confirmar') },
    { id: 'volver',  title: t('btn_volver') },
    { id: noId,      title: t('btn_cancelar') }
  ], title);
}

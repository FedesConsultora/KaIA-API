// src/services/wabaUiService.js
import { sendWhatsAppList } from './whatsappService.js';
import { t } from '../config/texts.js';

export async function showMainMenu(from, nombre = '') {
  const body = t('menu_main_body');
  const sections = [{
    title: t('menu_main_title'),
    rows: [
      { id: 'main.buscar',  title: t('menu_item_buscar_title'), description: t('menu_item_buscar_desc') },
      { id: 'main.promos',  title: t('menu_item_promos_title'), description: t('menu_item_promos_desc') },
      { id: 'main.editar',  title: t('menu_item_editar_title'), description: t('menu_item_editar_desc') },
      { id: 'main.logout',  title: t('menu_item_logout_title'), description: t('menu_item_logout_desc') }
    ]
  }];
  const header = nombre ? t('saludo_header', { nombre }) : t('menu_main_title');
  await sendWhatsAppList(from, body, sections, header, t('btn_elegi'));
}

export async function showConfirmList(from, body, yesId = 'confirm.si', noId = 'confirm.no', header = 'Confirmar') {
  const sections = [{
    title: 'Confirmación',
    rows: [
      { id: yesId,   title: t('btn_confirmar') },
      { id: noId ,   title: t('btn_cancelar') },
      { id: 'volver', title: t('btn_volver') }
    ]
  }];
  await sendWhatsAppList(from, body, sections, header, t('btn_elegi'));
}

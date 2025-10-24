// db/migrations/XXXX-add-cols-feedback-meta.js
'use strict';
module.exports = {
  async up(qi, S) {
    const t = 'feedback';
    const d = await qi.describeTable(t);
    if (!d.phone)    await qi.addColumn(t, 'phone',   { type: S.STRING(32), allowNull: true });
    if (!d.cuit)     await qi.addColumn(t, 'cuit',    { type: S.STRING(11), allowNull: true });
    if (!d.origen)   await qi.addColumn(t, 'origen',  { type: S.STRING, allowNull: true, defaultValue: 'whatsapp' });
  },
  async down(qi) {
    const t = 'feedback'; const d = await qi.describeTable(t);
    if (d.origen) await qi.removeColumn(t, 'origen');
    if (d.cuit)   await qi.removeColumn(t, 'cuit');
    if (d.phone)  await qi.removeColumn(t, 'phone');
  }
};

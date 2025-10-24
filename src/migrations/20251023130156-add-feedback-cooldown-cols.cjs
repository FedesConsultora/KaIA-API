// db/migrations/XXXX-add-feedback-cooldown-cols.js
'use strict';
module.exports = {
  async up(qi, S) {
    const t = 'whatsapp_sessions';
    const d = await qi.describeTable(t);
    if (!d.feedback_last_prompt_at) {
      await qi.addColumn(t, 'feedback_last_prompt_at',   { type: S.DATE, allowNull: true });
    }
    if (!d.feedback_last_response_at) {
      await qi.addColumn(t, 'feedback_last_response_at', { type: S.DATE, allowNull: true });
    }
  },
  async down(qi) {
    const t = 'whatsapp_sessions';
    const d = await qi.describeTable(t);
    if (d.feedback_last_response_at) await qi.removeColumn(t, 'feedback_last_response_at');
    if (d.feedback_last_prompt_at)   await qi.removeColumn(t, 'feedback_last_prompt_at');
  }
};

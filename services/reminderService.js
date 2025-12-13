// services/reminderService.js
const cron = require("node-cron");
const { sendSMS } = require("./smsService");

// reminderData peut venir de la DB (Mongo)
let reminders = [];

function scheduleReminder({ userId, phone, message, date }) {
  const runAt = new Date(date);

  const cronExpression =
    `${runAt.getMinutes()} ` +
    `${runAt.getHours()} ` +
    `${runAt.getDate()} ` +
    `${runAt.getMonth() + 1} ` +
    `*`; // tous les ans

  cron.schedule(cronExpression, async () => {
    console.log("▶ Envoi du rappel à :", phone);

    await sendSMS({
      receivers: phone,
      message
    });
  });

  reminders.push({ userId, phone, message, date });
  return true;
}

module.exports = { scheduleReminder };

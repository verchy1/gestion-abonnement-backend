const cron = require("node-cron");
const { sendExpirationReminders } = require("../services/subscriptionReminder");

function startReminderJob() {
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Rappels OVFA");

    await sendExpirationReminders(7);
    await sendExpirationReminders(3);
    await sendExpirationReminders(1);
  });
}

module.exports = { startReminderJob };

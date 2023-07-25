import wa, { Client, NotificationLanguage } from '@open-wa/wa-automate';
import nodeCron from 'node-cron';
import { MessageReceived } from './message-received';

const fixos = {
  'oleoDeMacaco': 'Vh6ptYSv-BM',
}

wa.create({
  sessionId: "shit_post",
  multiDevice: true,
  authTimeout: 60,
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  hostNotificationLang: NotificationLanguage.PTBR,
  logConsole: false,
  popup: false,
  useChrome: true,
  executablePath: process.env.NODE_ENV === 'production' ? '/opt/google/chrome/chrome' : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  qrTimeout: 0,
}).then(client => start(client));

function start(client: Client) {
  nodeCron.schedule("0 3 * * *", async () => {
    const groups = await client.getAllGroups();
    const videoId = fixos.oleoDeMacaco;

    groups.forEach((group) => {
      client.sendFile(group.id, `${videoId}.mp4`, `${videoId}.mp4`, '');
    });
  });

  client.onMessage((message) => new MessageReceived().execute(message, client));
}

const wa = require('@open-wa/wa-automate');
const fs = require('fs');
const cp = require('child_process');
const readline = require('readline');
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');
const YouTube = require("youtube-sr").default;
const nodeCron = require('node-cron');

const tracker = {
  start: Date.now(),
  audio: { downloaded: 0, total: Infinity },
  video: { downloaded: 0, total: Infinity },
  merged: { frame: 0, speed: '0x', fps: 0 },
};

const fixos = {
  'oleoDeMacaco': 'Vh6ptYSv-BM',
}

wa.create({
  sessionId: "shit_post",
  multiDevice: true, //required to enable multiDevice support
  authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  hostNotificationLang: 'PT_BR',
  logConsole: false,
  popup: false,
  useChrome: true,
  executablePath: "/opt/google/chrome/chrome",
  // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  qrTimeout: 0,
}).then(client => start(client));

function start(client) {

  nodeCron.schedule("0 3 * * *", async () => {
    const groups = await client.getAllGroups();
    // await convertVideo(`https://www.youtube.com/watch?v=${fixos.oleoDeMacaco}`, fixos.oleoDeMacaco)

    groups.forEach((group) => {
      client.sendFile(group.id, `${fixos.oleoDeMacaco}.mp4`, `${fixos.oleoDeMacaco}.mp4`, '');
    })
  })

  client.onMessage(async message => {
    if (String(message.body).toLowerCase() === 'meme') {
      const videos = await YouTube.search('Memes Existenciais 2.0', { limit: 100 });
      const video = videos[parseInt(Math.random() * videos.length, 10)];

      console.log(message.from)
    if (!fs.existsSync(`${video.id}.mp4`)) {
        await convertVideo(`https://www.youtube.com/watch?v=${video.id}`, video.id)
      }

      await client.sendFile(message.from, `${video.id}.mp4`, `${video.id}.mp4`, '');
    }
  });
}

function convertVideo(ref, data) {
  return new Promise((resolve, reject) => {
    try {
      // Get audio and video streams
      const audio = ytdl(ref, { quality: 'highestaudio' })
        .on('progress', (_, downloaded, total) => {
          tracker.audio = { downloaded, total };
        });
      const video = ytdl(ref, { quality: 'highestvideo' })
        .on('progress', (_, downloaded, total) => {
          tracker.video = { downloaded, total };
        });

      // Prepare the progress bar
      let progressbarHandle = null;
      const progressbarInterval = 1000;
      const showProgress = () => {
        readline.cursorTo(process.stdout, 0);
        const toMB = i => (i / 1024 / 1024).toFixed(2);

        process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
        process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

        process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
        process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

        process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
        process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

        process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
        readline.moveCursor(process.stdout, 0, -3);
      };

      const ffmpegProcess = cp.spawn(ffmpeg, [
        '-loglevel', '8', '-hide_banner',
        '-progress', 'pipe:3',
        '-i', 'pipe:4',
        '-i', 'pipe:5',
        '-map', '0:a',
        '-map', '1:v',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        `${data}.mp4`,
        ], {
        windowsHide: true,
        stdio: [
          'inherit', 'inherit', 'inherit',
          'pipe', 'pipe', 'pipe',
        ],
      });
      ffmpegProcess.on('close', () => {
        console.log('done');

        resolve();
        
        process.stdout.write('\n\n\n\n');
        clearInterval(progressbarHandle);
      });

      ffmpegProcess.stdio[3].on('data', chunk => {
          if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
          const lines = chunk.toString().trim().split('\n');
          const args = {};
          for (const l of lines) {
            const [key, value] = l.split('=');
            args[key.trim()] = value.trim();
          }
          tracker.merged = args;
      });
      audio.pipe(ffmpegProcess.stdio[4]);
      video.pipe(ffmpegProcess.stdio[5]);
    } catch (error) {
      reject(error)
    }
  })
}
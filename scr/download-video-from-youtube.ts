// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import cp from 'child_process';
import readline from 'readline';
import ytdl from 'ytdl-core';
import ffmpeg from 'ffmpeg-static';

const tracker = {
  start: Date.now(),
  audio: { downloaded: 0, total: Infinity },
  video: { downloaded: 0, total: Infinity },
  merged: { frame: 0, speed: '0x', fps: 0 },
};

export class DownloadVideoFromYouTube {
  convertVideo(url: string, fileName: string) {
    return new Promise((resolve, reject) => {
      try {
        const audio = ytdl(url, { quality: 'highestaudio' })
          .on('progress', (_, downloaded, total) => {
            tracker.audio = { downloaded, total };
          });
        const video = ytdl(url, { quality: 'highestvideo' })
          .on('progress', (_, downloaded, total) => {
            tracker.video = { downloaded, total };
          });
  
        let progressBarHandle: null | NodeJS.Timer  = null;
        const progressBarInterval = 1000;
        const showProgress = () => {
          readline.cursorTo(process.stdout, 0);
          const toMB = (i: number) => (i / 1024 / 1024).toFixed(2);
  
          process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
          process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);
  
          process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
          process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);
  
          process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
          process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);
  
          process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
          readline.moveCursor(process.stdout, 0, -3);
        };
  
        const ffmpegProcess = cp.spawn(ffmpeg as string, [
          '-loglevel', '8', '-hide_banner',
          '-progress', 'pipe:3',
          '-i', 'pipe:4',
          '-i', 'pipe:5',
          '-map', '0:a',
          '-map', '1:v',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          `${fileName}.mp4`,
          ], {
          windowsHide: true,
          stdio: [
            'inherit', 'inherit', 'inherit',
            'pipe', 'pipe', 'pipe',
          ],
        });

        ffmpegProcess.on('close', () => {
          console.log('done');
  
          resolve(true);
          
          process.stdout.write('\n\n\n\n');
          clearInterval(progressBarHandle as NodeJS.Timer);
        });
  
        ffmpegProcess.stdio[3].on('data', chunk => {
            if (!progressBarHandle) progressBarHandle = setInterval(showProgress, progressBarInterval);
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
        reject(error);
      }
    })
  }
}
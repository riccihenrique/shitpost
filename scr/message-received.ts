import { Client, Message } from "@open-wa/wa-automate";
import YouTube from 'youtube-sr';
import fs from 'fs';
import { DownloadVideoFromYouTube } from "./download-video-from-youtube";

const termosParaBusca = [
  'Memes Existenciais 2.0',
  'Denielshit ',
];

export class MessageReceived {
  async execute(message: Message, client: Client) {
    if (message.body.toLowerCase() === 'meme' || message.body.includes('@5518991648279')) {
      const videos = await YouTube.search(termosParaBusca[parseInt((Math.random() * termosParaBusca.length).toString())], { limit: 100, type: 'video' });
      const video = videos[parseInt((Math.random() * videos.length).toString(), 10)];
      const videoId = video.id as string;

      if (!fs.existsSync(`${videoId}.mp4`)) {
        const videoDownloader = new DownloadVideoFromYouTube();
        await videoDownloader.convertVideo(`https://www.youtube.com/watch?v=${videoId}`, videoId);
      }

      await client.sendFile(message.from, `${videoId}.mp4`, `${videoId}.mp4`, '');
    }
  }
}
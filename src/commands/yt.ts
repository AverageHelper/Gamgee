import yts from "yt-search";

export default async function yt(params: string[]): Promise<string> {
  const query = params[0];
  const video = await yts({ videoId: query });

  return `${video.title}: (${video.duration.seconds / 60} mins)`;
}

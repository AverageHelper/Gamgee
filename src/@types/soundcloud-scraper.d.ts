/* eslint-disable unicorn/filename-case */
/**
 * Typings by ZYROUGE
 * Maintained by Snowflake Studio ❄
 * See https://github.com/DevSnowflake/soundcloud-scraper/pull/10
 */

// TODO: Remove this file once official typings are available

declare module "soundcloud-scraper" {
  import m3u8stream from "m3u8stream";
  import { RequestOptions, IncomingMessage } from "http";
  import { Response } from "node-fetch";
  import { load as CherrioLoad } from "cheerio";

  declare interface SimpleJSON {
    [s: string]: unknown;
  }

  declare interface ClientOptions {
    fetchAPIKey?: boolean;
  }

  declare class Client {
    API_KEY: string;
    options: ClientOptions;
    constructor(API_KEY?: string, ClientOptions?: ClientOptions);
    apiVersion(force?: boolean): Promise<string | null>;
    getSongInfo(
      url: string,
      options?: {
        fetchEmbed: boolean;
        fetchComments: boolean;
        fetchStreamURL: boolean;
      }
    ): Promise<Song>;
    getPlaylist(url: string, options?: PlaylistParseOptions): Promise<Playlist>;
    search(
      query: string,
      type?: "all" | "artist" | "playlist" | "track"
    ): Promise<Array<SearchResult>>;
    getUser(username: string): Promise<UserInfo>;
    getEmbed(embedURL: string): Promise<Embed>;
    createAPIKey(KEY?: string | null, fetch?: boolean): Promise<void>;
    fetchStreamURL(trackURL: string): Promise<string | null>;
  }

  declare const Constants: SimpleJSON;
  declare const Store: Map<unknown, unknown>;
  declare const version: string;

  type validateURL = (url?: string) => boolean;
  type keygen = (force?: boolean) => Promise<string | null>;
  declare class Util {
    static validateURL: validateURL;
    static keygen: keygen;
    static last(arr?: Array<unknown>): unknown;
    static request(url?: RequestInfo, options?: RequestInit): Promise<Response>;
    static parseHTML(url?: RequestInfo, options?: RequestInit): Promise<string>;
    static loadHTML(html?: string | null): ReturnType<typeof CherrioLoad>;
    static parseDuration(duration: string): number;
    static parseComments(commentSection: string): Array<Comment>;
    static fetchSongStreamURL(songURL: string, clientID: string | null): Promise<string>;
  }

  type downloadHLS = (url: string, options?: m3u8stream.Options) => Promise<m3u8stream.Stream>;

  type downloadProgressive = (url: string, options?: RequestOptions) => Promise<IncomingMessage>;

  declare class StreamDownloader {
    static downloadHLS: downloadHLS;
    static downloadProgressive: downloadProgressive;
  }

  declare class Embed {
    url: string;
    version: number;
    type: string;
    provider: {
      name: string;
      url: string;
    };
    height: number;
    width: number;
    title: string;
    description: string;
    author: {
      name: string;
      url: string;
    };
    thumbnailURL: string;
    visualizer: string;
    constructor(data: Record<string, unknown>, embedURL?: string | null);
    toHTML(): string;
    toJSON(): SimpleJSON;
    toString(): string;
  }

  declare interface SongAuthor {
    name: string;
    username: string;
    url: string;
    avatarURL: string;
    urn: number;
    verified: boolean;
    followers: number;
    following: number;
  }

  declare interface Comment {
    text: string;
    createdAt: Date;
    author: {
      name: string;
      username: string;
      url: string;
    };
  }

  declare interface SongData {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    url: string;
    duration: number;
    playCount: string;
    commentsCount: string;
    likes: string;
    genre: string;
    author: SongAuthor;
    publishedAt: Date;
    embedURL: string;
    embed: Embed | null;
    track: {
      hls: string;
      progressive: string;
    };
    trackURL: string;
    streamURL: string;
    comments: Array<Comment>;
  }

  declare class Song {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    url: string;
    duration: number;
    playCount: number;
    commentsCount: number;
    likes: number;
    genre: string;
    author: SongAuthor;
    publishedAt: Date;
    embedURL: string;
    embed: Embed;
    streams: {
      hls: string;
      progressive: string;
    };
    trackURL: string;
    comments: Array<Comment>;
    streamURL: string;
    age: number;
    publishedTimestamp: number;
    downloadHLS: downloadHLS;
    downloadProgressive: downloadProgressive;
    constructor(data: SimpleJSON);
    toString(): string;
    toJSON(): SongData;
  }

  declare interface PlaylistParseOptions {
    fetchEmbed?: boolean;
  }

  declare interface Playlist {
    id: number;
    title: string;
    url: string;
    description: string;
    thumbnail: string;
    author: {
      name: string;
      username: string;
      urn: number;
      profile: string;
    };
    embedURL: string;
    embed: Embed | null;
    genre: string;
    trackCount: number;
    tracks: Array<SimpleJSON>;
  }

  declare interface SearchResult {
    index: number;
    artist: string | null;
    url: string;
    itemName: string;
    name: string;
    type: "track" | "artist" | "playlist" | "unknown";
  }

  declare interface UserTracks {
    title: string;
    url: string;
    publishedAt: Date;
    genre: string;
    author: string;
    duration: number;
  }

  declare interface UserLikes {
    title: string;
    url: string;
    publishedAt: Date;
    author: {
      name: string;
      username: string;
      profile: string;
    };
  }

  declare interface UserInfo {
    urn: number;
    username: string;
    name: string;
    verified: boolean;
    createdAt: Date;
    avatarURL: string | null;
    profile: string;
    bannerURL: string | null;
    followers: number;
    following: number;
    likesCount: number;
    tracksCount: number;
    tracks: Array<UserTracks>;
    likes: Array<UserLikes>;
  }
}

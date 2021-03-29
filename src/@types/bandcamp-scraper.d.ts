/* eslint-disable unicorn/filename-case */

/*
 * Typings for bandcamp-scraper
 * https://github.com/masterT/bandcamp-scraper
 */
// TODO: Remove this file once official typings are available

declare module "bandcamp-scraper" {
  export interface SearchParams {
    query: string;

    /** @default 1 */
    page?: number;
  }

  export interface LabelSearchResult {
    type: string;
    name: string;
    url: string;
    imageUrl: string;
    tags: Array<string>;
  }

  export interface ArtistSearchResult extends LabelSearchResult {
    type: "artist";
    genre?: string;
    location: string;
  }

  export interface AlbumSearchResult extends LabelSearchResult {
    type: "album";
    releaseDate: string;
    artist: string;
    numTracks: number;
    numMinutes: number;
  }

  export interface TrackSearchResult extends LabelSearchResult {
    type: "track";
    releaseDate: string;
    album: string;
    artist: string;
  }

  export interface FanSearchResult extends LabelSearchResult {
    type: "fan";
    genre: string;
  }

  export type SearchResults = Array<
    ArtistSearchResult | AlbumSearchResult | TrackSearchResult | FanSearchResult | LabelSearchResult
  >;

  export function search(
    params: SearchParams,
    cb: (error: Error | null, searchResults: SearchResults) => void
  ): void;

  export interface TagParams {
    tag: string;

    /** @default 1 */
    page?: number;
  }

  export interface TagResult {
    name: string;
    artist: string;
    url: string;
  }

  export function getAlbumsWithTag(
    params: TagParams,
    cb: (error: Error | null, tagResults: Array<TagResult>) => void
  ): void;

  export function getAlbumUrls(
    artistUrl: string,
    cb: (error: Error | null, albumUrls: Array<string>) => void
  ): void;

  export interface AlbumProduct {
    name: string;
    artist: string;
    format: string;
    url: string;
    imageUrls: Array<string>;
    priceInCents: number | null;
    currency: string | null;
    description: string;
    soldOut: boolean;
    nameYourPrice: boolean;
    offerMore: boolean;
  }

  export function getAlbumProducts(
    albumUrl: string,
    cb: (error: Error | null, albumProducts: Array<AlbumProduct>) => void
  ): void;

  interface Track {
    name: string;
    url?: string;
    duration?: string;
  }

  interface Tag {
    name: string;
  }

  export interface AlbumInfo {
    artist: string;
    title: string;
    url: string;
    imageUrl?: string;
    tracks: Array<Track>;
    tags?: Array<Tag>;
    raw: Record<string, unknown>;
  }

  export function getAlbumInfo(
    albumUrl: string,
    cb: (error: Error | null, albumInfo: AlbumInfo) => void
  ): void;

  export function getArtistUrls(
    labelUrl: string,
    cb: (error: Error | null, artistsUrls: Array<string>) => void
  ): void;

  interface Album {
    url?: string;
    title?: string;
    coverImage?: string;
  }

  interface Show {
    date?: string;
    venue?: string;
    venueUrl?: string;
    location?: string;
  }

  interface BandLink {
    name?: string;
    url?: string;
  }

  export interface ArtistInfo {
    name?: string;
    location?: string;
    coverImage?: string;
    description?: string;
    albums?: Array<Album>;
    shows?: Array<Show>;
    bandLinks?: Array<BandLink>;
  }

  export function getArtistInfo(
    artistUrl: string,
    cb: (error: Error | null, artistInfo: ArtistInfo) => void
  ): void;
}

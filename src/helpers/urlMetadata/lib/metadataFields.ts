import type { Options } from "../index.js";
import clean from "./clean.js";

export interface Fields {
	url: string;
	canonical: string;
	title: string;
	image: string;
	author: string;
	description: string;
	keywords: string;
	source: string;
	price: string;
	priceCurrency: string;
	availability: string;
	robots: string;
	jsonld?: Partial<Fields>;

	"og:url": string;
	"og:locale": string;
	"og:locale:alternate": string;
	"og:title": string;
	"og:type": string;
	"og:description": string;
	"og:determiner": string;
	"og:site_name": string;
	"og:image": string;
	"og:image:secure_url": string;
	"og:image:type": string;
	"og:image:width": string;
	"og:image:height": string;

	"twitter:title": string;
	"twitter:image": string;
	"twitter:image:alt": string;
	"twitter:card": string;
	"twitter:site": string;
	"twitter:site:id": string;
	"twitter:account_id": string;
	"twitter:creator": string;
	"twitter:creator:id": string;
	"twitter:player": string;
	"twitter:player:width": string;
	"twitter:player:height": string;
	"twitter:player:stream": string;

	"article:published_time"?: string;
	"article:modified_time"?: string;
	"article:expiration_time"?: string;
	"article:author"?: string;
	"article:section"?: string;
	"article:tag"?: string;
	"og:article:published_time"?: string;
	"og:article:modified_time"?: string;
	"og:article:expiration_time"?: string;
	"og:article:author"?: string;
	"og:article:section"?: string;
	"og:article:tag"?: string;
}

/**
 * @ctor MetadataFields (chainable)
 * Returns basic metadata fields whose values will be filled in by the parser
 * after url request response. Most of these are Open Graph Protocol (og:) so
 * far: http://ogp.me/
 *
 * TODO: protocols `sailthru`, `parseley`, `twitter`, `dcterms`
 */
export default class MetadataFields {
	options: Options;
	fields: Fields;

	constructor(options?: Options) {
		this.options = options ?? {};
		this.fields = {
			url: "",
			canonical: "",
			title: "",
			image: "",
			author: "",
			description: "",
			keywords: "",
			source: "",
			price: "",
			priceCurrency: "",
			availability: "",
			robots: "",

			"og:url": "",
			"og:locale": "",
			"og:locale:alternate": "",
			"og:title": "",
			"og:type": "",
			"og:description": "",
			"og:determiner": "",
			"og:site_name": "",
			"og:image": "",
			"og:image:secure_url": "",
			"og:image:type": "",
			"og:image:width": "",
			"og:image:height": "",

			"twitter:title": "",
			"twitter:image": "",
			"twitter:image:alt": "",
			"twitter:card": "",
			"twitter:site": "",
			"twitter:site:id": "",
			"twitter:account_id": "",
			"twitter:creator": "",
			"twitter:creator:id": "",
			"twitter:player": "",
			"twitter:player:width": "",
			"twitter:player:height": "",
			"twitter:player:stream": ""
		};
	}

	/**
	 * @method `configureType` (chainable)
	 * @param `type`
	 * Returns properties belonging to global types that are grouped into
	 * verticals and generally agreed upon. In the following example, "music.song"
	 * would be the type passed as an argument into this method. This method
	 * currently only supports type `article`, however.
	 * <meta property="og:type" content="music.song" />
	 *
	 * TODO: music, audio, video
	 */
	configureType(type?: string): this {
		if (!(type ?? "") || typeof type !== "string") return this;
		const fieldsByType: Record<string, Partial<Fields>> = {
			article: {
				"article:published_time": "",
				"article:modified_time": "",
				"article:expiration_time": "",
				"article:author": "",
				"article:section": "",
				"article:tag": "",
				"og:article:published_time": "",
				"og:article:modified_time": "",
				"og:article:expiration_time": "",
				"og:article:author": "",
				"og:article:section": "",
				"og:article:tag": ""
			}
		};
		if (fieldsByType[type]) this.fields = { ...this.fields, ...fieldsByType[type] };
		return this;
	}

	/**
	 * @method `lockKeys` (chainable)
	 * Freeze metadata keys via Object.seal
	 */
	lockKeys(): this {
		Object.seal(this.fields);
		return this;
	}

	/**
	 * @method `set` (chainable)
	 * @param obj must be in the form of {key: value}
	 */
	set(obj?: Partial<Fields>): this {
		if (obj) this.fields = { ...this.fields, ...obj };
		return this;
	}

	/**
	 * @method `get`
	 * @param key
	 */
	get<K extends keyof Fields>(key: K): Fields[K] {
		return this.fields[key];
	}

	/**
	 * @method `clean` (chainable)
	 */
	clean(): this {
		Object.keys(this.fields).forEach(key => {
			this.fields[key as keyof Fields] = clean(
				key,
				(this.fields as Omit<Fields, "jsonld">)[key as keyof Omit<Fields, "jsonld">] ?? "",
				this.options
			);
		});
		return this;
	}

	/**
	 * @method `finalize`
	 * optionally encode and then return all fields
	 */
	finalize(): Fields {
		const encode = this.options.encode;
		if (encode !== undefined && typeof encode === "function") {
			Object.keys(this.fields).forEach(key => {
				this.fields[key as keyof Fields] = encode(this.fields[key as keyof Fields]);
			});
		}
		return this.fields;
	}
}

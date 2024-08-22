import type { Result } from "htmlmetaparser";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { expectDefined, expectValueEqual } from "../../../tests/testUtils/expectations.js";
import { VideoError } from "../../errors/VideoError.js";

// Mock fetchMetadata
vi.mock("../../helpers/fetchMetadata.js");
import { fetchMetadata } from "../../helpers/fetchMetadata.js";
const mockFetchMetadata = fetchMetadata as Mock<
	Parameters<typeof fetchMetadata>,
	ReturnType<typeof fetchMetadata>
>;

// Import the unit under test
import { getBandcampTrack } from "./getBandcampTrack.js";

describe("Bandcamp track details", () => {
	beforeEach(() => {
		mockFetchMetadata.mockRejectedValue(new Error("Please mock a response."));
	});

	test("throws for bandcamp album links", async () => {
		// It's an album, so no duration
		const url = "https://poniesatdawn.bandcamp.com/album/memories";
		mockFetchMetadata.mockResolvedValue({
			jsonld: [
				{
					name: "sample",
				},
			],
		} as unknown as Result);

		await expect(() => getBandcampTrack(new URL(url))).rejects.toThrow(VideoError);
	});

	// ISO strings given here are the ones found on Bandcamp as of 22 Aug 2024:
	test.each`
		url                                                                             | duration | iso
		${"https://poniesatdawn.bandcamp.com/track/let-the-magic-fill-your-soul"}       | ${233}   | ${"P00H03M53S"}
		${"https://forestrainmedia.com/track/bad-wolf"}                                 | ${277}   | ${"P00H04M37S"}
		${"https://lehtmojoe.bandcamp.com/track/were-not-going-home-dallas-stars-2020"} | ${170}   | ${"P00H02M50S"}
	`(
		"returns info for Bandcamp track $url, $duration seconds long",
		async ({ url, duration, iso }: { url: string; duration: number; iso: string }) => {
			mockFetchMetadata.mockResolvedValue({
				jsonld: [{ name: "sample", duration: iso }],
			} as unknown as Result);

			const details = await getBandcampTrack(new URL(url));
			expectValueEqual(details.url, url);
			expectDefined(details.duration.seconds);
			expectValueEqual(details.duration.seconds, duration);
		},
	);
});

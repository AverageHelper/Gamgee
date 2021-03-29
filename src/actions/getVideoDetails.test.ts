import getVideoDetails from "./getVideoDetails";

describe("Video details", () => {
  // YouTube
  const testVid1 = "https://youtube.com/watch?v=9Y8ZGLiqXB8";

  test.each`
    desc                   | url
    ${"no input"}          | ${""}
    ${"invalid URL"}       | ${"not at all"}
    ${"unavailable video"} | ${"https://youtu.be/9Y8ZGLiqXba"}
    ${"is too short"}      | ${"https://www.youtube.com/watch?v=9Y8ZGL"}
  `("returns null with $desc", async ({ url }: { url: string }) => {
    const details = await getVideoDetails([url], null);
    expect(details).toBeNull();
  });

  test.each`
    desc                         | params                                                                                                | result
    ${"is already good"}         | ${["https://youtube.com/watch?v=9RAQsdTQIcs"]}                                                        | ${"https://youtube.com/watch?v=9RAQsdTQIcs"}
    ${"is shortened"}            | ${["https://youtu.be/9Y8ZGLiqXB8"]}                                                                   | ${testVid1}
    ${"has extra info"}          | ${["https://youtu.be/9Y8ZGLiqXB8", "Text", "and", "stuff"]}                                           | ${testVid1}
    ${"spams repeat characters"} | ${["https://youtu.be/9Y8ZGLiqXB8!!!!!!!!!!!!!!!!!!!!!!!!!!!!"]}                                       | ${testVid1}
    ${"spams random characters"} | ${["https://youtu.be/9Y8ZGLiqXB8kdasu997ru53"]}                                                       | ${testVid1}
    ${"is a playlist"}           | ${["https://www.youtube.com/watch?v=2rzoPFLRhqE&list=RDMM&start_radio=1&ab_channel=LucaStricagnoli"]} | ${"https://youtube.com/watch?v=2rzoPFLRhqE"}
    ${"has channel info"}        | ${["https://www.youtube.com/watch?v=nY1WVAoMnYc&ab_channel=JonathanYoung"]}                           | ${"https://youtube.com/watch?v=nY1WVAoMnYc"}
    ${"has time codes"}          | ${["https://www.youtube.com/watch?v=NFw-FrYmAEw&t=10s"]}                                              | ${"https://youtube.com/watch?v=NFw-FrYmAEw"}
  `(
    "returns info for a YouTube link that $desc",
    async ({ params, result }: { params: Array<string>; result: string }) => {
      const details = await getVideoDetails(params, null);
      expect(details?.url).toBe(result);
      expect(details?.duration.seconds).toBeDefined();
      expect(details?.duration.seconds).toBeNumber();
      expect(details?.duration.seconds).toBeGreaterThan(20);
    }
  );

  // SoundCloud
  const testVid2 = "https://soundcloud.com/hwps/no999";

  test.each`
    desc                | params                                                           | result
    ${"is valid"}       | ${["https://soundcloud.com/hwps/no999"]}                         | ${testVid2}
    ${"has extra info"} | ${["https://soundcloud.com/hwps/no999", "Text", "and", "stuff"]} | ${testVid2}
  `(
    "returns info for a SoundCloud link that $desc",
    async ({ params, result }: { params: Array<string>; result: string }) => {
      const details = await getVideoDetails(params, null);
      expect(details?.url).toBe(result);
      expect(details?.duration.seconds).toBeDefined();
      expect(details?.duration.seconds).toBeNumber();
      expect(details?.duration.seconds).toBeGreaterThan(20);
    }
  );

  // BandCamp

  test("returns null for bandcamp album links", async () => {
    const url = "https://poniesatdawn.bandcamp.com/album/memories";
    const details = await getVideoDetails([url]);
    expect(details).toBe(null);
  });

  test("returns info for valid Bandcamp links", async () => {
    const urls = [
      "https://poniesatdawn.bandcamp.com/track/let-the-magic-fill-your-soul",
      "https://forestrainmedia.com/track/bad-wolf",
      "https://lehtmojoe.bandcamp.com/track/were-not-going-home-dallas-stars-2020"
    ];
    for (const url of urls) {
      const details = await getVideoDetails([url]);
      expect(details?.url).toBe(url);
      expect(details?.duration.seconds).toBeDefined();
      expect(details?.duration.seconds).toBeNumber();
      expect(details?.duration.seconds).toBeGreaterThan(20);
    }
  });
});

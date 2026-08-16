import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({
  turbopack: {},
  headers: async () => [
    {
      source: "/mockServiceWorker.js",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
});

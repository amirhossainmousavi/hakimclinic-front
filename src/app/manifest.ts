import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "پنل مدیریت کلینیک ارتوپدی فنی حکیم",
    short_name: "کلینیک حکیم",
    description: "پنل مدیریت کلینیک ارتوپدی فنی حکیم",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F5F6FB",
    theme_color: "#3861FB",
    dir: "rtl",
    lang: "fa",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

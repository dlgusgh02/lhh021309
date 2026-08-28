import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/calculator", "/login", "/signup"],
        disallow: ["/dashboard", "/ingredients", "/recipes", "/simulator", "/settings"],
      },
    ],
  };
}

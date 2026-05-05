// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: "Platform Review",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  colorMode: {
    preference: "light",
  },
  devtools: { enabled: true },
  css: ["@/assets/css/tailwind.css"],
  ui: {
    icons: ["solar"],
  },

  modules: ["@nuxt/ui", "@pinia/nuxt", "@sidebase/nuxt-auth", "@vueuse/nuxt"],
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || "http://localhost:3001",
      laragon: process.env.NUXT_PUBLIC_LARAGON_URL || "http://localhost/platform-review/public"
    },
  },

  auth: {
    origin: process.env.ORIGIN_URL || "http://localhost:3000",
    baseURL: process.env.API_URL || "http://localhost:3001",
    provider: {
      type: "local",
      pages: {
        login: "/",
      },
      endpoints: {
        signIn: { path: "/login", method: "post" },
        signOut: { path: "/logout", method: "post" },
        getSession: { path: "/session", method: "get" },
      },
      token: {
        signInResponseTokenPointer: "/token", 
        maxAgeInSeconds: 8 * 60 * 60,
      },
    },
    globalAppMiddleware: true,
  },
});

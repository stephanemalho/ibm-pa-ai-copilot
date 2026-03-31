import { publicEnv } from "@/shared/env/public";
import { appRoutes } from "@/shared/lib/routes";

const siteConfig = {
  name: publicEnv.NEXT_PUBLIC_APP_NAME,
  description:
    "Production-minded POC scaffold for an IBM Planning Analytics AI Copilot web app.",
} as const;

const primaryNavItems = [
  {
    href: appRoutes.home,
    label: "Home",
  },
  {
    href: appRoutes.chat,
    label: "Chat",
  },
] as const;

export { primaryNavItems, siteConfig };

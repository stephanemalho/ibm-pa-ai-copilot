import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { publicEnv } from "@/shared/env/public";
import { appRoutes } from "@/shared/lib/routes";
import { primaryNavItems, siteConfig } from "@/shared/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  metadataBase: publicEnv.NEXT_PUBLIC_APP_BASE_URL
    ? new URL(publicEnv.NEXT_PUBLIC_APP_BASE_URL)
    : undefined,
};

type RootLayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps): ReactNode => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col px-6 py-5 sm:px-8">
          <header className="mb-10 flex items-center justify-between gap-4 rounded-full border border-white/70 bg-white/75 px-5 py-3 shadow-panel backdrop-blur">
            <Link
              className="font-mono text-sm font-medium tracking-wide text-slate-700"
              href={appRoutes.home}
            >
              {siteConfig.name}
            </Link>

            <nav className="flex items-center gap-2">
              {primaryNavItems.map((item) => (
                <Button asChild key={item.href} variant="ghost">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </nav>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;

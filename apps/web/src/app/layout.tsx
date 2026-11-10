import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "LocalImpact", description: "Signalement et suivi des problèmes du quotidien" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

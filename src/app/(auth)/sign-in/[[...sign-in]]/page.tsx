"use client"

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";

export default function Page() {
  const theme = useTheme();

  return <SignIn
    appearance={{
      baseTheme: theme.theme === "dark" ? dark : 'simple',
      elements: {
        card: "border-0 shadow-none",
      }
    }}
    forceRedirectUrl={'/workspace'}
  />;
}

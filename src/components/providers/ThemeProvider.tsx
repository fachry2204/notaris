"use client";

import * as React from "react";

import { ClientThemeProvider } from "./ClientThemeProvider";

export function ThemeProvider({
  children,
  ...props
}: any) {
  return <ClientThemeProvider {...props}>{children}</ClientThemeProvider>;
}

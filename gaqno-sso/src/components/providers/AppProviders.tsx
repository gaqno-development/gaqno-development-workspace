

import { QueryProvider } from "@gaqno-dev/frontcore/components/providers";
import { ThemeProvider } from "@gaqno-dev/frontcore/components/providers";
import { AuthProvider } from "@gaqno-dev/frontcore/contexts";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}


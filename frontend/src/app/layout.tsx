import "./globals.css";
import { AuthProvider } from "./components/auth/AuthProvider";
import GlobalAuthRedirect from "./components/auth/GlobalAuthRedirect";
import { ThemeProvider } from "./hooks/useThemes";
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
      <Script id="markdown-it-fix" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined' && typeof window.isSpace === 'undefined') {
              window.isSpace = function(code) {
                return code === 0x20 || code === 0x09 || code === 0x0A || code === 0x0B || code === 0x0C || code === 0x0D;
              };
            }
          `}
        </Script>
      </head>
      <body>

        <AuthProvider>
          <ThemeProvider>
            <GlobalAuthRedirect />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
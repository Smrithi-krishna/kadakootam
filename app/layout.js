import "./globals.css";

export const metadata = {
  title: "KadaKootam (കടക്കൂട്ടം) – Voice-Powered Local Shop Platform",
  description: "Local shops. One community. Voice-powered inventory management and local product discovery for Kerala.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-amber-200 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}

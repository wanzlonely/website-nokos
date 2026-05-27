import './globals.css';

export const metadata = {
  title: 'Walz Nexus',
  description: 'Platform nomor virtual premium',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#060d1e" />
      </head>
      <body>
        <div className="bg-canvas" aria-hidden="true">
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="bg-orb bg-orb-3" />
          <div className="bg-grid" />
        </div>
        <main className="main-wrapper">{children}</main>
      </body>
    </html>
  );
}

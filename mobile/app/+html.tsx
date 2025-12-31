/**
 * Custom HTML shell for web builds
 *
 * This file customizes the HTML document structure for Expo Web.
 * Features:
 * - SEO meta tags
 * - Open Graph tags for social sharing
 * - Viewport configuration for responsive design
 * - Theme color matching app branding
 */
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1"
        />

        {/* Primary Meta Tags */}
        <title>Kairos - Comunicacion Escolar</title>
        <meta name="title" content="Kairos - Comunicacion Escolar" />
        <meta
          name="description"
          content="Mantente conectado con el colegio. Novedades, eventos, mensajes y mas en un solo lugar."
        />

        {/* Theme Color */}
        <meta name="theme-color" content="#8B1538" />
        <meta name="msapplication-navbutton-color" content="#8B1538" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#8B1538" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://kairos.app/" />
        <meta property="og:title" content="Kairos - Comunicacion Escolar" />
        <meta
          property="og:description"
          content="Mantente conectado con el colegio. Novedades, eventos, mensajes y mas en un solo lugar."
        />
        <meta property="og:image" content="https://kairos.app/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://kairos.app/" />
        <meta property="twitter:title" content="Kairos - Comunicacion Escolar" />
        <meta
          property="twitter:description"
          content="Mantente conectado con el colegio. Novedades, eventos, mensajes y mas en un solo lugar."
        />
        <meta property="twitter:image" content="https://kairos.app/og-image.png" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work correctly.
          The body will still be scrollable if the content exceeds the viewport.
        */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

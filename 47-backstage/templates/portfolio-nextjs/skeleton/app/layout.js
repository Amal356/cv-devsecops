import "./globals.css";

export const metadata = {
  title: "${{ values.fullName }} – Portfolio",
  description: "${{ values.description }}",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

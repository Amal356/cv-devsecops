import './globals.css';

export const metadata = {
  title: 'Amal Jemli | DevSecOps Portfolio',
  description: 'Portfolio DevSecOps de Amal Jemli',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
import './globals.css';

export const metadata = {
  title: 'StoreNet',
  description: 'Distributed company file storage with user-wise access control',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

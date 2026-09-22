'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarNav() {
  const path = usePathname();
  const [user, setUser] = useState(null);

  // Usarer info (role shoho) fetch kora
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => setUser(null));
  }, []);

  const links = [
    { href: '/dashboard', label: 'Files' },
    { href: '/dashboard/upload', label: 'Upload' },
    { href: '/dashboard/shared', label: 'Shared' }, // Ekhane 'Shared' menu add kora holo
    ...(user?.role === 'admin' ? [{ href: '/dashboard/nodes', label: 'Storage nodes' }] : []),
  ];

  return (
    <nav className="nav">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={path === l.href ? 'active' : ''}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
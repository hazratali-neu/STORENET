import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import SidebarNav from '@/components/SidebarNav';
import SignOutButton from '@/components/SignOutButton';

export default async function DashboardLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect('/login');

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">StoreNet</div>
        <div className="brand-sub">Distributed file storage</div>
        <SidebarNav />
        <div className="sidebar-foot">
          <div>{user.name}</div>
          <div className="muted">{user.role}</div>
          <SignOutButton />
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

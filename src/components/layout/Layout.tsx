import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationBell } from '../common/NotificationBell';
import { ThemeToggle } from '../common/ThemeToggle';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-3 flex justify-end items-center gap-2 transition-colors">
          <ThemeToggle />
          <NotificationBell />
        </header>
        {/* Main content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { Outlet, useLocation } from 'react-router-dom';
import { Home, ArrowLeftRight, BarChart3, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/transacoes', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r bg-sidebar text-sidebar-foreground">
          <div className="flex h-16 items-center gap-2 px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
              F
            </div>
            <span className="text-lg font-bold text-sidebar-primary-foreground">FinançasPro</span>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-300 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeClassName="bg-nav-active text-nav-active-foreground hover:bg-nav-active hover:text-nav-active-foreground"
              >
                <item.icon className="h-5 w-5 transition-transform duration-300" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1 min-h-screen",
        !isMobile && "ml-60",
        isMobile && "pb-20"
      )}>
        <div className="mx-auto max-w-6xl p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.05)] py-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground transition-all duration-300 ease-in-out"
              activeClassName="text-nav-active scale-110"
            >
              <item.icon className="h-5 w-5 transition-transform duration-300" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

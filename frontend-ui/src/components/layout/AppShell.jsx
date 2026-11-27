import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  BookOpen,
  Video,
  FlaskConical,
  BarChart3,
  Sun,
  Moon,
  Menu,
  X,
  Command as CommandIcon,
  GraduationCap,
} from 'lucide-react';
import CommandPalette from '../common/CommandPalette';

const NAV_TEACHER = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/upload', icon: Upload, label: 'Upload PDFs' },
  { to: '/questions', icon: BookOpen, label: 'Question Bank' },
  { to: '/videos', icon: Video, label: 'Video Library' },
];

const NAV_STUDENT = [
  { to: '/solve', icon: FlaskConical, label: 'Student Solve' },
  { to: '/proficiency', icon: BarChart3, label: 'Proficiency' },
];

const SideLink = ({ to, icon: Icon, label, end, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold border-l-2 border-sidebar-primary rounded-l-none'
          : 'text-sidebar-foreground font-medium hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon
          size={16}
          strokeWidth={isActive ? 2.2 : 1.8}
          className={isActive ? 'text-sidebar-primary shrink-0' : 'shrink-0'}
        />
        <span className="truncate">{label}</span>
      </>
    )}
  </NavLink>
);

const AppShell = ({ children }) => {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const [drawerPath, setDrawerPath] = useState(null);
  const [roleOverride, setRoleOverride] = useState(null);
  const location = useLocation();

  // Drawer closes automatically whenever route pathname changes
  const mobileOpen = drawerPath === location.pathname;

  const isStudentRoute =
    location.pathname.startsWith('/solve') || location.pathname.startsWith('/proficiency');
  const role = roleOverride ?? (isStudentRoute ? 'student' : 'teacher');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerPath(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const closeDrawer = () => setDrawerPath(null);

  const primaryGroup =
    role === 'teacher'
      ? { heading: 'Teacher Studio', items: NAV_TEACHER }
      : { heading: 'Student Mode', items: NAV_STUDENT };

  const secondaryGroup =
    role === 'teacher'
      ? { heading: 'Student Mode', items: NAV_STUDENT }
      : { heading: 'Teacher Studio', items: NAV_TEACHER };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <GraduationCap size={16} className="text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-serif text-base font-bold text-sidebar-accent-foreground leading-tight truncate">
              Chemistry QB
            </div>
            <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
              Workbench
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={closeDrawer}
          className="md:hidden p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground"
          aria-label="Close navigation menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Role Segmented Switcher + Command Palette trigger */}
      <div className="px-3 pt-3 pb-2 space-y-2.5">
        <div
          className="grid grid-cols-2 rounded-lg bg-muted p-0.5 border border-border"
          role="tablist"
          aria-label="Workspace role"
        >
          <button
            type="button"
            role="tab"
            aria-selected={role === 'teacher'}
            onClick={() => setRoleOverride('teacher')}
            className={`text-xs font-semibold py-1.5 rounded-md transition-colors ${
              role === 'teacher'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Teacher
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'student'}
            onClick={() => setRoleOverride('student')}
            className={`text-xs font-semibold py-1.5 rounded-md transition-colors ${
              role === 'student'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Student
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            closeDrawer();
            openCommandPalette();
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs text-muted-foreground transition-colors"
        >
          <span className="inline-flex items-center gap-1.5">
            <CommandIcon size={12} />
            <span>Jump to…</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-5" aria-label="Primary navigation">
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            {primaryGroup.heading}
          </div>
          <div className="flex flex-col gap-0.5">
            {primaryGroup.items.map((item) => (
              <SideLink
                key={item.to}
                {...item}
                onClick={() => {
                  closeDrawer();
                  setRoleOverride(null);
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold tracking-widest uppercase text-muted-foreground/80">
            {secondaryGroup.heading}
          </div>
          <div className="flex flex-col gap-0.5">
            {secondaryGroup.items.map((item) => (
              <SideLink
                key={item.to}
                {...item}
                onClick={() => {
                  closeDrawer();
                  setRoleOverride(null);
                }}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground truncate">
          CBSE Class 12 Chemistry
        </span>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="p-1.5 rounded-md border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <div
            className="absolute inset-0 bg-foreground/30"
            onClick={closeDrawer}
          />
          <aside className="relative w-64 max-w-[82vw] h-full bg-sidebar border-r border-sidebar-border shadow-xl animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col md:ml-60 min-w-0">
        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-2.5 px-4 py-3 bg-background border-b border-border">
          <button
            type="button"
            onClick={() => setDrawerPath(location.pathname)}
            className="p-1.5 -ml-1 rounded-md hover:bg-accent text-foreground"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
              <GraduationCap size={13} className="text-primary-foreground" />
            </div>
            <span className="font-serif text-base font-bold truncate">Chemistry QB</span>
          </div>
          <button
            type="button"
            onClick={openCommandPalette}
            className="p-1.5 rounded-md border border-border bg-card hover:bg-accent text-muted-foreground"
            aria-label="Open command palette"
          >
            <CommandIcon size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="p-1.5 rounded-md border border-border bg-card hover:bg-accent text-muted-foreground"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </header>

        {/* Main View */}
        <main className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-4 py-3 sm:px-6 md:px-8">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Chemistry QB Engine © {new Date().getFullYear()} · CBSE Class 12 Chemistry</span>
            <button
              type="button"
              onClick={openCommandPalette}
              className="hidden sm:inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">⌘K</kbd>
              <span>Command Palette</span>
            </button>
          </div>
        </footer>
      </div>

      <CommandPalette dark={dark} onToggleTheme={() => setDark((d) => !d)} />
    </div>
  );
};

export default AppShell;

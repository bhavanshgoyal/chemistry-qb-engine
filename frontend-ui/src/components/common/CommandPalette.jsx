import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  Search,
  LayoutDashboard,
  Upload,
  BookOpen,
  Video,
  FlaskConical,
  FileDown,
  X,
  BarChart3,
  Sun,
  Moon,
} from 'lucide-react';
import { CBSE_CHAPTERS } from '../../data/syllabus';
import { exportPdf } from '../../services/api';

const CommandPalette = ({ dark, onToggleTheme }) => {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onCustomOpen = () => setOpen(true);

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-command-palette', onCustomOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-command-palette', onCustomOpen);
    };
  }, []);

  const go = useCallback(
    (path) => {
      navigate(path);
      setOpen(false);
    },
    [navigate]
  );

  const handleQuickExport = async () => {
    setExporting(true);
    try {
      await exportPdf({ chapter: 'All' });
      setOpen(false);
    } catch {
      go('/questions');
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="absolute inset-0 bg-foreground/25"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-lg bg-popover text-popover-foreground border border-border rounded-xl shadow-xl overflow-hidden animate-slide-up">
        <Command className="flex flex-col">
          <div className="flex items-center gap-2.5 px-4 border-b border-border">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <Command.Input
              placeholder="Jump to a route, chapter, or action…"
              className="flex-1 py-3.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              aria-label="Close command palette"
            >
              <X size={15} />
            </button>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No matching command or chapter.
            </Command.Empty>

            <Command.Group
              heading="Navigation"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5"
            >
              <Command.Item
                onSelect={() => go('/')}
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <LayoutDashboard size={15} /> Dashboard
              </Command.Item>
              <Command.Item
                onSelect={() => go('/upload')}
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <Upload size={15} /> Upload PDFs
              </Command.Item>
              <Command.Item
                onSelect={() => go('/questions')}
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <BookOpen size={15} /> Question Bank
              </Command.Item>
              <Command.Item
                onSelect={() => go('/videos')}
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <Video size={15} /> Video Library
              </Command.Item>
              <Command.Item
                onSelect={() => go('/solve')}
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <FlaskConical size={15} /> Student Solve
              </Command.Item>
              <Command.Item
                onSelect={() => go('/proficiency')}
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <BarChart3 size={15} /> Proficiency Map
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading="Filter by CBSE Class 12 Chapter"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5 mt-1"
            >
              {CBSE_CHAPTERS.map((ch) => (
                <Command.Item
                  key={ch}
                  onSelect={() => go(`/questions?chapter=${encodeURIComponent(ch)}`)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  <BookOpen size={14} className="text-muted-foreground shrink-0" />
                  <span className="truncate">{ch}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading="Actions"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5 mt-1"
            >
              <Command.Item
                onSelect={handleQuickExport}
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
              >
                <FileDown size={15} />
                {exporting ? 'Preparing QR PDF…' : 'Export Complete Worksheet (QR PDF)'}
              </Command.Item>
              {onToggleTheme && (
                <Command.Item
                  onSelect={() => {
                    onToggleTheme();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-md cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  {dark ? <Sun size={15} /> : <Moon size={15} />}
                  Switch to {dark ? 'Light' : 'Dark'} Paper Theme
                </Command.Item>
              )}
            </Command.Group>
          </Command.List>

          <div className="px-4 py-2 border-t border-border bg-muted/40 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono">↵</kbd> Open</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono">Esc</kbd> Close</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;

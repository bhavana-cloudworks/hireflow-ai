import { Link, useLocation } from "wouter";
import { LayoutDashboard, Kanban, FileText, MessageSquare, BarChart3, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tracker", icon: Kanban, label: "Job Tracker" },
  { href: "/resume", icon: FileText, label: "Resume Optimizer" },
  { href: "/interview", icon: MessageSquare, label: "Interview Prep" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">HireFlow</span>
            <span className="text-xs text-primary font-medium ml-1">AI</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-background">
              B
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-medium text-foreground truncate">Bhavana</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

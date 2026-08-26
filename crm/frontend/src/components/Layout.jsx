import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  MapPin, 
  Sparkles, 
  Users, 
  UsersRound,
  Menu,
  X,
  Heart,
  Mail,
  Share2,
  Zap,
  FileText,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/leads", icon: Users, label: "Lead CRM" },
  { path: "/campaigns", icon: Mail, label: "Email Campaigns" },
  { path: "/automation", icon: Zap, label: "Automation" },
  { path: "/landing-pages", icon: FileText, label: "Landing Pages" },
  { path: "/platforms", icon: Globe, label: "Platform Hub" },
  { path: "/social", icon: Share2, label: "Social Capture" },
  { path: "/cities", icon: MapPin, label: "City Analytics" },
  { path: "/groups", icon: UsersRound, label: "Groups" },
  { path: "/content", icon: Sparkles, label: "AI Content" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-container" data-testid="app-layout">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="mobile-menu-btn"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "sidebar",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-semibold text-foreground text-lg">Youandinotai</h1>
              <p className="text-xs text-muted-foreground">Marketing Hub</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn("nav-item", isActive && "active")}
                onClick={() => setSidebarOpen(false)}
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-2">Lead Generation CRM</p>
            <p className="text-sm font-medium text-foreground">Automate. Convert. Grow.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" data-testid="main-content">
        <Outlet />
      </main>
    </div>
  );
}

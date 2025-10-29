import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, Menu, User, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "tenant" | "owner" | "admin";
  onBack?: () => void;
}

export const DashboardLayout = ({ children, role, onBack }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const getRoleName = () => {
    switch (role) {
      case "tenant":
        return "Tenant";
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      default:
        return "User";
    }
  };

  const getRolePath = () => {
    switch (role) {
      case "tenant":
        return "/tenant";
      case "owner":
        return "/owner";
      case "admin":
        return "/admin";
      default:
        return "/";
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    // Prefer in-app back; if no in-app history, go to the role dashboard
    const idx = (window.history.state && (window.history.state as any).idx) ?? 0;
    if (idx > 0) {
      navigate(-1);
    } else {
      navigate(getRolePath(), { replace: true });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate("/auth?tab=signin", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:text-primary/80 transition-colors">
              <Building2 className="w-6 h-6" />
              RentalHub
            </Link>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack} title="Back">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <ThemeToggle />
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{getRoleName()}</span>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/profile">Profile</Link>
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

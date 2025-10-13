import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Home, LogOut, Menu, User } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "tenant" | "owner" | "admin";
}

export const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
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
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{getRoleName()}</span>
              </div>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
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

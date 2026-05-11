import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CreditCard, 
  PieChart, 
  Target, 
  Settings, 
  LogOut,
  Wallet,
  HandCoins,
  Calculator,
  X,
  ArrowRightLeft,
  ChevronDown
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const logout = useStore((state) => state.logout);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose?.();
  }, [location]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, comingSoon: false },
    { href: "/transactions", label: "Transactions", icon: CreditCard, comingSoon: false },
    { href: "/money", label: "Money Transfer", icon: HandCoins, comingSoon: false },
    { href: "/converter", label: "Converter", icon: ArrowRightLeft, comingSoon: false },
    { href: "/tools", label: "Tools", icon: Calculator, comingSoon: false },
    { href: "/budget", label: "Budget", icon: PieChart, comingSoon: true },
    { href: "/goals", label: "Savings Goals", icon: Target, comingSoon: true },
    { href: "/settings", label: "Settings", icon: Settings, comingSoon: false },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      logout();
      navigate('/auth');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
      logout();
      navigate('/auth');
    }
  };

  const handleNavClick = useCallback((href: string) => {
    try {
      navigate(href);
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Navigation failed. Please try again.');
    }
  }, [navigate]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64 border-r bg-sidebar text-sidebar-foreground transition-transform duration-300",
        !isOpen && "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span>FinTrack</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

      <div className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <div key={item.href}>
              {item.comingSoon ? (
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium opacity-50 cursor-not-allowed transition-all duration-200"
                  )}
                  title="This feature is coming soon"
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    Soon
                  </Badge>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick(item.href)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                      : "text-sidebar-foreground/70"
                  )}
                >
                  <Icon className="h-4 w-4 transition-transform duration-200" />
                  {item.label}
                </button>
              )}
            </div>
          );
        })}
      </div>

        <div className="absolute bottom-4 left-0 right-0 px-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </aside>
    </>
  );
}

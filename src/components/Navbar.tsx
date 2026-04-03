import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Moon, Sun } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold gradient-text">AuditGen</span>
        </Link>

        <div className="flex items-center gap-4">
          {location.pathname !== "/audit" && (
            <Link
              to="/audit"
              className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Launch Audit
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;

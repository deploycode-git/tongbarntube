import { Link } from "react-router-dom";
import { Home, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center mb-8 opacity-0 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
            <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground ml-1" />
          </div>
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-bold text-primary mb-4 opacity-0 animate-fade-in stagger-1">
          404
        </h1>

        {/* Message */}
        <p className="text-2xl font-semibold mb-2 opacity-0 animate-fade-in stagger-2">
          Page Not Found
        </p>
        <p className="text-muted-foreground mb-8 opacity-0 animate-fade-in stagger-3">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Back Home */}
        <Button asChild variant="hero" size="lg" className="opacity-0 animate-fade-in stagger-4">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}

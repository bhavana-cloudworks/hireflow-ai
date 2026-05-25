import { Link } from "wouter";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96 gap-4">
      <div className="text-6xl font-bold text-muted-foreground/30">404</div>
      <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      <Link href="/">
        <Button className="gap-2 bg-primary text-primary-foreground">
          <Home className="w-4 h-4" />
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
}

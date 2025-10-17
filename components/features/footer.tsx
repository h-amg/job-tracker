import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 JobTracker. Track your job applications efficiently.</p>
          <div className="flex items-center gap-4">
            <Link
              href={"/about" as any}
              className="hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href={"/privacy" as any}
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href={"/help" as any}
              className="hover:text-foreground transition-colors"
            >
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

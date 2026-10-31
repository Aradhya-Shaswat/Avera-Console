import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">404</h1>
      <p className="text-sm text-muted">The requested page could not be found.</p>
      <Link
        href="/"
        className="px-4 py-2 text-xs font-medium rounded bg-foreground text-background hover:opacity-90 transition-opacity"
      >
        Return to Overview
      </Link>
    </div>
  );
}


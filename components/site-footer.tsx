import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} AI Spend Audit. Built for startup operators.</p>
        <div className="flex gap-4">
          <Link href="/audit" className="hover:text-foreground">
            Run audit
          </Link>
          <Link href="/#faq" className="hover:text-foreground">
            FAQ
          </Link>
          <a href="mailto:hello@credex.example" className="hover:text-foreground">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

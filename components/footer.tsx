import Link from "next/link";

type FooterProps = {
  admin?: boolean;
};

export function Footer({ admin = false }: FooterProps) {
  // Keep admin footer visually consistent with the public footer but slightly more compact
  const footerBase = admin
    ? "mt-1 border-t border-slate-200 bg-slate-50 py-4"
    : "mt-16 border-t border-slate-200 bg-slate-50 py-8";

  const textClass = "text-sm text-slate-700";
  const linkClass = "text-indigo-600 hover:text-indigo-500";

  // Admin uses the same centered container for consistent layout
  const containerClass = "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8";

  return (
    <footer className={footerBase}>
      <div className={containerClass}>
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p className={textClass}>
            Built with love by{" "}
            <a
              href="https://www.antonioarcher.com"
              className={linkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              Antonio Archer
            </a>
          </p>

          <div className="flex gap-4">
            <Link href="/" className={textClass}>Home</Link>
            <Link href="/admin" className={textClass}>Admin</Link>
            <a
              href="https://github.com/ad-archer/engine-proxy"
              className={textClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://hub.docker.com/r/adarcher/engine-proxy"
              className={textClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              Docker Hub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
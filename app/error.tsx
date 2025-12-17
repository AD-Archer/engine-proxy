"use client";

import { useEffect } from "react";
import ErrorPage from "@/components/error/error-page";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-slate-50 px-4 py-16">
        <ErrorPage
          title="Something went wrong"
          description="An unexpected error occurred. You can try again or head back to safety."
          primaryAction={{ label: "Try again", onClick: reset }}
          secondaryAction={{ label: "Go home", href: "/" }}
        />
        {error?.digest ? (
          <p className="mt-6 text-center text-xs text-slate-400">Error id: {error.digest}</p>
        ) : null}
      </body>
    </html>
  );
}

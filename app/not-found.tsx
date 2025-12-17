import ErrorPage from "@/components/error/error-page";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <ErrorPage
        title="Page not found"
        description="We could not find the page you were looking for. Check the URL or head back to a known spot."
        primaryAction={{ label: "Go home", href: "/" }}
        secondaryAction={{ label: "Admin dashboard", href: "/admin" }}
      />
    </div>
  );
}

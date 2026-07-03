"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="max-w-md rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-card">
          <h1 className="text-xl font-semibold text-neutral-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-neutral-600">{error.message}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

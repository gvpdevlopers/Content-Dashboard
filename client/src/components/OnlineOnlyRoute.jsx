import { Outlet } from "react-router-dom";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const OnlineOnlyRoute = () => {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-5 py-12 text-[var(--color-text-primary)]">
        <section className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-7 text-center shadow-[0_20px_70px_rgba(0,0,0,0.07)] sm:p-9">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Connection required
          </p>
          <h1 className="mt-4 text-2xl font-medium tracking-tight text-zinc-900">
            You're offline
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Connect to the internet to access your account and dashboard.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  return <Outlet />;
};

export default OnlineOnlyRoute;

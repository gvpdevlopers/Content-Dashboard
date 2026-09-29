import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

import { useOnlineStatus } from "../hooks/useOnlineStatus";

const NetworkStatus = () => {
  const isOnline = useOnlineStatus();
  const wasOnline = useRef(isOnline);

  useEffect(() => {
    if (isOnline && !wasOnline.current) {
      toast.success("You're back online.", { duration: 3500 });
    }

    wasOnline.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    let updateServiceWorker = () => Promise.resolve();

    updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        toast("A new version of Glow Ventures is ready.", {
          duration: 10000,
          action: {
            label: "Update",
            onClick: () => {
              void updateServiceWorker(true);
            },
          },
        });
      },
    });
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="fixed left-1/2 top-3 z-[130] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-xl border border-zinc-300 bg-white/95 px-4 py-3 text-center text-sm text-zinc-700 shadow-lg backdrop-blur"
      role="status"
      aria-live="polite"
    >
      You're offline. Some features require an internet connection.
    </div>
  );
};

export default NetworkStatus;

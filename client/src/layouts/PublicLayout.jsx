import { Outlet } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import PageTransition from "../components/public/PageTransition";

const PublicLayout = () => {
  return (
    <div className="public-page min-h-screen bg-[var(--color-page)] text-[var(--color-text-primary)]">
      <PublicHeader />

      <main>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
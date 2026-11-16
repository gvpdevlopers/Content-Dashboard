import { Outlet } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";
import "../styles/public.css";
import PageTransition from "../components/public/PageTransition";

const PublicLayout = () => {
  return (
    <div className="public-page min-h-screen bg-[var(--color-page)] text-[var(--color-text-primary)]">
      <a className="glow-skip" href="#public-main">Skip to content</a>
      <PublicHeader />

      <main id="public-main">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
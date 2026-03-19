import { FC } from "react";

import LegacyLandingPage from "./LandingPage.js";

interface LandingPageProps {
  className?: string;
}

const LandingPage: FC<LandingPageProps> = () => {
  return <LegacyLandingPage />;
};

export default LandingPage;

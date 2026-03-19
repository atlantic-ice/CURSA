import { FC } from "react";

import LegacyGuidelinesPage from "./GuidelinesPage.js";

interface GuidelinesPageProps {
  className?: string;
}

const GuidelinesPage: FC<GuidelinesPageProps> = () => {
  return <LegacyGuidelinesPage />;
};

export default GuidelinesPage;

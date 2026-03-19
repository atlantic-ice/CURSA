import { FC } from "react";

import LegacyCheckPage from "./CheckPage.js";

interface CheckPageProps {
  className?: string;
}

const CheckPage: FC<CheckPageProps> = () => {
  return <LegacyCheckPage />;
};

export default CheckPage;

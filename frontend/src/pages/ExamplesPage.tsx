import { FC } from "react";

import LegacyExamplesPage from "./ExamplesPage.js";

interface ExamplesPageProps {
  className?: string;
}

const ExamplesPage: FC<ExamplesPageProps> = () => {
  return <LegacyExamplesPage />;
};

export default ExamplesPage;

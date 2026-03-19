import { FC } from "react";

import LegacyHomePageLinear from "./HomePageLinear.js";

interface HomePageLinearProps {
  className?: string;
}

const HomePageLinear: FC<HomePageLinearProps> = () => {
  return <LegacyHomePageLinear />;
};

export default HomePageLinear;

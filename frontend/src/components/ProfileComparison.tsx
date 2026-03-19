import { FC } from "react";

import LegacyProfileComparison from "./ProfileComparison.js";

type ProfileComparisonProps = {
  className?: string;
  [key: string]: unknown;
};

const ProfileComparison: FC<ProfileComparisonProps> = (props) => {
  return <LegacyProfileComparison {...props} />;
};

export default ProfileComparison;

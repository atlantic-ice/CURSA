import { FC } from "react";

import LegacyProfileStatistics from "./ProfileStatistics.js";

type ProfileStatisticsProps = {
  className?: string;
  [key: string]: unknown;
};

const ProfileStatistics: FC<ProfileStatisticsProps> = (props) => {
  return <LegacyProfileStatistics {...props} />;
};

export default ProfileStatistics;

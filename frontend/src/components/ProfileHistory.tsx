import { FC } from "react";

import LegacyProfileHistory from "./ProfileHistory.js";

type ProfileHistoryProps = {
  className?: string;
  [key: string]: unknown;
};

const ProfileHistory: FC<ProfileHistoryProps> = (props) => {
  return <LegacyProfileHistory {...props} />;
};

export default ProfileHistory;

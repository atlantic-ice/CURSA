import { FC } from "react";

import LegacyProfileBulkOperations from "./ProfileBulkOperations.js";

type ProfileBulkOperationsProps = {
  className?: string;
  [key: string]: unknown;
};

const ProfileBulkOperations: FC<ProfileBulkOperationsProps> = (props) => {
  return <LegacyProfileBulkOperations {...props} />;
};

export default ProfileBulkOperations;

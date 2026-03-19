import { FC } from "react";

import LegacyProfileValidation from "./ProfileValidation.js";

type ProfileValidationProps = {
  className?: string;
  [key: string]: unknown;
};

const ProfileValidation: FC<ProfileValidationProps> = (props) => {
  return <LegacyProfileValidation {...props} />;
};

export default ProfileValidation;

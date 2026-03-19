import { FC } from "react";

import LegacyProfileImportExport from "./ProfileImportExport.js";

type ProfileImportExportProps = {
  className?: string;
  [key: string]: unknown;
};

const ProfileImportExport: FC<ProfileImportExportProps> = (props) => {
  return <LegacyProfileImportExport {...props} />;
};

export default ProfileImportExport;

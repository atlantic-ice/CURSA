import { FC } from "react";

import LegacyProfileEditor from "./ProfileEditor.js";

type ProfileEditorProps = {
  className?: string;
  [key: string]: unknown;
};

const ProfileEditor: FC<ProfileEditorProps> = (props) => {
  return <LegacyProfileEditor {...props} />;
};

export default ProfileEditor;

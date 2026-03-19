import { FC } from "react";

import LegacyDocumentViewer from "./DocumentViewer.js";

type DocumentViewerProps = {
  className?: string;
  [key: string]: unknown;
};

const DocumentViewer: FC<DocumentViewerProps> = (props) => {
  return <LegacyDocumentViewer {...props} />;
};

export default DocumentViewer;

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import DocumentViewer from "../DocumentViewer";
import ProfileBulkOperations from "../ProfileBulkOperations";
import ProfileComparison from "../ProfileComparison";
import ProfileEditor from "../ProfileEditor";
import ProfileHistory from "../ProfileHistory";
import ProfileImportExport from "../ProfileImportExport";
import ProfileStatistics from "../ProfileStatistics";
import ProfileValidation from "../ProfileValidation";

jest.mock("../DocumentViewer.js", () => ({
  __esModule: true,
  default: () => <div>Legacy document viewer</div>,
}));

jest.mock("../ProfileBulkOperations.js", () => ({
  __esModule: true,
  default: () => <div>Legacy profile bulk operations</div>,
}));

jest.mock("../ProfileComparison.js", () => ({
  __esModule: true,
  default: () => <div>Legacy profile comparison</div>,
}));

jest.mock("../ProfileEditor.js", () => ({
  __esModule: true,
  default: () => <div>Legacy profile editor</div>,
}));

jest.mock("../ProfileHistory.js", () => ({
  __esModule: true,
  default: () => <div>Legacy profile history</div>,
}));

jest.mock("../ProfileImportExport.js", () => ({
  __esModule: true,
  default: () => <div>Legacy profile import export</div>,
}));

jest.mock("../ProfileStatistics.js", () => ({
  __esModule: true,
  default: () => <div>Legacy profile statistics</div>,
}));

jest.mock("../ProfileValidation.js", () => ({
  __esModule: true,
  default: () => <div>Legacy profile validation</div>,
}));

describe("LegacyBridgeWrappers", () => {
  test("renders DocumentViewer bridge", () => {
    render(<DocumentViewer />);

    expect(screen.getByText(/legacy document viewer/i)).toBeInTheDocument();
  });

  test("renders profile bridges", () => {
    render(
      <>
        <ProfileBulkOperations />
        <ProfileComparison />
        <ProfileEditor />
        <ProfileHistory />
        <ProfileImportExport />
        <ProfileStatistics />
        <ProfileValidation />
      </>,
    );

    expect(screen.getByText(/legacy profile bulk operations/i)).toBeInTheDocument();
    expect(screen.getByText(/legacy profile comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/legacy profile editor/i)).toBeInTheDocument();
    expect(screen.getByText(/legacy profile history/i)).toBeInTheDocument();
    expect(screen.getByText(/legacy profile import export/i)).toBeInTheDocument();
    expect(screen.getByText(/legacy profile statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/legacy profile validation/i)).toBeInTheDocument();
  });
});

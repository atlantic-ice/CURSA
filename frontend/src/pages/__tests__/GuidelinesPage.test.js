import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import GuidelinesPage from "../GuidelinesPage";

jest.mock("../GuidelinesPage.js", () => ({
  __esModule: true,
  default: () => <div>Legacy guidelines page</div>,
}));

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true },
);

describe("GuidelinesPage", () => {
  test("renders TypeScript wrapper for legacy guidelines page", () => {
    render(<GuidelinesPage />);

    expect(screen.getByText(/legacy guidelines page/i)).toBeInTheDocument();
  });
});

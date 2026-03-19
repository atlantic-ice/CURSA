import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import LandingPage from "../LandingPage";

jest.mock("../LandingPage.js", () => ({
  __esModule: true,
  default: () => <div>Legacy landing page</div>,
}));

describe("LandingPage", () => {
  test("renders TypeScript wrapper for legacy landing page", () => {
    render(<LandingPage />);

    expect(screen.getByText(/legacy landing page/i)).toBeInTheDocument();
  });
});

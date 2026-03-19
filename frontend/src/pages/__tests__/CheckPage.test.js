import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import CheckPage from "../CheckPage";

jest.mock("../CheckPage.js", () => ({
  __esModule: true,
  default: () => <div>Legacy check page</div>,
}));

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true },
);

describe("CheckPage", () => {
  test("renders TypeScript wrapper for legacy check page", () => {
    render(<CheckPage />);

    expect(screen.getByText(/legacy check page/i)).toBeInTheDocument();
  });
});

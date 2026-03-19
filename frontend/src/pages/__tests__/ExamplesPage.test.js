import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import ExamplesPage from "../ExamplesPage";

jest.mock("../ExamplesPage.js", () => ({
  __esModule: true,
  default: () => <div>Legacy examples page</div>,
}));

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true },
);

describe("ExamplesPage", () => {
  test("renders TypeScript wrapper for legacy examples page", () => {
    render(<ExamplesPage />);

    expect(screen.getByText(/legacy examples page/i)).toBeInTheDocument();
  });
});

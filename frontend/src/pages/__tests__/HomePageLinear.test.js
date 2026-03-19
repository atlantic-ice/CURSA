import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import HomePageLinear from "../HomePageLinear";

jest.mock("../HomePageLinear.js", () => ({
  __esModule: true,
  default: () => <div>Legacy home page linear</div>,
}));

describe("HomePageLinear", () => {
  test("renders TypeScript wrapper for legacy linear home page", () => {
    render(<HomePageLinear />);

    expect(screen.getByText(/legacy home page linear/i)).toBeInTheDocument();
  });
});

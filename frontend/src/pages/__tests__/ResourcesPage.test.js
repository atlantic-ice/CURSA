import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import ResourcesPage from "../ResourcesPage";

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true },
);

describe("ResourcesPage", () => {
  test("renders resource catalog content", () => {
    render(<ResourcesPage />);

    expect(
      screen.getByText(/полезные ресурсы для подготовки и проверки документов/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/найти нужный источник/i)).toBeInTheDocument();
    expect(screen.getByText(/гост 7\.32-2017/i)).toBeInTheDocument();
    expect(screen.getByText(/каталог ресурсов/i)).toBeInTheDocument();
  });
});

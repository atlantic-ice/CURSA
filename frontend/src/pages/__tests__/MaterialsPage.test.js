import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import MaterialsPage from "../MaterialsPage";

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true },
);

describe("MaterialsPage", () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  test("renders CURSA materials dashboard content", () => {
    render(<MaterialsPage />);

    expect(
      screen.getByText(/библиотека шаблонов, чек-листов и методических материалов/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/популярность библиотеки/i)).toBeInTheDocument();
    expect(screen.getByText(/подборка материалов/i)).toBeInTheDocument();
    expect(screen.getByText(/шаблон курсовой по гост 7\.32-2017/i)).toBeInTheDocument();
  });
});

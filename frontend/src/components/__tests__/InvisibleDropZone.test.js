import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import InvisibleDropZone from "../InvisibleDropZone";
import { renderWithProviders } from "./utils/test-utils";

jest.mock("../DropZone", () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid="dropzone-mock">
      {typeof children === "function"
        ? children({ isDragActive: false, isDragReject: false })
        : children}
    </div>
  ),
}));

// Импортируем моки при необходимости
// import { ColorModeContext } from './utils/test-utils';

describe("InvisibleDropZone", () => {
  test("рендерится без ошибок", () => {
    renderWithProviders(<InvisibleDropZone />);

    expect(screen.getByTestId("dropzone-mock")).toBeInTheDocument();
  });
});

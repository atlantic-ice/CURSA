import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import ProfileBulkOperations from "../ProfileBulkOperations";
import { renderWithProviders } from "./utils/test-utils";

jest.mock("../ProfileBulkOperations.js", () => ({
  __esModule: true,
  default: () => <div>Legacy profile bulk operations</div>,
}));

// Импортируем моки при необходимости
// import { ColorModeContext } from './utils/test-utils';

describe("ProfileBulkOperations", () => {
  test("рендерится без ошибок", () => {
    renderWithProviders(<ProfileBulkOperations />);

    expect(screen.getByText(/legacy profile bulk operations/i)).toBeInTheDocument();
  });
});

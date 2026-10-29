// Le badge indique si les données viennent de l'API Express ou des fichiers locaux
import { render, screen } from "@testing-library/react";
import DataSource from "@/components/DataSource";

test("badge API quand les données viennent de l'API", () => {
  render(<DataSource source="api" />);
  expect(screen.getByText(/API Express/)).toHaveClass("source-api");
});

test("badge de repli quand l'API est indisponible", () => {
  render(<DataSource source="local" />);
  expect(screen.getByText(/données locales/)).toHaveClass("source-local");
});

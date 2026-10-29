// Tests du composant Header (étape 57)
import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";

describe("Header", () => {
  test("affiche le nom et les liens vers chaque section", () => {
    render(<Header />);
    expect(screen.getByText("Amal Jemli")).toBeInTheDocument();
    for (const section of ["About", "Skills", "Projects", "Contact"]) {
      expect(screen.getByRole("link", { name: section })).toBeInTheDocument();
    }
  });
});

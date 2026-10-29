// Tests du formulaire de contact (étapes 57 et 59) : l'appel à l'API est simulé.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Contact from "@/components/Contact";

function reponse(status, corps) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(corps) });
}

async function remplir(user, { name = "Amal", email = "amal@example.com", message = "Bonjour, message de test." } = {}) {
  await user.type(screen.getByLabelText("Nom"), name);
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Message"), message);
  await user.click(screen.getByRole("button", { name: "Envoyer" }));
}

beforeEach(() => {
  global.fetch = jest.fn();
});

test("envoie le message en JSON à POST /api/contact et confirme l'envoi", async () => {
  fetch.mockReturnValue(reponse(201, { success: true }));
  const user = userEvent.setup();
  render(<Contact />);

  await remplir(user);

  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:4000/api/contact",
    expect.objectContaining({ method: "POST" })
  );
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    name: "Amal",
    email: "amal@example.com",
    message: "Bonjour, message de test.",
  });
  expect(await screen.findByRole("status")).toHaveTextContent("enregistré");
  expect(screen.getByLabelText("Nom")).toHaveValue("");
});

test("affiche les erreurs de validation renvoyées par l'API (400)", async () => {
  fetch.mockReturnValue(
    reponse(400, { success: false, errors: [{ field: "email", message: "L'adresse email est invalide" }] })
  );
  const user = userEvent.setup();
  render(<Contact />);

  await remplir(user);

  expect(await screen.findByRole("status")).toHaveTextContent("L'adresse email est invalide");
});

test("affiche le message du rate limiting (429)", async () => {
  fetch.mockReturnValue(reponse(429, { success: false, message: "Trop de requêtes." }));
  const user = userEvent.setup();
  render(<Contact />);

  await remplir(user);

  expect(await screen.findByRole("status")).toHaveTextContent("Trop de requêtes.");
});

test("prévient l'utilisateur si l'API est injoignable", async () => {
  fetch.mockRejectedValue(new TypeError("Failed to fetch"));
  const user = userEvent.setup();
  render(<Contact />);

  await remplir(user);

  expect(await screen.findByRole("status")).toHaveTextContent("Impossible de contacter l'API");
});

test("le navigateur bloque l'envoi si un champ obligatoire est vide", async () => {
  const user = userEvent.setup();
  render(<Contact />);

  await user.type(screen.getByLabelText("Nom"), "Amal");
  await user.click(screen.getByRole("button", { name: "Envoyer" }));

  expect(screen.getByLabelText("Email")).toBeInvalid();
  expect(fetch).not.toHaveBeenCalled();
});

// Tests unitaires de l'intégration AWS/Floci (Activité 6, étape 114) : le SDK est simulé.
import { jest, describe, test, expect, beforeEach } from "@jest/globals";

const send = jest.fn();
class FauxClient { send = send; }
jest.unstable_mockModule("@aws-sdk/client-sqs", () => ({
  SQSClient: FauxClient,
  CreateQueueCommand: class { constructor(input) { this.type = "CreateQueue"; this.input = input; } },
  SendMessageCommand: class { constructor(input) { this.type = "SendMessage"; this.input = input; } },
}));
jest.unstable_mockModule("@aws-sdk/client-s3", () => ({
  S3Client: FauxClient,
  CreateBucketCommand: class { constructor(input) { this.type = "CreateBucket"; this.input = input; } },
  PutObjectCommand: class { constructor(input) { this.type = "PutObject"; this.input = input; } },
}));

const { publierContact } = await import("../src/lib/aws.js");
const contact = { id: 7, name: "Amal", email: "amal@example.test", message: "Bonjour", createdAt: new Date() };

beforeEach(() => {
  send.mockReset();
  send.mockImplementation(async (cmd) => (cmd.type === "CreateQueue" ? { QueueUrl: "http://floci/000/q" } : {}));
  delete process.env.CONTACT_QUEUE_NAME;
  delete process.env.CONTACT_BUCKET;
});

describe("publierContact", () => {
  test("ne fait rien si Floci/AWS n'est pas configuré", async () => {
    await expect(publierContact(contact)).resolves.toEqual({ sqs: false, s3: false });
    expect(send).not.toHaveBeenCalled();
  });

  test("envoie une notification SQS sans email et une archive S3 complète", async () => {
    process.env.CONTACT_QUEUE_NAME = "contact-notifications";
    process.env.CONTACT_BUCKET = "devsecops-contacts";
    await expect(publierContact(contact)).resolves.toEqual({ sqs: true, s3: true });

    const message = send.mock.calls.map(([c]) => c).find((c) => c.type === "SendMessage");
    expect(JSON.parse(message.input.MessageBody)).toMatchObject({ type: "nouveau-contact", id: 7 });
    expect(message.input.MessageBody).not.toContain(contact.email);

    const objet = send.mock.calls.map(([c]) => c).find((c) => c.type === "PutObject");
    expect(objet.input).toMatchObject({ Bucket: "devsecops-contacts", Key: "contacts/7.json" });
  });

  test("une panne AWS n'empêche pas la réponse (traitement secondaire)", async () => {
    process.env.CONTACT_QUEUE_NAME = "contact-notifications";
    send.mockRejectedValue(Object.assign(new Error("connexion refusée"), { name: "NetworkingError" }));
    const erreur = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(publierContact(contact)).resolves.toEqual({ sqs: false, s3: false });
    expect(erreur).toHaveBeenCalled();
    erreur.mockRestore();
  });
});

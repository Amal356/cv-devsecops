// Test d'intégration API -> Floci (Activité 6, étape 116) : SQS + S3, sans compte AWS.
// PostgreSQL est remplacé par un faux Prisma : seul le chemin vers Floci est testé.
// Prérequis : Floci sur http://localhost:4566 (service container dans GitHub Actions)
//   cd api && npm run test:floci
import { jest, describe, test, expect } from "@jest/globals";

process.env.AWS_ENDPOINT_URL ||= "http://localhost:4566";
process.env.AWS_REGION ||= "us-east-1";
process.env.AWS_ACCESS_KEY_ID ||= "test";
process.env.AWS_SECRET_ACCESS_KEY ||= "test";
const suffixe = Date.now();
process.env.CONTACT_QUEUE_NAME = `contact-test-${suffixe}`;
process.env.CONTACT_BUCKET = `contact-test-${suffixe}`;
process.env.CONTACT_RATE_LIMIT = "1000";

const create = jest.fn(async ({ data }) => ({ id: 42, createdAt: new Date("2026-11-04T12:00:00Z"), ...data }));
jest.unstable_mockModule("../../src/lib/prisma.js", () => ({ default: { contact: { create } } }));

const { default: request } = await import("supertest");
const { default: app } = await import("../../src/app.js");
const { SQSClient, GetQueueUrlCommand, ReceiveMessageCommand } = await import("@aws-sdk/client-sqs");
const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");

const config = { region: process.env.AWS_REGION, endpoint: process.env.AWS_ENDPOINT_URL };
const sqs = new SQSClient(config);
const s3 = new S3Client({ ...config, forcePathStyle: true });

const contact = {
  name: "Test Floci",
  email: "floci@example.test",
  message: "Message envoyé pendant le test d'intégration Floci.",
};

describe("POST /api/contact -> Floci (SQS + S3)", () => {
  test("le message est enregistré, notifié dans SQS et archivé dans S3", async () => {
    const res = await request(app).post("/api/contact").send(contact);
    expect(res.status).toBe(201);
    expect(res.body.data.notification).toEqual({ sqs: true, s3: true });

    // SQS : la notification contient l'identifiant, sans l'adresse email
    const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: process.env.CONTACT_QUEUE_NAME }));
    const { Messages } = await sqs.send(new ReceiveMessageCommand({ QueueUrl, WaitTimeSeconds: 2 }));
    expect(Messages).toHaveLength(1);
    const notification = JSON.parse(Messages[0].Body);
    expect(notification).toMatchObject({ type: "nouveau-contact", id: 42, name: contact.name });
    expect(Messages[0].Body).not.toContain(contact.email);

    // S3 : l'archive JSON contient le message complet
    const objet = await s3.send(new GetObjectCommand({ Bucket: process.env.CONTACT_BUCKET, Key: "contacts/42.json" }));
    const archive = JSON.parse(await objet.Body.transformToString());
    expect(archive).toMatchObject(contact);
  });
});

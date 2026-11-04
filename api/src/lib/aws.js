// Intégration AWS / Floci (Activité 6, étape 114)
// POST /api/contact -> Express -> SQS (notification) + S3 (archive JSON du message)
//
// Configuration par variables d'environnement :
//   AWS_ENDPOINT_URL    http://floci:4566 avec Floci ; absent sur le vrai AWS
//   AWS_REGION          us-east-1 par défaut
//   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY : lus automatiquement par le SDK (fictifs avec Floci)
//   CONTACT_QUEUE_NAME  file SQS des notifications (désactivé si absent)
//   CONTACT_BUCKET      bucket S3 des archives      (désactivé si absent)
// Sans CONTACT_QUEUE_NAME ni CONTACT_BUCKET, l'API fonctionne exactement comme avant.
import { SQSClient, CreateQueueCommand, SendMessageCommand } from "@aws-sdk/client-sqs";
import { S3Client, CreateBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";

let clients;
let queueUrl;
let bucketPret;

function getClients() {
  if (!clients) {
    const config = { region: process.env.AWS_REGION || "us-east-1" };
    if (process.env.AWS_ENDPOINT_URL) config.endpoint = process.env.AWS_ENDPOINT_URL;
    clients = {
      sqs: new SQSClient(config),
      // Style « chemin » (http://floci:4566/bucket/cle) : nécessaire avec un endpoint local
      s3: new S3Client({ ...config, forcePathStyle: true }),
    };
  }
  return clients;
}

// La file et le bucket sont créés au premier usage (opérations idempotentes).
// En production, ils seraient créés par Terraform (partie 23).
function getQueueUrl() {
  queueUrl ??= getClients()
    .sqs.send(new CreateQueueCommand({ QueueName: process.env.CONTACT_QUEUE_NAME }))
    .then((r) => r.QueueUrl)
    .catch((err) => {
      queueUrl = undefined;
      throw err;
    });
  return queueUrl;
}

function preparerBucket() {
  bucketPret ??= getClients()
    .s3.send(new CreateBucketCommand({ Bucket: process.env.CONTACT_BUCKET }))
    .catch((err) => {
      if (["BucketAlreadyOwnedByYou", "BucketAlreadyExists"].includes(err.name)) return;
      bucketPret = undefined;
      throw err;
    });
  return bucketPret;
}

// Publie un message de contact déjà enregistré dans PostgreSQL.
// Les erreurs AWS sont journalisées mais ne font pas échouer la requête :
// le message est déjà sauvegardé, la notification est un traitement secondaire.
export async function publierContact(contact) {
  const resultat = { sqs: false, s3: false };
  const { CONTACT_QUEUE_NAME, CONTACT_BUCKET } = process.env;
  if (!CONTACT_QUEUE_NAME && !CONTACT_BUCKET) return resultat;

  const { sqs, s3 } = getClients();
  const taches = [];

  if (CONTACT_QUEUE_NAME) {
    taches.push(
      (async () => {
        await sqs.send(
          new SendMessageCommand({
            QueueUrl: await getQueueUrl(),
            MessageBody: JSON.stringify({
              type: "nouveau-contact",
              id: contact.id,
              name: contact.name,
              createdAt: contact.createdAt,
            }),
          }),
        );
        resultat.sqs = true;
      })(),
    );
  }

  if (CONTACT_BUCKET) {
    taches.push(
      (async () => {
        await preparerBucket();
        await s3.send(
          new PutObjectCommand({
            Bucket: CONTACT_BUCKET,
            Key: `contacts/${contact.id}.json`,
            Body: JSON.stringify(contact, null, 2),
            ContentType: "application/json",
          }),
        );
        resultat.s3 = true;
      })(),
    );
  }

  for (const r of await Promise.allSettled(taches)) {
    if (r.status === "rejected") console.error(`AWS/Floci indisponible : ${r.reason?.name ?? r.reason}`);
  }
  return resultat;
}

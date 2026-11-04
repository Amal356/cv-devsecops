// Activité 6, étape 133 : la même ressource qu'avec Terraform, mais écrite en TypeScript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const floci = "http://localhost:4566";
const environnement = pulumi.getStack(); // nom de la stack Pulumi : dev

// Provider AWS explicite, dirigé vers Floci (identifiants lus dans le profil AWS CLI « floci »)
const fournisseur = new aws.Provider("floci", {
  region: "us-east-1",
  profile: "floci",
  skipCredentialsValidation: true,
  skipMetadataApiCheck: true,
  skipRequestingAccountId: true,
  s3UsePathStyle: true,
  endpoints: [{ s3: floci, sts: floci }],
});

// Un vrai langage : une boucle crée un bucket par usage, avec les mêmes protections
const usages = ["archives", "pieces-jointes"];

const buckets = usages.map((usage) => {
  const bucket = new aws.s3.Bucket(
    usage,
    {
      bucket: `devsecops-pulumi-${environnement}-${usage}`,
      forceDestroy: true,
      tags: { projet: "devsecops-portfolio", gere_par: "pulumi", environnement },
    },
    { provider: fournisseur },
  );

  new aws.s3.BucketPublicAccessBlock(
    `${usage}-public`,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    { provider: fournisseur },
  );

  return bucket;
});

export const nomsDesBuckets = buckets.map((b) => b.bucket);

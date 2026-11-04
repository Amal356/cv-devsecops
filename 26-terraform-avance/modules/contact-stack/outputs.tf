output "bucket_contacts" {
  description = "Nom du bucket S3 des archives"
  value       = aws_s3_bucket.contacts.bucket
}

output "file_notifications" {
  description = "URL de la file SQS des notifications"
  value       = aws_sqs_queue.notifications.url
}

output "table_contacts" {
  description = "Nom de la table DynamoDB"
  value       = aws_dynamodb_table.contacts.name
}

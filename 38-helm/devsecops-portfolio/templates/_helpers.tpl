{{/* Labels communs à toutes les ressources du chart */}}
{{- define "portfolio.labels" -}}
app.kubernetes.io/part-of: devsecops-portfolio
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/* Contexte de sécurité du Pod (PSS restricted, Kyverno) */}}
{{- define "portfolio.podSecurity" -}}
serviceAccountName: {{ .Values.serviceAccountName }}
automountServiceAccountToken: false
{{- with .Values.imagePullSecrets }}
imagePullSecrets:
  {{- toYaml . | nindent 2 }}
{{- end }}
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  seccompProfile: { type: RuntimeDefault }
{{- end }}

{{/* Contexte de sécurité du conteneur */}}
{{- define "portfolio.containerSecurity" -}}
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities: { drop: ["ALL"] }
{{- end }}

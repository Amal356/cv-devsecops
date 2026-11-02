// Conventional Commits (étape 82) : <type>(<portée facultative>): <description>
// Types acceptés : feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Les messages sont en français : pas de contrainte de casse sur la description
    "subject-case": [0],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};

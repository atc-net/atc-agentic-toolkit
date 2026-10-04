---
name: dataverse-security
description: >
  Dataverse access management with PAC CLI: assigning security roles to users and
  application users, business units, batch role grants across environments, verifying
  assignments, and tenant admin self-elevation.
  USE FOR: give someone access, assign security role, grant System Administrator,
  become admin, application user, service principal access, business unit,
  pac admin assign-user, pac admin self-elevate, verify role assignment, roles across all environments.
  DO NOT USE FOR: tables, columns, relationships (use dataverse-metadata), org settings,
  audit, bulk delete, retention (use dataverse-admin), queries (use dataverse-query),
  record writes (use dataverse-data), solution deployment (use dataverse-solution).
---

# Dataverse Security and Access

Assign security roles, grant application users access, and self-elevate as tenant admin. Use first-party CLIs only: **PAC CLI** changes roles, the **Dataverse CLI** verifies them. Do not write Python scripts for role operations.

## When to use

| Need | Use instead |
| --- | --- |
| Create or modify tables, columns, relationships | `dataverse-metadata` |
| Org settings, audit, bulk delete, retention | `dataverse-admin` |
| Query or read records | `dataverse-query` |
| Create, update, or delete records | `dataverse-data` |
| Tenant-level governance (DLP, environment lifecycle) | `pac admin --help` |

## Prerequisites

- PAC CLI installed and authenticated (`pac auth create`); check the active profile with `pac auth list`
- System Administrator in the target environment — or Global Admin, Power Platform Admin, or Dynamics 365 Admin for self-elevation
- Dataverse CLI signed in (`dataverse auth create`) for verification

---

## Preview before running

Role grants and self-elevation change security posture and are logged to Microsoft Purview. Before running anything, preview the action **in plain prose** — target user, role, environment(s) — with placeholders (`<ENV_URL>`, `<USER_EMAIL>`) for unknowns, and ask for confirmation and missing values **in the same turn**. Don't show the raw `pac admin` command; the user shouldn't need to read CLI syntax to approve a security change.

The user must be able to judge what will happen from your first response. A bare "which environment?" fails that test; a one-line preview passes it.

| Scenario | Weak response | Good response |
| --- | --- | --- |
| Assign a role, environment missing | "Which environment should I target?" | "I'll assign **System Administrator** to `user@contoso.com` on `<ENV_URL>`. Confirm to proceed and give the environment URL (or 'all' to list and batch)." |
| Admin access on every environment | "Please provide your email address." | "I'll list your environments and assign **System Administrator** to `<YOUR_UPN>` on each in parallel. If `assign-user` fails anywhere, I'll stop and offer self-elevation (logged to Purview) for that environment. Confirm to proceed and give your UPN." |

---

## Assign a security role

```bash
pac admin assign-user --user <email-or-object-id> --role "System Administrator" --environment <url>
```

| Argument | Alias | Required | Description |
| --- | --- | --- | --- |
| `--user` | `-u` | Yes | User email (UPN) or Microsoft Entra object ID |
| `--role` | `-r` | Yes | Security role name (for example `System Administrator`, `Basic User`) |
| `--environment` | `-env` | Yes | Target environment URL or ID |
| `--application-user` | `-au` | No | Treat the user as an application user (service principal) |
| `--business-unit` | `-bu` | No | Business unit ID; defaults to the caller's business unit |

## Verify the assignment — exit code 0 is not proof

`pac admin assign-user` **exits 0 even when it fails** (unresolved environment, wrong role name, unknown user).

1. **Read the output, not the exit code.** A failed run prints an error such as `environment ... not found` or `role ... does not exist`. Stop if you see one.
2. **Query against the exact `--environment` you used.** Don't re-resolve or shorten it — a different ID silently "succeeds" against the wrong org.

```bash
# Resolve the user's systemuserid
dataverse api request --target dataverse --method GET \
  --path "/api/data/v9.2/systemusers?%24select=systemuserid&%24filter=internalemailaddress eq 'user@contoso.com'" \
  --environment <same-url-as-assign>

# List the user's assigned roles
dataverse api request --target dataverse --method GET \
  --path "/api/data/v9.2/systemusers(<systemuserid>)/systemuserroles_association?%24select=name" \
  --environment <same-url-as-assign>
```

- **No user row?** The sign-in identity may be on `domainname` (the Entra UPN) rather than `internalemailaddress` (primary email). Retry with `%24filter=domainname eq '<upn>'`, or `azureactivedirectoryobjectid eq '<objectid>'` if you assigned by object ID. A missing row is not proof the grant failed.
- **Role absent?** The assignment did not take. Re-run, read the output, or offer self-elevation (below).

---

## Batch: assign a role across environments

1. `pac admin list` — get all environments.
2. Filter by type if needed (for example Developer, Sandbox).
3. **Show the target list and get confirmation.**
4. Run all assignments **in parallel** in a single shell call — never sequentially:

   ```bash
   pac admin assign-user --user user@contoso.com --role "System Administrator" --environment https://contoso-dev.crm.dynamics.com &
   pac admin assign-user --user user@contoso.com --role "System Administrator" --environment https://contoso-test.crm.dynamics.com &
   pac admin assign-user --user user@contoso.com --role "System Administrator" --environment https://contoso-uat.crm.dynamics.com &
   wait
   ```

5. Verify each one landed (see above), then report, for example "Assigned and verified on 3/3 environments".

---

## Tenant admin self-elevation (fallback)

Self-elevation is materially different from assigning a role to someone else: `pac admin assign-user <other>` grants privilege **to another user**, while `pac admin self-elevate` grants privilege **to the caller**. The risk and audit posture differ, so the confirmation protocol is stricter.

Use it when `pac admin assign-user` fails with "user has not been assigned any roles":

```bash
pac admin self-elevate --environment https://contoso.crm.dynamics.com
```

- Requires Global Admin, Power Platform Admin, or Dynamics 365 Admin
- Every elevation is logged to Microsoft Purview
- Uses the active auth profile when `--environment` is omitted

### Confirmation protocol

Before running `pac admin self-elevate` you MUST:

1. **State the risk explicitly**, for example: "This grants YOU System Administrator on `<env>`. The action is logged to Microsoft Purview with your identity and timestamp."
2. **Capture a reason** — a ticket ID, incident number, or free-form note such as "dev sandbox access - no ticket". Echo it back in the pre-run summary so the user sees what goes on the record.
3. **Wait for explicit confirmation after both (1) and (2) are on screen.** A "yes" given earlier does not count.
4. **Never chain automatically.** If `assign-user` fails, surface the failure first, then offer self-elevation under this protocol.

### If the CLI command fails

Self-elevate in the **Power Platform admin center**: select the environment, then **Access**, then **System Administrator role**. This is still logged to Purview. Known issue: PAC CLI 2.6.4 fails with `bolt.authentication.http.AuthenticatedClientException` / `ApiVersionInvalid` because it sends an empty `api-version=` to the backend.

---

## Safety rules

- **Always confirm** before assigning System Administrator.
- Show the full list of target environments before any batch operation.
- Treat exit code 0 as meaningless — verify every assignment with a query.
- Try `assign-user` first; self-elevation is a gated fallback, never automatic.
- Warn the user that self-elevation is logged and auditable.

---
name: dataverse-admin
description: >
  Environment-level Microsoft Dataverse administration: bulk delete, retention and archival,
  organization settings, OrgDB settings, recycle bin, audit, and a hard allowlist of 37 Power
  Platform admin center toggles.
  USE FOR: bulk delete records, schedule bulk delete job, cancel or pause bulk delete, data retention
  policy, archive old records, enable auditing, audit retention, plugin trace log, org settings,
  pac org update-settings, OrgDB settings, enable MCP server, Dataverse search, TDS endpoint,
  recycle bin on or off, recycle bin cleanup days, app-level security roles toggle, multi-environment
  settings rollout.
  DO NOT USE FOR: record CRUD or sample data (use dataverse-data), tables and columns
  (use dataverse-metadata), reading records (use dataverse-query), solution export or import
  (use dataverse-solution), security roles and self-elevate (use dataverse-security).
---

# Dataverse Admin

Environment administration through PAC CLI and the Python SDK: bulk delete, retention, org
settings, OrgDB settings, recycle bin, and settings-definition overrides.

## Safety rules

Read these before running anything.

1. **Bulk delete is irreversible and bypasses the recycle bin.** `pac data bulk-delete schedule`
   without `--fetchxml` deletes every record in the table. Refuse until the user explicitly says
   **ALL** (or **ALL RECORDS**) **and** names the entity logical name, e.g.
   `"yes, delete ALL records in contact"`. A bare `"yes"` is rejected. Empty-filter FetchXML does
   not bypass this gate. See [Bulk delete](#bulk-delete).
2. **The settings allowlist is hard.** Only the 37 toggles in
   [Allowed settings](#allowed-settings-hard-allowlist) may be read or updated. Refuse anything else
   with: *"That setting is out of scope for dataverse-admin. Use the Power Platform admin center."*
3. **Disable the recycle bin with PATCH, never DELETE.** PATCH `statecode=1, statuscode=2,
   isreadyforrecyclebin=false`. DELETE enqueues an async opt-out and orphans per-entity configs. See
   [references/recycle-bin.md](references/recycle-bin.md).
4. **System tables.** Unfiltered bulk delete on `systemuser`, `businessunit`, `organization`, or
   `role` breaks the environment. Warn explicitly before running.

Also:

- Confirm before changing org settings that affect all users.
- For multi-environment updates, list the target environments and get confirmation first.
- For OrgDB settings, warn that incorrect values can break environment features.
- When reducing the recycle bin cleanup interval, warn that recycled records are purged sooner.
- On recycle bin enable/disable, always set `isreadyforrecyclebin` explicitly (`true` on enable,
  `false` on disable) and drain in-flight `ProcessRecycleBin` async jobs before any second toggle.
  Skipping this can cause `EntityBinUpdateAction called for entity <x> which is not enabled for
  RecycleBin` on unrelated platform operations.

## When to use

| Need | Use instead |
|---|---|
| Record CRUD or sample data | `dataverse-data` |
| Tables, columns, relationships | `dataverse-metadata` |
| Reading records | `dataverse-query` |
| Solution export/import | `dataverse-solution` |
| Security roles, self-elevate | `dataverse-security` |
| Tenant governance (DLP, environment lifecycle) | `pac admin --help` |

## Prerequisites

- PAC CLI **.NET Framework build** (latest). `pac data bulk-delete` and `pac data retention` exist
  only in that build, not in the `dotnet tool` version. If `pac help` reports `.NET 10` or `.NET 8`,
  run `pac install latest && pac use latest`.
- Authenticated (`pac auth create`) with an active profile (`pac auth list`).
- System Administrator privilege on the target environment.

---

## Pick the mechanism

| Mechanism | Covers | How |
|---|---|---|
| **PAC CLI** (`pac org list-settings` / `update-settings`) | Columns on the `organization` entity: audit, plugin trace, typeahead, quick find, canvas/flow solution defaults, email validation, audit retention | `--name <column> --value <value>`; accepts any org column |
| **Python SDK: OrgDB XML** | Keys in the `orgdborgsettings` XML blob: MCP, search, Fabric, Work IQ, TDS endpoint, attachment security, ownership, address records, unmanaged lockdown, user delete, Excel AI mapping | Read XML, parse, modify, write the whole blob back to `organization` |
| **Python SDK: `recyclebinconfigs`** | Recycle bin on/off and cleanup days | CREATE or PATCH the org-level config record |
| **Python SDK: `settingdefinition` + `organizationsettings`** | App-level and plan-level security role toggles | Look up the definition by `uniquename`, CREATE or PATCH the override row |

Do not write Python for anything PAC CLI handles, and do not mix mechanisms (for example,
hand-PATCHing an org column that PAC CLI covers).

---

## Allowed settings (hard allowlist)

**37 toggles, 35 backend keys**: 15 toggles on 14 organization columns, 18 toggles on 17 OrgDB keys,
2 recycle bin toggles, and 2 settings-definition toggles. `auditretentionperiodv2` and
`SearchAndCopilotIndexMode` each back two UI toggles.

Out of scope and refused, for example: `sessiontimeoutinmins`, `isautosaveenabled`,
`IsShadowLakeEnabled`, `IsArchivalEnabled`. Never run `pac org list-settings` without `--filter`, and
never dump the whole `orgdborgsettings` XML to look for a non-allowlisted setting.

### Organization columns: PAC CLI (14 columns, 15 toggles)

| # | Admin center label | Column | Type |
|---|---|---|---|
| 1 | Start Auditing | `isauditenabled` | bool |
| 2 | Audit user access (Log access) | `isuseraccessauditenabled` | bool |
| 3 | Start Read Auditing (Read logs to Purview) | `isreadauditenabled` | bool |
| 4 | Plugin trace log setting | `plugintracelogsetting` | int: `0` Off, `1` Exception, `2` All |
| 5 | Single table search option | `tablescopeddvsearchinapps` | bool |
| 6 | Prevent slow keyword filter for quick find terms | `allowleadingwildcardsinquickfind` | int: `0` prevent, `1` allow (UI "prevent = On" maps to `0`) |
| 7 | Quick Find record limits | `quickfindrecordlimitenabled` | bool |
| 8 | Use quick find view for searching on grids/subgrids | `usequickfindviewforgridsearch` | bool |
| 9 | Canvas apps in Dataverse solutions by default | `enablecanvasappsinsolutionsbydefault` | bool |
| 10 | Cloud flows in Dataverse solutions by default | `enableflowsinsolutionbydefault` | bool (`solution` is singular) |
| 11 | Enable email address validation (preview) | `isemailaddressvalidationenabled` | bool |
| 12 | Minimum number of characters to trigger typeahead | `lookupcharactercountbeforeresolve` | int (0 to MAX_INT; null = feature off) |
| 13 | Delay between character inputs that trigger a search | `lookupresolvedelayms` | int ms (default 250) |
| 14 | Audit log retention policy / Custom retention period (days) | `auditretentionperiodv2` | int days (`-1` = forever; presets 30/90/180/365/730/2555; max 365000) |

### OrgDB XML keys: Python SDK (17 keys, 18 toggles)

Keys are PascalCase and case-sensitive (`IsMCPEnabled`, not `IsMcpEnabled`): `IsMCPEnabled`,
`IsMCPPreviewEnabled`, `SearchAndCopilotIndexMode`, `IsLinkToFabricEnabled`,
`IsFabricVirtualTableEnabled`, `ShowDataInM365Copilot`, `EnableWorkIQ`,
`IsLockdownOfUnmanagedCustomizationEnabled`, `EnableSecurityOnAttachment`, `EnableTDSEndpoint`,
`AllowAccessToTDSEndpoint`, `EnableOwnershipAcrossBusinessUnits`,
`CreateOnlyNonEmptyAddressRecordsForEligibleEntities`, `EnableDeleteAddressRecords`,
`BlockDeleteManagedAttributeMap`, `EnableSystemUserDelete`,
`IsExcelToExistingTableWithAssistedMappingEnabled`. Labels, types, and code:
[references/orgdb-settings.md](references/orgdb-settings.md).

`SearchAndCopilotIndexMode` is one int that encodes two UI toggles:

| Value | Dataverse search | M365 Copilot search |
|---|---|---|
| `0` | Off | On |
| `1` | On | On |
| `2` | Off | Off |
| `3` | On | Off |

### Recycle bin: Python SDK (2 toggles, org level only)

On/off (`statecode` + `statuscode` + `isreadyforrecyclebin`) and cleanup days
(`cleanupintervalindays`) on the org-level `recyclebinconfigs` row. Per-table toggles are **out of
scope**; refuse requests like "enable recycle bin for `contact` only". See
[references/recycle-bin.md](references/recycle-bin.md).

### Settings-definition overrides: Python SDK (2 toggles)

`PowerAppsAppLevelSecurityRolesEnabled` (canvas apps) and `PlanShareSecurityRolesEnabled` (plan
designer), both bool stored as string. See
[references/settings-overrides.md](references/settings-overrides.md).

---

## Preview before running

- **Destructive or stateful** (bulk delete schedule/cancel/pause/resume, settings updates, recycle
  bin toggle, retention set): describe in prose what changes, the new value, and the target
  environment(s). Use placeholders like `<ENV_URL>` for unknowns and ask for missing values in the
  same turn. Skip the raw CLI block.
- **Read-only** (list-settings, show job, OrgDB or recycle bin status): a one-sentence preview is
  enough.

The user must be able to evaluate the action from your first response. A bare "which environment?"
fails; a one-line preview passes.

| Situation | Bad | Good |
|---|---|---|
| Pause a bulk delete job (ID given) | "The command requires approval. Please confirm to pause the job." | "I'll pause bulk delete job `<job-id>` on the active environment. Confirm to proceed." |
| Audit status across N environments | Sequential `pac org fetch` per environment, or starting with Python | "I'll run `pac org list-settings --filter audit` in parallel across all N environments." |

---

## Org settings (PAC CLI)

Org columns always go through `pac org list-settings` / `pac org update-settings`. Never use raw Web
API, FetchXML, PowerShell, Python, or `pac org fetch` for them.

```bash
# Single setting
pac org list-settings --filter isauditenabled --environment <url>

# Category read: every match in one call
pac org list-settings --filter audit --environment <url>

# Update
pac org update-settings --name isauditenabled --value true --environment <url>
pac org update-settings --name plugintracelogsetting --value 2 --environment <url>
```

`--name` and `--value` are required. Use `true`/`false` for bool and integers for option sets.
If `list-settings` fails for a setting, it is not an org column: route it through the mechanism
table instead.

### Multi-environment: always parallel

Run every multi-environment operation (`list-settings`, `update-settings`, `bulk-delete`, ...) as
backgrounded calls with a single `wait` in **one** shell call. Never run them sequentially or in a
`for` loop.

```bash
pac org list-settings --filter audit --environment https://contoso-dev.crm.dynamics.com &
pac org list-settings --filter audit --environment https://contoso-test.crm.dynamics.com &
pac org list-settings --filter audit --environment https://contoso.crm.dynamics.com &
wait
```

Batch rollout: `pac admin list`, filter targets, confirm with the user, run all `update-settings`
calls in parallel, then render a summary table.

---

## Bulk delete

```bash
pac data bulk-delete schedule --entity activitypointer \
    --fetchxml "<fetch><entity name='activitypointer'><filter><condition attribute='createdon' operator='lt' value='2024-01-01'/></filter></entity></fetch>"

pac data bulk-delete schedule --entity email \
    --fetchxml "<fetch><entity name='email'><filter><condition attribute='createdon' operator='lt' value='2024-06-01'/></filter></entity></fetch>" \
    --job-name "Cleanup old emails" --recurrence "FREQ=DAILY;INTERVAL=1"
```

| Argument | Alias | Required | Description |
|---|---|---|---|
| `--entity` | `-e` | Yes | Table logical name |
| `--fetchxml` | `-fx` | No | FetchXML filter. **If omitted, ALL records are deleted** (see gate below) |
| `--job-name` | `-jn` | No | Descriptive job name |
| `--start-time` | `-st` | No | ISO 8601 start time; defaults to now |
| `--recurrence` | `-r` | No | RFC 5545 pattern, e.g. `FREQ=DAILY;INTERVAL=1` |
| `--environment` | `-env` | No | Target environment URL |

### Hard stop: no `--fetchxml` means ALL records

1. **Refuse until the user explicitly acknowledges** with the word ALL (or ALL RECORDS) **and** the
   entity logical name, e.g. `"yes, delete ALL records in contact"`. A bare `"yes"` is rejected.
2. **Disambiguate vague requests** ("clean up old emails"): propose a FetchXML filter with date,
   `statecode`, or owner conditions before showing any command.
3. **Empty-filter FetchXML does not bypass the gate.** `<filter/>` or
   `<filter><condition><value/></condition></filter>` still targets every record.
4. **Scope:** applies to `bulk-delete schedule` only. `list`, `show`, `pause`, `resume`, and
   `cancel` do not need it.

For `systemuser`, `businessunit`, `organization`, or `role`, also warn that an unfiltered delete
breaks the environment.

### Manage jobs

```bash
pac data bulk-delete list --environment https://contoso.crm.dynamics.com
pac data bulk-delete show --id <job-id>
pac data bulk-delete pause --id <job-id>
pac data bulk-delete resume --id <job-id>
pac data bulk-delete cancel --id <job-id>
```

---

## Retention and archival

Retention moves old records to long-term storage instead of deleting them.

| Scenario | Use |
|---|---|
| Data no longer needed; delete permanently | Bulk delete |
| Data must be preserved for compliance | Retention (archive) |

Flow: enable the table, list policies, set criteria, check the result.

```bash
pac data retention enable-entity --entity activitypointer --environment https://contoso.crm.dynamics.com
pac data retention list --environment https://contoso.crm.dynamics.com
pac data retention set --entity activitypointer \
    --criteria "<fetch><entity name='activitypointer'><filter><condition attribute='createdon' operator='lt' value='2023-01-01'/></filter></entity></fetch>"
pac data retention show --id <config-id>
pac data retention status --id <operation-id>
```

| Argument | Alias | Required | Description |
|---|---|---|---|
| `--entity` | `-e` | Yes | Table logical name |
| `--criteria` | `-c` | Yes | FetchXML selecting records to archive |
| `--start-time` | `-st` | No | ISO 8601 start time; defaults to now |
| `--recurrence` | `-r` | No | RFC 5545 recurrence pattern |
| `--environment` | `-env` | No | Target environment URL |

---

## Flags that do not exist

| Command | Wrong | Correct |
|---|---|---|
| Bulk delete | `--filter`, `--query`, `--where`, `--condition` | `--fetchxml` |
| Bulk delete | `--date`, `--before`, `--older-than` | Date `<condition>` inside FetchXML |
| Bulk delete | `--job-id` | `--id` |
| Bulk delete | `--all`, `--purge`, `--truncate` | Omit `--fetchxml` (behind the ALL gate) |
| Retention | `--fetchxml`, `--filter`, `--query`, `--policy` | `--criteria` (same FetchXML format) |
| Retention | `--enable`, `--activate` | `pac data retention enable-entity` |
| Retention | `--table` | `--entity` |
| Retention | `--operation-id`, `--job-id`, `--guid` | `--id` |
| Org settings | `--enable-audit`, `--audit` | `--name isauditenabled --value true` |
| Org settings | `--trace`, `--plugin-trace`, `--logging` | `--name plugintracelogsetting --value 2` |
| Org settings | `--setting`, `--key`, `--flag` | `--name` |
| Org settings | `"all"`, `"enabled"` for option sets | Integers: `0`, `1`, `2` |

---

## Advanced settings (Python SDK)

PAC CLI cannot read or write these. Use the Python client set up by `dataverse-connect`:

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()
```

**OrgDB settings.** PascalCase elements inside the `orgdborgsettings` column of `organization`.
Read the column, parse with `xml.etree.ElementTree`, update or `SubElement`, and write the whole
serialized blob back with `client.records.update("organization", org_id, {...})`. Code:
[references/orgdb-settings.md](references/orgdb-settings.md).

**Recycle bin.** Lives in `recyclebinconfigs`, not `orgdborgsettings`. Filter by
`_extensionofrecordid_value eq e1bd1119-6e9d-45a4-bc15-12051e65a0bd` (the organization entity's
MetadataId, identical in every environment).

- Enable: PATCH `statecode=0, statuscode=1, isreadyforrecyclebin=true`, or CREATE a config.
  `isreadyforrecyclebin: true` forces the synchronous opt-in path.
- Disable: PATCH `statecode=1, statuscode=2, isreadyforrecyclebin=false`. **Never DELETE.**
- Drain in-flight `ProcessRecycleBin` jobs (`operationtype eq 50 and statecode ne 3`) before and
  after each toggle.

Full lifecycle and the cache-vs-database race: [references/recycle-bin.md](references/recycle-bin.md).

**Settings-definition overrides.** Look up `settingdefinitionid` by `uniquename`, then CREATE or
PATCH an `organizationsetting` row with a string `value` (`"true"`/`"false"`). Deleting the override
reverts to the default. Code: [references/settings-overrides.md](references/settings-overrides.md).

---

## References

| Reference | When to load |
|---|---|
| [references/orgdb-settings.md](references/orgdb-settings.md) | Reading or changing any of the 17 allowlisted OrgDB keys |
| [references/recycle-bin.md](references/recycle-bin.md) | Checking, enabling, or disabling the recycle bin, or changing cleanup days |
| [references/settings-overrides.md](references/settings-overrides.md) | App-level or plan-level security role toggles |

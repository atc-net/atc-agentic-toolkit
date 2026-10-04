# Recycle Bin Configuration

Recycle bin settings live in the `recyclebinconfigs` entity, **not** in the `orgdborgsettings` XML.
PAC CLI cannot manage them.

**Org-level constant:** `e1bd1119-6e9d-45a4-bc15-12051e65a0bd` is the `MetadataId` of the
`organization` entity's schema record in `EntityDefinitions`. It is a product-level system constant,
identical in every environment and tenant, so do not re-query it per environment.

## Key fields

| Field | Type | Meaning |
|---|---|---|
| `statecode` | int | `0` enabled (active), `1` disabled (inactive) |
| `statuscode` | int | `1` enabled, `2` disabled |
| `isreadyforrecyclebin` | bool | `true` on enable, `false` on disable; always set explicitly |
| `cleanupintervalindays` | int | Auto-purge interval. `-1` = no auto-cleanup (default); min `1`, max `30` |
| `_extensionofrecordid_value` | guid | Entity metadata ID the config applies to; org level = `e1bd1119-6e9d-45a4-bc15-12051e65a0bd` |

## Rules

- **Filter by `_extensionofrecordid_value`**, never by `name` (unreliable).
- **CREATE binds to `entities()`**: `extensionofrecordid@odata.bind: entities({id})`, not
  `organizations()`.
- **Every enable payload (CREATE or PATCH) sets `isreadyforrecyclebin: true`.** Otherwise CREATE
  defaults it to `false` and PATCH leaves it null, both of which route through the asynchronous
  opt-in path: a `ProcessRecycleBin` job is queued and the HTTP call returns before entity-level work
  happens. Platform metadata operations in that window (solution imports, attribute publish, async
  handlers) can then throw `EntityBinUpdateAction called for entity <x> which is not enabled for
  RecycleBin`. With `true`, the platform takes the synchronous, globally locked opt-in path that
  updates every entity in one transaction.
- **Disable with PATCH `statecode=1, statuscode=2, isreadyforrecyclebin=false`. Never DELETE.**
  DELETE enqueues an async opt-out (when `RecycleBinOptOutOrgAsynchronously` is on), marks the org
  row inactive, and leaves child entity rows flagged `IsReadyForRecycleBin=true, IsDisabled=false`.
  Any platform operation before the next enable sees "org is enabled" in the config cache, updates
  the entity config synchronously, and throws when the database check disagrees. The PATCH path runs
  the synchronous `OptOutOrganization` under the customization lock and cascades cleanly.
- **Drain `ProcessRecycleBin` jobs between toggles.** Every enable/disable queues one
  (`operationtype = 50`). Rapid enable/disable/enable interleaves jobs that share a dependency token
  and can corrupt state. Before and after each toggle, wait until no job matches
  `operationtype eq 50 and statecode ne 3`.
- **Cleanup days:** when the admin center shows "30 days", the API stores `-1` and the platform
  applies a 30-day default. Reducing the interval purges recycled records sooner; warn the user.
- Solution-managed configs (e.g. `msdyn_recurringsalesaction`) cannot be enabled or disabled via the
  API.
- **Per-table toggles are out of scope.** The admin center only exposes the org-level on/off and
  cleanup days. For requests like "turn on recycle bin for `contact` only", reply: *"Per-table
  recycle bin is out of scope for dataverse-admin. Use the Power Platform admin center."* This skill
  reads and writes only the org-level row.

## Read status

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()

ORGANIZATION_ENTITY_ID = "e1bd1119-6e9d-45a4-bc15-12051e65a0bd"

records = list(client.records.list(
    "recyclebinconfig",
    select=["recyclebinconfigid", "statecode", "statuscode", "cleanupintervalindays"],
    filter=f"_extensionofrecordid_value eq {ORGANIZATION_ENTITY_ID}",
))

if records:
    config = records[0]
    enabled = config["statecode"] == 0
    cleanup = config["cleanupintervalindays"]
    print(f"Recycle bin: {'enabled' if enabled else 'disabled'}", flush=True)
    print(f"Cleanup interval: {cleanup} days{' (no auto-cleanup)' if cleanup == -1 else ''}", flush=True)
    print(f"Config ID: {config['recyclebinconfigid']}", flush=True)
else:
    print("Recycle bin: not configured (no org-level record)", flush=True)
```

## Drain helper

```python
import time

def wait_for_recyclebin_async_jobs(client, timeout_s=120):
    # operationtype 50 = ProcessRecycleBin; statecode 3 = Completed.
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        pending = list(client.records.list(
            "asyncoperation",
            select=["asyncoperationid", "statecode", "statuscode", "name"],
            filter="operationtype eq 50 and statecode ne 3",
        ))
        if not pending:
            return
        print(f"  waiting on {len(pending)} ProcessRecycleBin job(s)...", flush=True)
        time.sleep(5)
    raise RuntimeError("Timed out waiting for pending ProcessRecycleBin async jobs")
```

## Enable

Continues from the read block (`client`, `ORGANIZATION_ENTITY_ID`, `records`) and uses the drain
helper.

```python
CLEANUP_DAYS = 30  # -1 means records are never auto-purged

wait_for_recyclebin_async_jobs(client)

if not records:
    # No config yet: CREATE. Binds to entities(), NOT organizations().
    client.records.create("recyclebinconfig", {
        "extensionofrecordid@odata.bind": f"entities({ORGANIZATION_ENTITY_ID})",
        "isreadyforrecyclebin": True,  # forces the synchronous opt-in path
        "cleanupintervalindays": CLEANUP_DAYS,
    })
else:
    config_id = records[0]["recyclebinconfigid"]
    client.records.update("recyclebinconfig", config_id, {
        "cleanupintervalindays": CLEANUP_DAYS,
        "statecode": 0,
        "statuscode": 1,
        "isreadyforrecyclebin": True,  # without it the update routes through the async path
    })
print(f"SUCCESS: recycle bin enabled with {CLEANUP_DAYS} day cleanup", flush=True)

wait_for_recyclebin_async_jobs(client)  # drain the opt-in fan-out
```

## Disable

```python
wait_for_recyclebin_async_jobs(client)

if records:
    config_id = records[0]["recyclebinconfigid"]
    client.records.update("recyclebinconfig", config_id, {
        "statecode": 1,                 # Inactive
        "statuscode": 2,                # Inactive
        "isreadyforrecyclebin": False,  # required for the synchronous opt-out branch
    })
    print("SUCCESS: recycle bin disabled", flush=True)
else:
    print("Recycle bin is already disabled (no config record)", flush=True)

wait_for_recyclebin_async_jobs(client)  # drain the opt-out fan-out
```

Older guidance (including earlier admin center behavior) used DELETE to disable. Do not: it leaves
per-entity configs orphaned and unrelated metadata operations fail until cleanup finishes.

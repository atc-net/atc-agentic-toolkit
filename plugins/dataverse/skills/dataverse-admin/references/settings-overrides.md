# Settings-Definition Overrides

Two allowlisted toggles live neither on the `organization` entity nor in `orgdborgsettings`. They
are modeled as a join between two entities:

| Entity | Role |
|---|---|
| `settingdefinition` | Defines the setting (`uniquename`, `datatype`, `defaultvalue`, description). Read-only; one row per known setting; identical across environments on the same build. |
| `organizationsetting` | Per-org override. If no row exists for a `settingdefinitionid`, the definition's `defaultvalue` applies. |

Allowlisted uniquenames (both `datatype=2` bool, stored as the string `"true"`/`"false"`):

| Uniquename | Admin center label |
|---|---|
| `PowerAppsAppLevelSecurityRolesEnabled` | Enable app level security roles for canvas apps |
| `PlanShareSecurityRolesEnabled` | Enable plan level security roles for plan designer |

Any other `settingdefinition` is out of scope.

## Read the current value

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()

UNIQUENAME = "PowerAppsAppLevelSecurityRolesEnabled"  # or PlanShareSecurityRolesEnabled

defs = list(client.records.list(
    "settingdefinition",
    select=["settingdefinitionid", "uniquename", "defaultvalue", "datatype"],
    filter=f"uniquename eq '{UNIQUENAME}'",
))
if not defs:
    raise SystemExit(f"Setting '{UNIQUENAME}' is not defined in this environment.")
defn = defs[0]
sd_id = defn["settingdefinitionid"]
default = defn["defaultvalue"]

overrides = list(client.records.list(
    "organizationsetting",
    select=["organizationsettingid", "value"],
    filter=f"_settingdefinitionid_value eq {sd_id}",
))

current = overrides[0]["value"] if overrides else default
print(f"{UNIQUENAME} = {current} (default = {default}, override present: {bool(overrides)})", flush=True)
```

## Write (idempotent CREATE or PATCH)

Continues from the read script (`client`, `UNIQUENAME`, `sd_id`, `overrides`):

```python
NEW_VALUE = "true"  # lowercase string "true" / "false"

if overrides:
    client.records.update("organizationsetting", overrides[0]["organizationsettingid"], {"value": NEW_VALUE})
else:
    # @odata.bind uses the entity-set path.
    client.records.create("organizationsetting", {
        "settingdefinitionid@odata.bind": f"settingdefinitions({sd_id})",
        "value": NEW_VALUE,
    })
print(f"SUCCESS: {UNIQUENAME} = {NEW_VALUE}", flush=True)
```

## Notes

- `datatype=2` is bool. Other datatypes exist for string and int, but only bool toggles are allowlisted.
- `value` is always a **string**, even for bool and int definitions: `"true"`, not `True`.
- In the admin center UI both toggles sit behind feature flags
  (`enablePowerAppsAppLevelSecurityRolesToggle`, `enablePlanShareSecurityRolesToggle`). The entities
  exist regardless, and an override takes effect even when the UI flag is off.
- Deleting the override row reverts the setting to `settingdefinition.defaultvalue`.

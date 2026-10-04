# Sample Data Generation

Generate and insert realistic sample records into any Dataverse table for development, demos, and testing. Use the Python SDK (`client.records.create()`), not raw `urllib` or `requests`.

## Step 1: Confirm environment, table, and count

Before creating anything, confirm:

- **Environment** — show the active one with `pac auth list`
- **Table** — the logical name (`account`, `contact`, `cr123_project`)
- **Count** — default **5** unless the user specifies otherwise

## Step 2: Read the table schema

`client.tables.list_columns()` reads `EntityDefinitions/Attributes` through the SDK.

- `filter="AttributeOf eq null"` is essential. Without it every lookup also returns a shadow sub-attribute row (e.g. `primarycontactid` plus a `_primarycontactid_value` companion), doubling the list and confusing downstream code.
- `DisplayName.UserLocalizedLabel` is null on unlocalized columns. Dereference safely or custom tables without display names will crash the loop.

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()
TABLE = "account"

attrs = client.tables.list_columns(
    TABLE,
    select=["LogicalName", "AttributeType", "RequiredLevel", "DisplayName"],
    filter="AttributeOf eq null",
)

for a in attrs:
    dn = (a.get("DisplayName") or {}).get("UserLocalizedLabel")
    label = dn["Label"] if dn else a["LogicalName"]
    if a["RequiredLevel"]["Value"] == "ApplicationRequired":
        print(f"REQUIRED  {a['LogicalName']:30s} {a['AttributeType']:15s} {label}", flush=True)
```

Downstream code should consume the raw `attrs` list, not the printed output.

## Step 3: Map AttributeType to a generator

| AttributeType | Generate |
|---|---|
| `String` / `Memo` | Realistic text based on the column name (`name` → company names) |
| `Integer` / `BigInt` / `Decimal` / `Double` / `Money` | Random values within `MinValue` / `MaxValue` |
| `Boolean` | Alternate `true` / `false` |
| `DateTime` | Recent dates, ISO 8601 UTC |
| `Picklist` / `Status` | Integer option values — look up the real OptionSet values |
| `Lookup` | **Skip** unless the user supplies valid record IDs |
| `Uniqueidentifier` (non-PK) | Skip — Dataverse generates it |

## Step 4: Create records — schema-driven template

The template is table-agnostic: it dispatches on `AttributeType` from Step 2, with no table-specific field names baked in. Write it inline per request and extend `fake()` when the table needs domain-specific values (real company names for `account.name`, valid status-reason integers for a custom picklist).

```python
import os, sys, random, datetime
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()

TABLE = "account"   # confirmed in Step 1
COUNT = 5           # confirmed in Step 1
# attrs = result of Step 2 (re-run it here if needed)

SKIP_TYPES = {"Lookup", "Uniqueidentifier", "EntityName", "State", "Status", "Owner", "Customer"}

def fake(attr, i):
    """Value by AttributeType, with PII-safe heuristics on the column name."""
    name, t = attr["LogicalName"], attr["AttributeType"]
    if t in ("String", "Memo"):
        if "email" in name: return f"user{i}@example.com"
        if any(s in name for s in ("phone", "telephone", "fax")): return f"555-01{i:02d}"
        if "url" in name or "website" in name: return f"https://example.com/{name}/{i}"
        return f"Sample {name} {i}"
    if t in ("Integer", "BigInt"):          return random.randint(1, 1000)
    if t in ("Decimal", "Double", "Money"): return round(random.uniform(1, 10_000), 2)
    if t == "Boolean":                       return bool(i % 2)
    if t == "DateTime":
        d = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=i)
        return d.isoformat(timespec="seconds").replace("+00:00", "Z")
    if t in ("Picklist", "Status"):
        return 1   # placeholder: use a real OptionSet value for real picklists
    return None    # Lookup, Uniqueidentifier, anything unhandled

required = [a for a in attrs
            if a["RequiredLevel"]["Value"] == "ApplicationRequired"
            and a["AttributeType"] not in SKIP_TYPES]

records = []
for i in range(COUNT):
    rec = {}
    for a in required:
        v = fake(a, i)
        if v is not None:
            rec[a["LogicalName"]] = v
    records.append(rec)

# CreateMultiple for 10+ records, individual creates otherwise
if COUNT >= 10:
    ids = client.records.create(TABLE, records)
    print(f"Created {len(ids)} records via CreateMultiple", flush=True)
else:
    ids = [client.records.create(TABLE, r) for r in records]
    print(f"Created {len(ids)} records individually", flush=True)

env_url = os.environ["DATAVERSE_URL"].rstrip("/")  # get_client() already loaded .env
print(f"View: {env_url}/main.aspx?pagetype=entitylist&etn={TABLE}", flush=True)
```

Why not a hardcoded `account` template: one that bakes in `name`, `telephone1`, `revenue`, `numberofemployees` invites copy-paste-then-hack when the request is for `contact` or `cr123_project`. Dispatching per attribute produces correct fields for any table.

## Safety rules

- Always confirm the target environment and record count first.
- Emails use `example.com` — never real domains.
- Phone numbers use `555-01xx`.
- Skip lookup fields unless the user explicitly provides values.
- Skip system fields: `createdon`, `modifiedon`, `ownerid`, `statecode`, `statuscode`.

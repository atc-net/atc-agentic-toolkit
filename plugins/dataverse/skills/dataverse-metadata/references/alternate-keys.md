# Alternate Keys

An alternate key lets Dataverse identify a record by a business column instead of its GUID
primary key. `UpsertMultiple` depends on it: without a key, Dataverse cannot tell whether a record
already exists.

Create keys on source-system ID columns (`prefix_Src*Id`) during schema setup, before any import.
Every import is then idempotent and re-runs never create duplicates.

## Choosing the key column

| Source | Rule |
|---|---|
| Database (SQLite, SQL Server) | Read the schema; the source primary key maps directly. `Country.Country_Id` becomes a key on `prefix_srccountryid`. A composite PK (`Order_Id, Line_No`) becomes a composite key on both columns. |
| Excel / CSV | Look for all-unique columns with ID-like names (`*_ID`, `*_Code`). **Propose the candidate and get the user's confirmation**: uniqueness in today's data does not prove it is the business key. |
| No obvious unique column | Ask the user which column(s) identify a row. Do not guess. |

## Create keys (SDK)

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()

# Single-column key (most common for imports)
key = client.tables.create_alternate_key(
    "prefix_Country",
    "prefix_SrcCountryIdKey",
    ["prefix_srccountryid"],
    display_name="Source Country ID",
)
print(f"Key created: {key.schema_name} (status: {key.status})")

# Composite key (multi-column source PK)
key = client.tables.create_alternate_key(
    "prefix_OrderLine",
    "prefix_OrderLineSourceKey",
    ["prefix_srcorderid", "prefix_srclineno"],
    display_name="Source Order Line Key",
)
```

## Idempotent creation

Check first so setup scripts can be re-run safely:

```python
def ensure_alternate_key(client, table, key_name, columns, display_name):
    existing = client.tables.get_alternate_keys(table)
    if any(k.schema_name.lower() == key_name.lower() for k in existing):
        print(f"  Key already exists: {key_name}")
        return
    client.tables.create_alternate_key(table, key_name, columns, display_name=display_name)
    print(f"  Key created: {key_name} on {table}")

ensure_alternate_key(client, "prefix_Country", "prefix_SrcCountryIdKey",
    ["prefix_srccountryid"], "Source Country ID")
ensure_alternate_key(client, "prefix_City", "prefix_SrcCityIdKey",
    ["prefix_srccityid"], "Source City ID")
```

## Check key status

Index creation is asynchronous for tables that already hold data:

```python
keys = client.tables.get_alternate_keys("prefix_Country")
for k in keys:
    print(f"  {k.schema_name}: {k.status}")  # Pending, Active, or Failed
```

Small tables (under ~10K rows) are near-instant. For large tables, wait until `EntityKeyIndexStatus`
is `Active` before relying on the key.

## Constraints

- Valid column types: Integer, Decimal, String, DateTime, Lookup, OptionSet.
- At most 16 columns and 900 bytes per key.
- At most 10 alternate keys per table.

## Failure handling and safety

- If the column contains duplicates, index creation **fails** and the key stays in `Failed` state.
  No data is changed. Fix the duplicates, then call `ReactivateEntityKey`.
- Creating a key is a non-destructive metadata operation: it adds a database index and does not
  modify existing records.

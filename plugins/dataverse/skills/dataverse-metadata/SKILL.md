---
name: dataverse-metadata
description: >
  Author and inspect the Microsoft Dataverse data model: tables, columns, choices, lookups,
  1:N and N:N relationships, alternate keys, forms, and views.
  USE FOR: create table, add column, add choice column, create lookup, create relationship,
  many-to-many relationship, alternate key for upsert, create form, modify form, create view,
  publish customizations, list columns, list relationships, inspect schema, publisher prefix,
  metadata lock contention, EntityDefinitions errors.
  DO NOT USE FOR: creating, updating, or deleting records (use dataverse-data),
  reading or querying records (use dataverse-query), exporting or importing solutions
  (use dataverse-solution), security roles (use dataverse-security), environment settings
  (use dataverse-admin).
---

# Dataverse Metadata

Create and evolve tables, columns, relationships, keys, forms, and views in a Dataverse
environment, then pull the generated solution XML into the repo.

## When to use

Use this skill to change or inspect the schema. Route other work elsewhere:

| Need | Use instead |
|---|---|
| Create, update, or delete records | `dataverse-data` |
| Query or read records | `dataverse-query` |
| Export, unpack, pack, or import solutions | `dataverse-solution` |
| Environment settings, audit, bulk delete | `dataverse-admin` |

---

## Before the first change in a session

1. **Confirm the target environment** with the user (see the environment rule in `dataverse-overview`).
2. **Confirm the solution.** If `SOLUTION_NAME` is in `.env`, confirm it. If no solution exists yet,
   stop and ask:

   > "What solution name and publisher prefix should I use? The prefix (e.g. `contoso`) is permanent on every table and column."

   The publisher prefix **cannot be changed** after components are created with it.
3. **Show existing publishers** so the user can reuse one, then create the publisher (with the
   user's prefix, never hardcoded) and solution with the SDK, never raw Web API. The full discovery
   and creation flow is in `dataverse-solution`:

   ```python
   publishers = client.records.list("publisher",
       filter="customizationprefix ne 'none' and uniquename ne 'MicrosoftCorporation'",
       select=["publisherid", "uniquename", "friendlyname", "customizationprefix"], top=10)
   ```

4. Pass `solution="<UniqueName>"` on every SDK metadata call, or send the `MSCRM.SolutionName`
   header on every raw Web API call. **Never create tables or columns outside a solution.**

Find an existing prefix with `pac solution list --environment <url>`, or read `<CustomizationPrefix>`
in `solutions/<SOLUTION_NAME>/Other/Solution.xml` after the first pull.

---

## Workflow: environment first, then pull

**Do not hand-write solution XML to create tables, columns, forms, or views.** The environment
validates metadata far better than hand edits, and a single wrong attribute causes an opaque
import failure.

1. Make the change in the environment (SDK, Web API, MCP, or `pac`).
2. Pull it into the repo with `pac solution export` + `pac solution unpack` (see `dataverse-solution`).
3. Commit the generated XML.

Edit files directly only for small tweaks to components already in the repo (reorder form fields,
change a label, adjust view columns).

Schema inspection from the CLI: `dataverse data describe --table account --include all --json`.
API discovery: `dataverse api list --target dataverse`.

### Client setup

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()
```

All snippets below assume this `client`.

---

## Tables

Prefer the SDK. Fall back to the Web API only for properties the SDK does not expose
(`OwnershipType`, `HasActivities`, `HasNotes`, and similar).

```python
info = client.tables.create(
    "new_ProjectBudget",
    {"new_Amount": "decimal", "new_Description": "string"},
    solution="MySolution",
    primary_column="new_Name",
    display_name="Project Budget",  # plural display name auto-appends "s"
)
print(f"Created: {info['table_schema_name']}")
```

Web API fallback (`POST /api/data/v9.2/EntityDefinitions` with the `MSCRM.SolutionUniqueName` header):

```python
def label(text):
    return {"@odata.type": "Microsoft.Dynamics.CRM.Label",
            "LocalizedLabels": [{"@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                                 "Label": text, "LanguageCode": 1033}]}

entity = {
    "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
    "SchemaName": "new_ProjectBudget",
    "DisplayName": label("Project Budget"),
    "DisplayCollectionName": label("Project Budgets"),
    "Description": label(""),
    "OwnershipType": "UserOwned",
    "HasActivities": False, "HasNotes": False, "IsActivity": False,
    "PrimaryNameAttribute": "new_name",
    "Attributes": [{
        "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
        "SchemaName": "new_name",
        "DisplayName": label("Name"),
        "RequiredLevel": {"Value": "ApplicationRequired"},
        "MaxLength": 100, "IsPrimaryName": True,
    }],
}
```

Creating several tables for an import? Use the check-first `ensure_table` helper and phased
creation in [references/metadata-propagation.md](references/metadata-propagation.md), and add
alternate keys right after the tables exist.

If a table was created outside a solution, add it with
`pac solution add-solution-component --solutionUniqueName <SOLUTION_NAME> --component <SchemaName> --componentType 1 --environment <url>`
(`1` = Entity; full type list in `dataverse-solution`). Web API equivalent:
`POST /api/data/v9.2/AddSolutionComponent` with `ComponentId` (entity metadata ID), `ComponentType: 1`,
`SolutionUniqueName`, and `AddRequiredComponents: true`.

---

## Columns

**Never give a regular column an `Id` suffix** (e.g. `prefix_DepartmentId`). Lookups auto-generate
an `...Id` schema name, so a later lookup creation fails with a name collision. Use
`prefix_SrcDepartmentId` or `prefix_DepartmentSourceId` instead.

```python
created = client.tables.add_columns(
    "new_ProjectBudget",
    {"new_Description": "string", "new_Amount": "decimal", "new_Active": "bool"},
)
```

Supported type strings: `string`/`text`, `int`/`integer`, `decimal`/`money`, `float`/`double`,
`datetime`/`date`, `bool`/`boolean`, `file`, plus `Enum` subclasses for local choices:

```python
from enum import IntEnum

class BudgetStatus(IntEnum):
    DRAFT = 100000000
    APPROVED = 100000001
    REJECTED = 100000002

client.tables.add_columns("new_ProjectBudget", {"new_Status": BudgetStatus})
```

Use the Web API for types the SDK cannot shape, such as currency with precision or memo with a
custom max length (`POST /api/data/v9.2/EntityDefinitions(LogicalName='new_projectbudget')/Attributes`):

```python
attribute = {
    "@odata.type": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
    "SchemaName": "new_amount",
    "DisplayName": label("Amount"),
    "RequiredLevel": {"Value": "None"},
    "MinValue": 0, "MaxValue": 1000000000,
    "Precision": 2, "PrecisionSource": 2,
}
```

**After creating columns, always report the actual logical names** in a table. Names may be
normalized or prefixed in ways the user does not expect, and downstream inserts fail otherwise:

| Display Name | Logical Name | Type |
|---|---|---|
| Email | `contoso_email` | String |
| Tier | `contoso_tier` | Picklist |
| Customer | `contoso_customerid` | Lookup |

---

## Lookups and relationships

Simple lookup (preferred):

```python
result = client.tables.create_lookup_field(
    referencing_table="new_projectbudget",
    lookup_field_name="new_AccountId",
    referenced_table="account",
    display_name="Account",
    solution="MySolution",
)
```

Full control over a 1:N relationship:

```python
from PowerPlatform.Dataverse.models.relationship import (
    LookupAttributeMetadata, OneToManyRelationshipMetadata, CascadeConfiguration,
)
from PowerPlatform.Dataverse.models.labels import Label, LocalizedLabel
from PowerPlatform.Dataverse.common.constants import CASCADE_BEHAVIOR_REMOVE_LINK

lookup = LookupAttributeMetadata(
    schema_name="new_AccountId",
    display_name=Label(localized_labels=[LocalizedLabel(label="Account", language_code=1033)]),
)
relationship = OneToManyRelationshipMetadata(
    schema_name="account_new_projectbudget",
    referenced_entity="account",
    referencing_entity="new_projectbudget",
    referenced_attribute="accountid",
    cascade_configuration=CascadeConfiguration(delete=CASCADE_BEHAVIOR_REMOVE_LINK),
)
result = client.tables.create_one_to_many_relationship(lookup, relationship, solution="MySolution")
```

Many-to-many:

```python
from PowerPlatform.Dataverse.models.relationship import ManyToManyRelationshipMetadata

relationship = ManyToManyRelationshipMetadata(
    schema_name="new_ticket_knowledgebase",
    entity1_logical_name="new_ticket",
    entity2_logical_name="new_knowledgebase",
)
result = client.tables.create_many_to_many_relationship(relationship, solution="MySolution")
```

Web API fallback: `POST /api/data/v9.2/RelationshipDefinitions` with a
`Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata` body (`SchemaName`, `ReferencedEntity`,
`ReferencingEntity`, and a nested `Lookup` of type `LookupAttributeMetadata`).

**Setting a lookup on records** uses the case-sensitive navigation property name from `$metadata`,
usually the lookup's SchemaName:

| Navigation property | `@odata.bind` key | Value |
|---|---|---|
| `new_AccountId` | `new_AccountId@odata.bind` | `/accounts(<guid>)` |
| `new_ParentTicketId` | `new_ParentTicketId@odata.bind` | `/new_tickets(<guid>)` |

Using the lowercase logical name (`new_accountid@odata.bind`) returns HTTP 400.

---

## Alternate keys (required for upsert)

`UpsertMultiple` needs an alternate key to match existing records. Create keys on source-system ID
columns (`prefix_Src*Id`) during schema setup so every import is idempotent.

```python
key = client.tables.create_alternate_key(
    "prefix_Country", "prefix_SrcCountryIdKey", ["prefix_srccountryid"],
    display_name="Source Country ID",
)
```

- Composite keys: pass several columns.
- Index creation is **async**; on large tables poll `client.tables.get_alternate_keys(table)` until
  the status is `Active`.
- Limits: 16 columns / 900 bytes per key, 10 keys per table. Valid types: Integer, Decimal, String,
  DateTime, Lookup, OptionSet.

Column-selection rules (database vs Excel/CSV source), the idempotent `ensure_alternate_key` helper,
and failure handling: [references/alternate-keys.md](references/alternate-keys.md).

---

## Forms and views

`systemform` (forms) and `savedquery` (views) are ordinary entities, so create and modify them with
the SDK's record CRUD. Only publishing (`PublishXml`) goes through `dataverse api request`.

| Task | How |
|---|---|
| Create form | `client.records.create("systemform", {..., "type": 2})` (`2` Main, `7` Quick Create, `6` Quick View, `11` Card) |
| Modify form | List a template form, mutate `formxml`, `client.records.update("systemform", id, {...})` |
| Create view | `client.records.create("savedquery", {...})` (`querytype` `0` standard, `1` advanced find, `2` associated, `4` quick find) |
| Publish | `dataverse api request` POST `/api/data/v9.2/PublishXml` (required after every create or modify) |
| Add to solution | `pac solution add-solution-component` (`60` form, `26` view); `records.create` has no `solution=` |

Key rules:

- Retrieve a live form as a template and mutate it; hand-authored root envelopes are the top cause
  of schema rejections.
- Structural ids (`<tab>`, `<section>`, `<cell>`) and `labelid` must be unique GUIDs; generate them
  with `str(uuid.uuid4()).upper()` inside a `.py` file, never `python -c` on Windows.
- Subgrids need the GUID of an existing view, so create the view first.

Full code, publish payload, `classid` table, and pitfalls:
[references/forms-and-views.md](references/forms-and-views.md).

**Business rules:** create them in the Power Apps maker portal, then export, unpack, and commit.
They are too complex to author reliably as JSON/XAML.

---

## Inspect existing schema

Read-only calls that return raw metadata dictionaries (PascalCase keys); safe to run any time:

```python
columns = client.tables.list_columns("account", select=["LogicalName", "AttributeType", "SchemaName"])
for col in columns:
    print(f"{col['LogicalName']} ({col.get('AttributeType')})")

rels = client.tables.list_table_relationships("account")  # 1:N, N:1, and N:N combined
for rel in rels:
    print(f"{rel['SchemaName']} -> {rel.get('@odata.type')}")

all_rels = client.tables.list_relationships(select=["SchemaName", "ReferencedEntity", "ReferencingEntity"])
```

For SQL-queryable column discovery, `dataverse-query` offers `client.query.sql_columns(table)`.

**`startswith()` is not supported on `EntityDefinitions`** and returns HTTP 400. Query each table
by `EntityDefinitions(LogicalName='new_projectbudget')?$select=LogicalName,EntitySetName`, or fetch
`EntityDefinitions?$select=LogicalName,EntitySetName` and filter client-side.

---

## Propagation delays and errors

Dataverse spends 3-30 seconds building indexes and propagating caches after metadata changes.
Overlapping operations cause lock contention. Create **all tables**, wait 15-30 s, create **all
alternate keys**, wait 15-30 s, then create **all lookups**. Never interleave operations on the same
table. Retry helper, phase timings, and MCP `create_table` / `update_table` notes (supported column
types, timeouts, self-referential lookups):
[references/metadata-propagation.md](references/metadata-propagation.md).

| Error code | Meaning | Recovery |
|---|---|---|
| `0x80040216` | Metadata not yet propagated (transient cache error) | Wait 3-5 s and retry |
| `0x80048d19` | Payload property does not match any column | Verify logical names via `EntityDefinitions(LogicalName='...')/Attributes` |
| `0x80040237` | Schema name already exists | Check whether a timed-out earlier call already created it |
| `0x8004431a` | Publisher prefix mismatch | Use the solution's publisher prefix on all schema names |
| `0x80060891` | Metadata cache not ready after table creation | `GET EntityDefinitions(LogicalName='...')` to refresh, then retry |

Other propagation symptoms: lookup `@odata.bind` fails with "Invalid property", MCP `update_table`
reports "EntityId not found in MetadataCache", or key/lookup creation reports "another customization
operation is running". Always translate error codes into plain language for the user.

---

## Close the session: pull to repo

After every metadata session, export, unpack, and commit the solution (see `dataverse-solution`).
If you relied on the `MSCRM.SolutionName` header, verify the components landed first:

```python
sol = client.records.list("solution",
    filter="uniquename eq '<SOLUTION_NAME>'", select=["solutionid"], top=1).first()
if sol is not None:
    components = client.records.list("solutioncomponent",
        filter=f"_solutionid_value eq {sol['solutionid']}",
        select=["componenttype", "objectid"])
    print(f"{len(components)} components in the solution")
```

---

## References

| Reference | When to load |
|---|---|
| [references/alternate-keys.md](references/alternate-keys.md) | Choosing key columns, idempotent key creation, key status and failures |
| [references/forms-and-views.md](references/forms-and-views.md) | Creating or editing forms and views, publishing, `classid` values, FormXml pitfalls |
| [references/metadata-propagation.md](references/metadata-propagation.md) | Multi-table schema setup, `ensure_table`, phased creation, lock-contention retries, MCP table tools |

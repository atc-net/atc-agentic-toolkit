# Forms and Views

`systemform` (forms) and `savedquery` (views) are ordinary Dataverse entities. Create and modify
them with the Python SDK's generic record CRUD: it handles auth and paging, and you stay in Python
to build and mutate the XML. The **only** step the SDK cannot do is publishing (`PublishXml` is an
unbound Web API action), which goes through `dataverse api request`. Do not use `urllib` for any of
this.

> **Solution membership is a separate step.** `records.create` has no `solution=` parameter, so a
> new form or view lands in the default solution. Add it to your solution explicitly (see
> [Add to your solution](#add-to-your-solution)), or `pac solution export` will not capture it.

> **The hard part is the XML.** `formxml`, `fetchxml`, and `layoutxml` are the same regardless of
> transport. Retrieve a live template and mutate it instead of hand-authoring the root envelope;
> a hand-written `<form>` root is the most common cause of "required id" and schema errors.

All snippets assume:

```python
import os, sys
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()
```

## Modify a form from a template (preferred)

Pulling a live form inherits the correct root envelope, element GUIDs, and control `classid`s:

```python
# 1. Retrieve an existing Main form for the table.
rows = list(client.records.list(
    "systemform",
    select=["formid", "name", "formxml"],
    filter="objecttypecode eq 'new_projectbudget' and type eq 2",
    top=1,
))
if not rows:
    raise ValueError("No form found to use as a template")
form_id = rows[0]["formid"]
form_xml = rows[0]["formxml"]

# 2. Mutate the XML string (swap datafieldname/labels, add a cell, ...).
#    Keep the root envelope, id GUIDs, and classids from the template.
# form_xml = form_xml.replace("new_oldfield", "new_newfield")

# 3. Write it back, then publish.
client.records.update("systemform", form_id, {"formxml": form_xml})
```

## Create a form

The literal below is illustrative; prefer the template pattern for real forms.

```python
form_xml = """<form>
  <tabs>
    <tab id="{TAB-GUID}" IsUserDefined="1" showlabel="true">
      <labels><label description="General" languagecode="1033" /></labels>
      <columns><column width="100%"><sections>
        <section id="{SEC-GUID}" showlabel="true" showbar="true" IsUserDefined="1">
          <labels><label description="General" languagecode="1033" /></labels>
          <rows><row><cell id="{CELL-GUID}">
            <labels><label description="Name" languagecode="1033" /></labels>
            <control id="new_name" classid="{4273EDBD-AC1D-40d3-9FB2-095C621B552D}" datafieldname="new_name" />
          </cell></row></rows>
        </section>
      </sections></column></columns>
    </tab>
  </tabs>
</form>"""

form_id = client.records.create("systemform", {
    "name": "Project Budget Main",
    "objecttypecode": "new_projectbudget",
    "type": 2,  # 2 = Main, 7 = Quick Create, 6 = Quick View, 11 = Card
    "formxml": form_xml,
    "iscustomizable": {"Value": True},
})
```

## Create a view

A view's `layoutxml` needs the table's numeric `ObjectTypeCode`. It is not on the SDK's table info,
so read it once via the CLI:

```bash
dataverse api request --target dataverse --method GET \
  --path "/api/data/v9.2/EntityDefinitions(LogicalName='new_projectbudget')?%24select=ObjectTypeCode" \
  --environment <DATAVERSE_URL>
```

Then create the `savedquery` record:

```python
object_type_code = 10123  # from the EntityDefinitions read above

fetch_xml = """<fetch version="1.0" output-format="xml-platform" mapping="logical">
  <entity name="new_projectbudget">
    <attribute name="new_name" />
    <attribute name="new_amount" />
    <attribute name="new_status" />
    <order attribute="new_name" descending="false" />
    <filter type="and"><condition attribute="statecode" operator="eq" value="0" /></filter>
  </entity>
</fetch>"""

layout_xml = f"""<grid name="resultset" object="{object_type_code}" jump="new_name" select="1" icon="1" preview="1">
  <row name="result" id="new_projectbudgetid">
    <cell name="new_name" width="200" />
    <cell name="new_amount" width="125" />
    <cell name="new_status" width="125" />
  </row>
</grid>"""

view_id = client.records.create("savedquery", {
    "name": "My Open Budgets",
    "returnedtypecode": "new_projectbudget",
    "querytype": 0,  # 0 = standard, 1 = advanced find default, 2 = associated, 4 = quick find
    "fetchxml": fetch_xml,
    "layoutxml": layout_xml,
    "isdefault": False,
    "isprivate": False,
})
```

## Publish

Forms and views must be published after every create or modify, otherwise users do not see the
change. `PublishXml` has no SDK method, so use `dataverse api request` (managed auth, real exit
code):

```bash
dataverse api request \
  --target dataverse \
  --method POST \
  --path /api/data/v9.2/PublishXml \
  --body-file ./publish.json \
  --environment <DATAVERSE_URL>
```

`publish.json` (use the modified table's logical name):

```json
{ "ParameterXml": "<importexportxml><entities><entity>new_projectbudget</entity></entities></importexportxml>" }
```

## Add to your solution

```bash
# Form: componentType 60
pac solution add-solution-component --solutionUniqueName <YourSolution> --component <formid> --componentType 60 --environment <DATAVERSE_URL>
# View (savedquery): componentType 26
pac solution add-solution-component --solutionUniqueName <YourSolution> --component <savedqueryid> --componentType 26 --environment <DATAVERSE_URL>
```

## Editing form XML already in the repo

Targeted edits to an unpacked form are fine: reorder fields, change a label, or add a control to an
existing section. Control `classid` values:

| Field type | Control classid |
|---|---|
| Text (nvarchar) | `{4273EDBD-AC1D-40d3-9FB2-095C621B552D}` |
| Currency (money) | `{533B9108-5A8B-42cb-BD37-52D1B8E7C741}` |
| Choice (picklist) | `{3EF39988-22BB-4f0b-BBBE-64B5A3748AEE}` |
| Lookup | `{270BD3DB-D9AF-4782-9025-509E298DEC0A}` |
| Date/Time | `{5B773807-9FB2-42db-97C3-7A91EFF8ADFF}` |
| Whole Number | `{C6D124CA-7EDA-4a60-AEA9-7FB8D318B68F}` |
| Decimal | `{C3EFE0C3-0EC6-42be-8349-CBD9079C5A6F}` |
| Toggle (boolean) | `{67FAC785-CD58-4f9f-ABB3-4B7DDC6ED5ED}` |
| Subgrid | `{E7A81278-8635-4d9e-8D4D-59480B391C5B}` |
| Multiline Text (memo) | `{E0DECE4B-6FC8-4a8f-A065-082708572369}` |

## FormXml pitfalls

- Structural ids (`<tab>`, `<section>`, `<cell>`) must be valid, unique GUIDs in
  `{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}` format across the whole form. Strings like `"general"`
  are rejected.
- `labelid` is also a GUID, not a readable string.
- A `<control id>` is the field logical name (e.g. `new_name`), and a view grid's `<row id>` is the
  primary-key attribute (e.g. `new_projectbudgetid`). These are not GUIDs.
- Subgrid controls need a valid `<ViewId>`: the GUID of an existing `savedquery`. Create the view
  first.
- Generate GUIDs inside a `.py` script:

  ```python
  import uuid
  guid = str(uuid.uuid4()).upper()
  ```

  Do not use `python -c` for this on Windows; multi-line `python -c` breaks in Git Bash quoting.

**Tip:** build a form in the maker portal, pull it with `pac solution export`, and use the pulled
XML as the template for programmatic creation.

# OrgDB Settings

Settings such as search mode, MCP, Copilot features, and Fabric live in the `orgdborgsettings` XML
column of the `organization` entity. The XML uses **direct PascalCase elements**, not `<pair>` tags:

```xml
<OrgSettings>
  <IsMCPEnabled>true</IsMCPEnabled>
  <SearchAndCopilotIndexMode>0</SearchAndCopilotIndexMode>
  <IsLinkToFabricEnabled>true</IsLinkToFabricEnabled>
  <IsFabricVirtualTableEnabled>false</IsFabricVirtualTableEnabled>
</OrgSettings>
```

PAC CLI cannot read or write these keys. Use the Python SDK; `organization` is an ordinary entity
and `orgdborgsettings` is one of its columns.

## Allowed keys (17, PascalCase, case-sensitive)

| Setting | Type | Values | Admin center label |
|---|---|---|---|
| `IsMCPEnabled` | bool | `true` / `false` | Allow MCP clients to interact with Dataverse MCP server |
| `IsMCPPreviewEnabled` | bool | `true` / `false` | Advanced Settings (enable non-Copilot Studio MCP clients) |
| `SearchAndCopilotIndexMode` | int | `0` Search Off / Copilot On; `1` both On; `2` both Off; `3` Search On / Copilot Off | Dataverse search + Search for records in Microsoft 365 apps (one key, two UI toggles) |
| `IsLinkToFabricEnabled` | bool | `true` / `false` | Link Dataverse tables with Microsoft Fabric workspace |
| `IsFabricVirtualTableEnabled` | bool | `true` / `false` | Define Dataverse virtual tables using Fabric OneLake data |
| `ShowDataInM365Copilot` | bool | `true` / `false` | Allow data availability in Microsoft 365 Copilot |
| `EnableWorkIQ` | bool | `true` / `false` | Turn on Dataverse intelligence (Work IQ) for agents |
| `IsLockdownOfUnmanagedCustomizationEnabled` | bool | `true` / `false` | Block unmanaged customizations in environment |
| `EnableSecurityOnAttachment` | bool | `true` / `false` | Enable security on Attachment entity |
| `EnableTDSEndpoint` | bool | `true` / `false` | Enable TDS endpoint |
| `AllowAccessToTDSEndpoint` | bool | `true` / `false` | Enable user level access control for TDS endpoint (requires TDS endpoint enabled first) |
| `EnableOwnershipAcrossBusinessUnits` | bool | `true` / `false` | Record ownership across business units |
| `CreateOnlyNonEmptyAddressRecordsForEligibleEntities` | bool | `true` / `false` | Disable empty address record creation (affects Account, Contact, Lead) |
| `EnableDeleteAddressRecords` | bool | `true` / `false` | Enable deletion of address records |
| `BlockDeleteManagedAttributeMap` | bool | `true` / `false` | Block deletion of OOB attribute maps |
| `EnableSystemUserDelete` | bool | `true` / `false` | Enable delete disabled users |
| `IsExcelToExistingTableWithAssistedMappingEnabled` | bool | `true` / `false` | Import Excel to existing table with AI-assisted mapping |

Every other OrgDB key (`IsRetentionEnabled`, `IsArchivalEnabled`, `IsDVCopilotForTextDataEnabled`,
`IsShadowLakeEnabled`, `IsCommandingModifiedOnEnabled`, `CanCreateApplicationStubUser`,
`AllowRoleAssignmentOnDisabledUsers`, `EnableActivitiesFeatures`, `TDSListenerInitialized`,
`AzureSynapseLinkIncrementalUpdateTimeInterval`, and so on) is **out of scope**. Refuse and point the
user to the Power Platform admin center. Do not dump the whole XML to "discover" other settings.

## Read allowlisted settings

```python
import os, sys
from xml.etree import ElementTree as ET
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()

ALLOWED = {
    "IsMCPEnabled", "IsMCPPreviewEnabled", "SearchAndCopilotIndexMode", "IsLinkToFabricEnabled",
    "IsFabricVirtualTableEnabled", "ShowDataInM365Copilot", "EnableWorkIQ",
    "IsLockdownOfUnmanagedCustomizationEnabled", "EnableSecurityOnAttachment", "EnableTDSEndpoint",
    "AllowAccessToTDSEndpoint", "EnableOwnershipAcrossBusinessUnits",
    "CreateOnlyNonEmptyAddressRecordsForEligibleEntities", "EnableDeleteAddressRecords",
    "BlockDeleteManagedAttributeMap", "EnableSystemUserDelete",
    "IsExcelToExistingTableWithAssistedMappingEnabled",
}

orgs = list(client.records.list("organization", select=["organizationid", "orgdborgsettings"]))
root = ET.fromstring(orgs[0].get("orgdborgsettings") or "<OrgSettings></OrgSettings>")
for name in sorted(ALLOWED):
    element = root.find(name)
    print(f"  {name} = {element.text if element is not None else '(not set)'}", flush=True)
```

## Update or add a setting

Write the **whole** blob back; never send a fragment.

```python
import os, sys
from xml.etree import ElementTree as ET
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_client

client = get_client()

SETTING_NAME = "SearchAndCopilotIndexMode"  # PascalCase, case-sensitive, must be allowlisted
SETTING_VALUE = "0"                          # always a string in XML

orgs = list(client.records.list("organization", select=["organizationid", "orgdborgsettings"]))
org = orgs[0]
org_id = org["organizationid"]

root = ET.fromstring(org.get("orgdborgsettings") or "<OrgSettings></OrgSettings>")

existing = root.find(SETTING_NAME)
if existing is not None:
    print(f"Current {SETTING_NAME} = {existing.text}", flush=True)
    existing.text = SETTING_VALUE
else:
    print(f"{SETTING_NAME} not set -- adding", flush=True)
    ET.SubElement(root, SETTING_NAME).text = SETTING_VALUE

client.records.update("organization", org_id, {"orgdborgsettings": ET.tostring(root, encoding="unicode")})
print(f"SUCCESS: {SETTING_NAME} = {SETTING_VALUE}", flush=True)
```

## Remove a setting

```python
# After fetching and parsing the XML as above:
existing = root.find(SETTING_NAME)
if existing is not None:
    root.remove(existing)
    client.records.update("organization", org_id, {"orgdborgsettings": ET.tostring(root, encoding="unicode")})
```

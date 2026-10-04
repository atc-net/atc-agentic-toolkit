# Advanced Web API Queries

N:N `$expand` and `$apply` aggregation over the raw Dataverse Web API.

## When to hand-roll HTTP

For a **one-shot** N:N read or aggregation, use a managed path instead:

- `client.query.fetchxml()` — aggregates and link-entity joins, pure SDK
- `dataverse api request --target dataverse --path "..."` — CLI escape hatch

Use the `urllib` samples below **only** when the call is one step inside a larger in-process Python loop — paging thousands of rows via `@odata.nextLink`, or post-processing `$apply` results — where spawning a CLI process per call would be clumsy.

Notes:

- These samples fetch a single page. Past ~5,000 records, follow `@odata.nextLink` in a loop.
- **Raw POST creates return HTTP 204** with the new id in the `OData-EntityId` response header (`.../accounts(<guid>)`), not in a body. With `dataverse api request`, pass `-i` / `--include` to see response headers. SDK `client.records.create` and MCP `create_record` return the id directly — prefer them for creates.

## Shared setup

```python
import os, sys, json, urllib.request
sys.path.insert(0, os.path.join(os.getcwd(), "scripts"))
from auth import get_token, load_env  # raw Web API: the SDK has no $apply / N:N $expand

load_env()
env = os.environ["DATAVERSE_URL"].rstrip("/")
token = get_token()
headers = {
    "Authorization": f"Bearer {token}",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
    "Accept": "application/json",
}
```

## N:N `$expand`

```python
# Tickets with their linked KB articles
url = (f"{env}/api/data/v9.2/new_tickets"
       f"?$select=new_name"
       f"&$expand=new_ticket_kbarticle($select=new_title)")
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=150) as resp:
    data = json.loads(resp.read())

for ticket in data["value"]:
    articles = [a["new_title"] for a in ticket.get("new_ticket_kbarticle", [])]
    print(f"{ticket['new_name']}: {', '.join(articles)}")
```

---

## `$apply` aggregation

Use for any single-table aggregation — "which X has the most Y", totals per group, top N, averages per category. Runs server-side and returns only grouped rows in one call. Limit: 50,000 source records per aggregation.

| Question | `$apply` expression |
|---|---|
| Total sales by status | `groupby((statuscode),aggregate(amount with sum as total))` |
| Account with the most revenue | `groupby((_parentaccountid_value),aggregate(estimatedvalue with sum as total))`, then sort client-side |
| Records per category | `groupby((category),aggregate($count as count))` |
| Average deal size by region | `groupby((region),aggregate(amount with average as avg))` |

```python
def apply_query(entity_set, apply_expr):
    """Run a $apply aggregation; returns a list of result dicts."""
    url = f"{env}/api/data/v9.2/{entity_set}?$apply={apply_expr}"
    req = urllib.request.Request(url, headers=headers.copy())
    with urllib.request.urlopen(req, timeout=150) as resp:
        return json.loads(resp.read()).get("value", [])

# Count and sum by status
for row in apply_query("opportunities",
        "groupby((statuscode),aggregate($count as count,estimatedvalue with sum as total_value))"):
    print(f"Status {row['statuscode']}: {row['count']} records, {row['total_value']:,.0f}")

# Top 10 accounts by total deal value
results = apply_query("opportunities",
    "groupby((_parentaccountid_value),aggregate(estimatedvalue with sum as total))")
for r in sorted(results, key=lambda r: r.get("total", 0), reverse=True)[:10]:
    print(f"Account {r['_parentaccountid_value']}: {r['total']:,.0f}")
```

## When `$apply` does not fit

`$apply` works within one entity set only. For cross-table aggregation prefer a server-side `client.query.sql()` JOIN or `client.query.fetchxml()` link-entity. When neither can express it, pull each table with a minimal select and merge in pandas:

```python
import pandas as pd

df_a = client.query.builder("prefix_tablea") \
    .select("prefix_keycolumn", "prefix_metric").execute().to_dataframe()
df_b = client.query.builder("prefix_tableb") \
    .select("prefix_keycolumn", "prefix_dimension").execute().to_dataframe()

merged = pd.merge(df_a, df_b, on="prefix_keycolumn")
print(merged.groupby("prefix_dimension")["prefix_metric"].sum().nlargest(10))
```

Performance rules for client-side processing:

- Always select only needed columns — all columns on 100K rows is 10–20x more transfer.
- Use the builder's `.execute().to_dataframe()`, not raw HTTP page iteration.
- pandas `merge` + `groupby` on 100K–300K rows takes seconds; the network is the bottleneck.

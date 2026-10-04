# Jupyter Notebook Setup

Notebooks usually have no project `scripts/` folder, so `scripts/auth.py` is not on the path. Authenticate with `InteractiveBrowserCredential` directly — this is the one intended exception to the `scripts/auth.py` rule. Plain `.py` scripts always use `scripts/auth.py`.

## Prerequisites

```bash
pip install --upgrade PowerPlatform-Dataverse-Client pandas matplotlib seaborn azure-identity
```

`pandas>=2.0.0` is a required SDK dependency and installs automatically with `--upgrade`.

## Notebook cells

```python
# Cell 1: client
from azure.identity import InteractiveBrowserCredential
from PowerPlatform.Dataverse.client import DataverseClient

client = DataverseClient(
    base_url="https://contoso.crm.dynamics.com",  # replace with your environment URL
    credential=InteractiveBrowserCredential(),
)
```

```python
# Cell 2: load straight into pandas
df = client.query.builder("account") \
    .select("name", "industrycode", "revenue", "numberofemployees") \
    .execute() \
    .to_dataframe()
df.head()
```

To read the environment URL from the project's `.env` instead of hard-coding it, load it in Cell 1 — a fresh kernel does not read `.env` on its own:

```python
import os
from pathlib import Path

for p in (Path.cwd() / ".env", Path.cwd().parent / ".env"):
    if p.exists():
        for line in p.read_text().splitlines():
            s = line.strip()
            if s and not s.startswith("#") and "=" in s:
                k, _, v = s.partition("=")
                os.environ.setdefault(k.strip(), v.strip())
        break

base_url = os.environ["DATAVERSE_URL"].rstrip("/")
```

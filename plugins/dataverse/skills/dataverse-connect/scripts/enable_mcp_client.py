#!/usr/bin/env python3
"""
enable_mcp_client.py - Allow an app registration to use the Dataverse MCP server.

Reads MCP_CLIENT_ID from .env and makes sure a matching, enabled record exists
in the `allowedmcpclient` table:
  - record missing            -> create it with isenabled=true
  - record exists, disabled   -> set isenabled=true
  - record exists, enabled    -> no changes

Useful when the Dataverse CLI is not available to enable the client.

Usage:
    python scripts/enable_mcp_client.py

Requires auth.py in the same folder and a .env with DATAVERSE_URL, TENANT_ID
and MCP_CLIENT_ID.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from auth import get_client, load_env


def find_client(client, app_id):
    """Return the allowedmcpclient record for app_id, or None."""
    result = client.records.list(
        "allowedmcpclient",
        filter=f"applicationid eq '{app_id}'",
        select=["allowedmcpclientid", "applicationid", "isenabled"],
        top=1,
    )
    return result.first()


def main():
    load_env()
    mcp_client_id = os.environ.get("MCP_CLIENT_ID")
    if not mcp_client_id:
        print("ERROR: MCP_CLIENT_ID not set in .env", flush=True)
        sys.exit(1)

    client = get_client()

    print(f"Looking up MCP client {mcp_client_id}...", flush=True)
    record = find_client(client, mcp_client_id)

    if record and record.get("isenabled"):
        print(f"Client {mcp_client_id} is already enabled. No changes needed.", flush=True)
        return

    if record:
        print("Client exists but is disabled. Enabling...", flush=True)
        client.records.update("allowedmcpclient", record["allowedmcpclientid"], {"isenabled": True})
        print(f"Done. Client {mcp_client_id} enabled.", flush=True)
    else:
        print("Client not found. Creating with isenabled=true...", flush=True)
        client.records.create("allowedmcpclient", {
            "applicationid": mcp_client_id,
            "name": "DV_CLI_MCP_Client",
            "uniquename": "new_DV_CLI_MCP_Client",
            "isenabled": True,
        })
        print(f"Done. Client {mcp_client_id} created and enabled.", flush=True)


if __name__ == "__main__":
    main()

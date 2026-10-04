---
name: azure-quantum
description: Expert knowledge for Azure Quantum development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when using QDK with Python/Q#, OpenQASM or hybrid jobs, Rigetti/IonQ targets, QIR jobs, or Bicep/CLI workspace deploys, and other Azure Quantum related development tasks.
compatibility: Requires network access. Uses mcp_microsoftdocs:microsoft_docs_fetch or WebFetch to retrieve documentation.
user-invocable: false
---
# Azure Quantum Skill

This skill provides expert guidance for Azure Quantum. Covers troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. It combines local quick-reference content with remote documentation fetching capabilities.

## How to Use This Skill

> **IMPORTANT for Agent**: Use the **Category Index** below to locate relevant sections. For categories with line ranges (e.g., `L35-L120`), use `read_file` with the specified lines. For categories with file links (e.g., `[security.md](security.md)`), use `read_file` on the linked reference file

This skill requires **network access** to fetch documentation content:
- **Preferred**: Use `mcp_microsoftdocs:microsoft_docs_fetch`. Returns Markdown.
- **Fallback**: Use `WebFetch`. Returns Markdown.

## Category Index

| Category | Lines | Description |
|----------|-------|-------------|
| Troubleshooting | L33-L40 | Troubleshooting Azure Quantum provider issues: diagnosing job failures and support/escalation policies and limits for IonQ, Quantinuum, and Rigetti hardware on Azure Quantum. |
| Best Practices | L41-L45 | Tools and techniques for testing, debugging, and validating quantum programs with the Azure Quantum Development Kit (QDK), including simulators, logging, and troubleshooting. |
| Decision Making | L46-L53 | Guidance on choosing job submission methods, comparing provider pricing and regions, and migrating Azure Quantum workspaces between geographic locations. |
| Architecture & Design Patterns | L54-L58 | Guidance on designing hybrid quantum-classical workflows in Azure Quantum, including architecture options, orchestration patterns, and when to offload tasks to quantum hardware. |
| Limits & Quotas | L59-L66 | Managing Azure Quantum API lifecycles, usage quotas, session limits/timeouts, and Rigetti hardware target constraints and capacity. |
| Security | L67-L77 | Managing secure access to Azure Quantum workspaces: RBAC and access control, bulk user assignment, ARM locks, managed identities, service principals, and secure handling of access keys. |
| Configuration | L78-L92 | Configuring Azure Quantum tools and targets: CLI workspaces, VS Code/QDK setup, simulators, hardware/error models, resource estimator, and IonQ/neutral atom device integration. |
| Integrations & Coding Patterns | L93-L106 | Using the Azure Quantum QDK with Python/Q#, including connecting workspaces, submitting and visualizing circuits, running OpenQASM and hybrid jobs, and configuring simulator/noise and resource models. |
| Deployment | L107-L111 | Deploying Azure Quantum workspaces via Bicep templates and submitting QIR-based quantum jobs using Azure CLI, including setup, configuration, and command workflows. |

### Troubleshooting
| Topic | URL |
|-------|-----|
| Diagnose and resolve common Azure Quantum issues | https://learn.microsoft.com/en-us/azure/quantum/azure-quantum-common-issues |
| Support and escalation policy for IonQ on Azure Quantum | https://learn.microsoft.com/en-us/azure/quantum/provider-support-ionq |
| Support policy for Quantinuum on Azure Quantum | https://learn.microsoft.com/en-us/azure/quantum/provider-support-quantinuum |
| Support policy for Rigetti on Azure Quantum | https://learn.microsoft.com/en-us/azure/quantum/provider-support-rigetti |

### Best Practices
| Topic | URL |
|-------|-----|
| Test and debug quantum programs with QDK tools | https://learn.microsoft.com/en-us/azure/quantum/testing-debugging |

### Decision Making
| Topic | URL |
|-------|-----|
| Choose how to submit jobs to Azure Quantum | https://learn.microsoft.com/en-us/azure/quantum/how-to-submit-jobs |
| Migrate Azure Quantum workspace data between regions | https://learn.microsoft.com/en-us/azure/quantum/migration-guide |
| Compare Azure Quantum provider pricing plans | https://learn.microsoft.com/en-us/azure/quantum/pricing |
| Check regional availability of Azure Quantum providers | https://learn.microsoft.com/en-us/azure/quantum/provider-global-availability |

### Architecture & Design Patterns
| Topic | URL |
|-------|-----|
| Choose hybrid quantum computing architectures in Azure Quantum | https://learn.microsoft.com/en-us/azure/quantum/hybrid-computing-overview |

### Limits & Quotas
| Topic | URL |
|-------|-----|
| Manage Azure Quantum preview API lifecycle and expiry | https://learn.microsoft.com/en-us/azure/quantum/azure-quantum-api-lifecycle |
| Review and manage Azure Quantum usage quotas | https://learn.microsoft.com/en-us/azure/quantum/azure-quantum-quotas |
| Manage Azure Quantum sessions and timeouts | https://learn.microsoft.com/en-us/azure/quantum/how-to-work-with-sessions |
| Rigetti provider targets and hardware limits in Azure Quantum | https://learn.microsoft.com/en-us/azure/quantum/provider-rigetti |

### Security
| Topic | URL |
|-------|-----|
| Bulk assign Azure Quantum workspace access via CSV | https://learn.microsoft.com/en-us/azure/quantum/bulk-add-users-to-a-workspace |
| Protect Azure Quantum resources with ARM locks | https://learn.microsoft.com/en-us/azure/quantum/how-to-set-resource-locks |
| Share Azure Quantum workspace using RBAC roles | https://learn.microsoft.com/en-us/azure/quantum/how-to-share-access-quantum-workspace |
| Configure Azure Quantum workspace access control | https://learn.microsoft.com/en-us/azure/quantum/manage-workspace-access |
| Authenticate to Azure Quantum using managed identity | https://learn.microsoft.com/en-us/azure/quantum/optimization-authenticate-managed-identity |
| Authenticate to Azure Quantum using service principals | https://learn.microsoft.com/en-us/azure/quantum/optimization-authenticate-service-principal |
| Manage Azure Quantum workspace access keys securely | https://learn.microsoft.com/en-us/azure/quantum/security-manage-access-keys |

### Configuration
| Topic | URL |
|-------|-----|
| Configure Azure Quantum workspaces with Azure CLI | https://learn.microsoft.com/en-us/azure/quantum/how-to-manage-quantum-workspaces-with-the-azure-cli |
| Configure VS Code QDK extension for Azure Quantum jobs | https://learn.microsoft.com/en-us/azure/quantum/how-to-submit-jobs-vscode |
| Use the QDK neutral atom device visualizer | https://learn.microsoft.com/en-us/azure/quantum/how-to-use-neutral-atom-visualizer |
| Install and configure QDK chemistry Python library | https://learn.microsoft.com/en-us/azure/quantum/install-qdk-chemistry |
| Install and configure QDK quantum simulators | https://learn.microsoft.com/en-us/azure/quantum/install-qdk-quantum-simulators |
| Configure and use IonQ targets in Azure Quantum | https://learn.microsoft.com/en-us/azure/quantum/provider-ionq |
| Configure hardware architecture models for the Quantum resource estimator | https://learn.microsoft.com/en-us/azure/quantum/qre-build-architecture-models |
| Define error correction and magic state models for resource estimation | https://learn.microsoft.com/en-us/azure/quantum/qre-build-error-correction-models |
| Build custom application models for the Quantum resource estimator | https://learn.microsoft.com/en-us/azure/quantum/qre-custom-applications |
| Access and customize Quantum resource estimator output | https://learn.microsoft.com/en-us/azure/quantum/qre-estimation-results |
| Use QDK commands and features in VS Code | https://learn.microsoft.com/en-us/azure/quantum/vscode-qdk-reference |

### Integrations & Coding Patterns
| Topic | URL |
|-------|-----|
| Connect Python QDK to Azure Quantum workspace | https://learn.microsoft.com/en-us/azure/quantum/how-to-connect-workspace |
| Submit Azure Quantum jobs with QDK Python integrations | https://learn.microsoft.com/en-us/azure/quantum/how-to-submit-jobs-python |
| Visualize Q# and OpenQASM circuits with QDK | https://learn.microsoft.com/en-us/azure/quantum/how-to-visualize-circuits |
| Run integrated hybrid quantum jobs with Adaptive RI in Azure Quantum | https://learn.microsoft.com/en-us/azure/quantum/hybrid-computing-integrated |
| Configure neutral atom noise models with QDK Python APIs | https://learn.microsoft.com/en-us/azure/quantum/neutral-atom-noise-models |
| Model multi-qubit gate noise with QDK Python | https://learn.microsoft.com/en-us/azure/quantum/qdk-multi-qubit-noise-models |
| Run OpenQASM programs with Azure Quantum QDK | https://learn.microsoft.com/en-us/azure/quantum/qdk-openqasm-integration |
| Build and configure QDK simulator noise models | https://learn.microsoft.com/en-us/azure/quantum/qdk-simulator-noise-models |
| Create application models from quantum frameworks for resource estimation | https://learn.microsoft.com/en-us/azure/quantum/qre-supported-applications |
| Submit formatted quantum circuits to Azure Quantum | https://learn.microsoft.com/en-us/azure/quantum/quickstart-microsoft-provider-format |

### Deployment
| Topic | URL |
|-------|-----|
| Deploy Azure Quantum workspaces using Bicep templates | https://learn.microsoft.com/en-us/azure/quantum/how-to-manage-quantum-workspaces-using-bicep |
| Submit QIR jobs to Azure Quantum with Azure CLI | https://learn.microsoft.com/en-us/azure/quantum/how-to-submit-jobs-azure-cli |
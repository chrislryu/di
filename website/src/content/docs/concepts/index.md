---
title: Core concepts
description: Build the vocabulary as you follow operations through the stack.
kind: index
sidebar:
  order: 0
---

Start with the request lifecycle, then follow the topics below as needed. You can begin the [single-request walkthrough](/walkthroughs/one-request/) immediately and return here when a new concept appears. Definitions also live in the [shared glossary](/glossary/).

1. [Request lifecycle](./request-lifecycle/): Text, prefill, decode, and streamed output.
2. [Scheduling](./scheduling/): Queues, continuous batches, and resource budgets.
3. [KV cache](./kv-cache/): State ownership, reuse, placement, and transfer.
4. [Parallelism](./parallelism/): Requests, tensors, layers, contexts, and experts.
5. [Disaggregated serving](./disaggregation/): Separate stage placement and its handoff cost.
6. [GPU and host topology](./topology/): Processes, memory, links, and NIC placement.
7. [Communication primitives](./communication/): Peer transfers, collectives, and MoE movement.
8. [Networking and RDMA](./networking/): Providers, registered memory, EFA, and completions.
9. [Performance and reliability](./performance/): SLOs, measurements, bottlenecks, and failure boundaries.

Each page connects a mental model to the inspected implementation. Read the [architecture guides](/architecture/) for component ownership and the [decision guides](/decisions/) when applying these concepts to a workload.

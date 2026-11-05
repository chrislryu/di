# Project context

This workspace helps a developer onboard into distributed AI/ML computing.
Assume software development experience but limited familiarity with distributed
inference, GPU communication, and high-performance networking.

`repositories/` contains NIXL, Dynamo, vLLM, SGLang, AWS OFI NCCL, NCCL,
libfabric, Mooncake, DeepInfer, and DeepEP. The goal is an architecture guide
for each repository, with an introduction explaining how these projects fit
together in the bigger picture.

Each guide should explain why the project exists from a customer perspective,
then provide a high-level picture, top-down architecture walkthrough, major
components, and decision gates. Explain unfamiliar concepts as they arise.

Ground explanations in the local source and link to relevant code. Distinguish
optional integrations and alternatives from required dependencies.

Detailed structure, deliverables, and execution steps belong in the separate plan.

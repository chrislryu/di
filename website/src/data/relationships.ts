// Evidence IDs are defined in research/evidence.json. These are selected paths,
// not a complete integration matrix or a promise of binary compatibility.
export const relationships = [
  {from:'dynamo',to:'vllm',kind:'Optional integration · control',text:'Dynamo’s vLLM worker adapter submits generation work to an engine.',evidence:'dynamo-vllm'},
  {from:'vllm',to:'nccl',kind:'Selected execution path · tensor data',text:'Model layers invoke collective operations through the device communicator; NCCL is one implementation used during model execution.',evidence:'vllm-nccl'},
  {from:'vllm',to:'nixl',kind:'Optional integration · data',text:'The NIXL KV connector moves cache blocks when explicitly configured.',evidence:'vllm-nixl'},
  {from:'vllm',to:'mooncake',kind:'Optional integration · data',text:'The Mooncake Store connector provides shared-cache access.',evidence:'vllm-mooncake'},
  {from:'deepep',to:'nccl',kind:'Required dependency · selected release',text:'This DeepEP release uses NCCL Gin for its communication backend.',evidence:'deepep-nccl'},
  {from:'nccl',to:'aws-ofi-nccl',kind:'Optional integration · network data',text:'NCCL can load an external network plugin; AWS OFI NCCL implements that interface.',evidence:'nccl-ofi'},
  {from:'aws-ofi-nccl',to:'libfabric',kind:'Required dependency · network data',text:'The plugin submits fabric operations through libfabric; EFA is one provider.',evidence:'ofi-fabric'},
] as const;

export function getContractName(contractFQN?: string) {
  if (!contractFQN) return undefined;
  const [, contractName] = contractFQN.split(':');
  return contractName;
}

export function getContractName(contractFQN: string) {
  const [contractName, ,] = contractFQN.split(':');
  return contractName;
}

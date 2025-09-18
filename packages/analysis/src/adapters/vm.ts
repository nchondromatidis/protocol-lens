import { createTestClient, type TestClient, type Account } from 'viem';
import { createTevmTransport, tevmReady, type TevmTransport } from 'tevm';

export async function buildTevmClient(nodeAccount: Account): Promise<
  TestClient<'anvil', TevmTransport>
> {
  const tevmTransport = createTevmTransport({
    miningConfig: { type: 'auto' },
  });
  const client = createTestClient({
    account: nodeAccount,
    transport: tevmTransport,
    mode: 'anvil',
  });
  await tevmReady(client);
  return client;
}

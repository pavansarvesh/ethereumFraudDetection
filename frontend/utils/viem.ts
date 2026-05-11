import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

const blockNumber = await publicClient.getBlockNumber()

console.log(blockNumber);

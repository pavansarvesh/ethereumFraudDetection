import { createPublicClient, createWalletClient, custom, isAddress, parseEther } from 'viem'
import { sepolia } from 'viem/chains'

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found. Install a wallet extension to continue.')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    })
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0xaa36a7',
            chainName: 'Sepolia',
            nativeCurrency: {
              name: 'SepoliaETH',
              symbol: 'SEP',
              decimals: 18,
            },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      })
    } else {
      throw switchError
    }
  }

  const walletClient = createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  })
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  })

  const [account] = await walletClient.requestAddresses()

  return {
    walletClient,
    publicClient,
    account,
  }
}

export async function refreshWalletBalance(
  publicClient: Awaited<ReturnType<typeof createPublicClient>>,
  account: `0x${string}`,
) {
  return publicClient.getBalance({
    address: account,
  })
}

export async function sendEthTransaction({
  walletClient,
  publicClient,
  account,
  recipient,
  amountEth,
}: {
  walletClient: Awaited<ReturnType<typeof createWalletClient>>
  publicClient: Awaited<ReturnType<typeof createPublicClient>>
  account: `0x${string}`
  recipient: string
  amountEth: string
}) {
  if (!isAddress(recipient)) {
    throw new Error('Enter a valid recipient address.')
  }

  const normalizedAmount = amountEth.trim()
  if (!normalizedAmount) {
    throw new Error('Enter an ETH amount to send.')
  }

  const hash = await walletClient.sendTransaction({
    chain: sepolia,
    account,
    to: recipient as `0x${string}`,
    value: parseEther(normalizedAmount),
  })

  await publicClient.waitForTransactionReceipt({ hash })

  return hash
}
import { useMemo, useState } from 'react'
import { formatEther } from 'viem'
import './App.css'

import {
  connectWallet,
  refreshWalletBalance,
  sendEthTransaction,
} from './wallet'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

function App() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletClient, setWalletClient] = useState<any>(null)
  const [publicClient, setPublicClient] = useState<any>(null)
  const [balance, setBalance] = useState<bigint | null>(null)
  const [recipient, setRecipient] = useState('')
  const [amountEth, setAmountEth] = useState('')
  const [message, setMessage] = useState('Connect a wallet to view your balance and send Sepolia ETH.')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  async function handleConnect() {
    try {
      setConnectionStatus('connecting')
      setMessage('Opening your wallet...')

      const result = await connectWallet()

      setWalletClient(result.walletClient)
      setPublicClient(result.publicClient)
      setWalletAddress(result.account ?? null)
      setConnectionStatus('connected')
      setTxHash(null)

      try {
        const nextBalance = await refreshWalletBalance(
          result.publicClient,
          result.account as `0x${string}`,
        )

        setBalance(nextBalance)
        setMessage('Wallet connected. You can review the balance and send ETH below.')
      } catch {
        setBalance(null)
        setMessage('Wallet connected, but the balance could not be loaded right now.')
      }

    } catch (err) {
      setConnectionStatus('error')
      setMessage(err instanceof Error ? err.message : 'Unable to connect wallet.')
    }
  }

  async function handleSend() {
    if (!walletClient || !publicClient || !walletAddress) {
      setMessage('Connect a wallet first.')
      return
    }

    try {
      setIsSending(true)
      setMessage('Sending transaction...')

      const hash = await sendEthTransaction({
        walletClient,
        publicClient,
        account: walletAddress as `0x${string}`,
        recipient,
        amountEth,
      })

      const nextBalance = await refreshWalletBalance(
        publicClient,
        walletAddress as `0x${string}`,
      )

      setBalance(nextBalance)
      setTxHash(hash)
      setRecipient('')
      setAmountEth('')
      setMessage('Transaction confirmed.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Transaction failed.')
    } finally {
      setIsSending(false)
    }
  }

  const statusLabel = useMemo(() => {
    if (connectionStatus === 'connected' && walletAddress) {
      return 'Connected'
    }

    if (connectionStatus === 'connecting') {
      return 'Connecting'
    }

    if (connectionStatus === 'error') {
      return 'Needs attention'
    }

    return 'Disconnected'
  }, [connectionStatus, walletAddress])

  const statusTone = connectionStatus === 'connected'
    ? 'connected'
    : connectionStatus === 'connecting'
      ? 'connecting'
      : connectionStatus === 'error'
        ? 'error'
        : 'disconnected'

  const formattedBalance = balance === null ? '0.0000' : formatEther(balance)
  const compactAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'No wallet linked'

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <main className="wallet-dashboard">
        <section className="hero-card">
          <div className={`status-badge ${statusTone}`}>
            <span className="status-dot" />
            {statusLabel}
          </div>

          <p className="eyebrow">Ethereum wallet control</p>
          <h1>Connect, inspect, and send from one clean screen.</h1>
          <p className="hero-copy">A focused Sepolia wallet view with a live connectivity badge, your address, balance, and a fast transfer form.</p>

          <div className="hero-actions">
            <button className="primary-button" onClick={handleConnect} disabled={connectionStatus === 'connecting'}>
              {connectionStatus === 'connected' ? 'Reconnect wallet' : connectionStatus === 'connecting' ? 'Connecting...' : 'Connect MetaMask'}
            </button>
            <div className="address-chip">{compactAddress}</div>
          </div>
        </section>

        <section className="panel-grid">
          <article className="info-panel">
            <div className="panel-label">Wallet address</div>
            <div className="panel-value address-value">{walletAddress ?? 'Waiting for connection'}</div>
          </article>

          <article className="info-panel">
            <div className="panel-label">ETH balance</div>
            <div className="panel-value balance-value">{formattedBalance} <span>ETH</span></div>
          </article>
        </section>

        <section className="send-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow muted">Transfer ETH</p>
              <h2>Send Sepolia ETH</h2>
            </div>
            <div className="panel-note">Sepolia only</div>
          </div>

          <div className="form-grid">
            <label>
              <span>Recipient address</span>
              <input
                type="text"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="0x..."
              />
            </label>

            <label>
              <span>Amount in ETH</span>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={amountEth}
                onChange={(event) => setAmountEth(event.target.value)}
                placeholder="0.05"
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-button" onClick={handleSend} disabled={isSending || connectionStatus !== 'connected'}>
              {isSending ? 'Sending...' : 'Send ETH'}
            </button>
            <p className="message-text">{message}</p>
          </div>

          {txHash ? <p className="tx-hash">Latest transaction: {txHash}</p> : null}
        </section>
      </main>
    </div>
  )
}

export default App
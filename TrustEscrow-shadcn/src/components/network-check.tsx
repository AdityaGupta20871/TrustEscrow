import { useEffect, useState } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'
import { AlertCircle, Check, Server } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
// import { sepolia } from 'wagmi/chains' // Commented out for Anvil testing

// Define chain IDs
// const SEPOLIA_CHAIN_ID = 11155111  // Commented out for Anvil testing
const HARDHAT_CHAIN_ID = 31337  // Anvil/Hardhat local network

export function NetworkCheck() {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  const [showAlert, setShowAlert] = useState(false)
  
  useEffect(() => {
    // For Anvil testing, only check if on Hardhat/Anvil network
    if (chainId !== HARDHAT_CHAIN_ID) {
      setShowAlert(true)
    } else {
      setShowAlert(false)
    }
  }, [chainId])
  
  if (!showAlert) {
    return (
      <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-900">
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle>Connected to Anvil/Hardhat network</AlertTitle>
        <AlertDescription>
          Your wallet is correctly connected to the local Anvil/Hardhat network.
        </AlertDescription>
      </Alert>
    )
  }
  
  // Get the chain name from chainId
  const getNetworkName = () => {
    if (chainId === 31337) return 'Hardhat Local Network';
    // All other networks are "not Anvil" for simplicity during testing
    return 'an unsupported network';
  };
  
  return (
    <Alert className="mt-4 border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-900">
      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <AlertTitle>Network Mismatch</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          This application is configured for Anvil/Hardhat local testing. 
          You are currently connected to {getNetworkName()}.
        </p>
        <div className="flex gap-2">          
          <Button 
            variant="default" 
            size="sm" 
            className="w-fit flex items-center gap-1"
            disabled={isPending || !switchChain}
            onClick={() => switchChain?.({ chainId: HARDHAT_CHAIN_ID })}
          >
            <Server className="h-3 w-3" />
            {isPending ? 'Switching...' : 'Switch to Anvil/Hardhat'}
          </Button>
          
          {/* Sepolia button commented out for Anvil testing
          <Button 
            variant="outline" 
            size="sm" 
            className="w-fit"
            disabled={isPending || !switchChain}
            onClick={() => switchChain?.({ chainId: sepolia.id })}
          >
            {isPending ? 'Switching...' : 'Switch to Sepolia'}
          </Button>
          */}
        </div>
      </AlertDescription>
    </Alert>
  )
}

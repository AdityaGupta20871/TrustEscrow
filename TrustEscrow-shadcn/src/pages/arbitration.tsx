import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'ethers'
import { ARBITRATION_ADDRESS } from '@/lib/contracts'
import { arbitrationAbi } from '@/lib/abis/arbitrationAbi'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { Shield, Scale, CheckCircle, Loader2 } from 'lucide-react'

type ArbitratorInfo = {
  isRegistered: boolean
  stake: bigint
}

export function Arbitration() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  
  const [arbitrators, setArbitrators] = useState<string[]>([])
  const [arbitratorInfo, setArbitratorInfo] = useState<ArbitratorInfo | null>(null)
  const [stakeAmount, setStakeAmount] = useState('0.1')
  const [isLoading, setIsLoading] = useState(true)
  
  // Get minimum stake requirement
  const { data: minStake } = useReadContract({
    address: ARBITRATION_ADDRESS as `0x${string}`,
    abi: arbitrationAbi,
    functionName: 'minStake',
    query: {
      enabled: !!ARBITRATION_ADDRESS,
    },
  })
  
  // Get all arbitrators
  const { data: allArbitrators } = useReadContract({
    address: ARBITRATION_ADDRESS as `0x${string}`,
    abi: arbitrationAbi,
    functionName: 'getAllArbitrators',
    query: {
      enabled: !!ARBITRATION_ADDRESS,
    },
  })
  
  // Get current user's arbitrator info
  const { data: userInfo } = useReadContract({
    address: ARBITRATION_ADDRESS as `0x${string}`,
    abi: arbitrationAbi,
    functionName: 'getArbitratorInfo',
    args: [address],
    query: {
      enabled: !!address && !!ARBITRATION_ADDRESS,
    },
  })
  
  // Write contract transaction
  const { data: hash, isPending, writeContract } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
  })
  
  useEffect(() => {
    if (allArbitrators) {
      setArbitrators(allArbitrators as string[])
    }
    
    if (userInfo) {
      const [isRegistered, stake] = userInfo as [boolean, bigint]
      setArbitratorInfo({ isRegistered, stake })
    }
    
    if (minStake) {
      // Set default stake to minimum required + 0.01 ETH
      setStakeAmount(formatEther(minStake as bigint + parseEther('0.01')))
    }
    
    if (allArbitrators !== undefined && userInfo !== undefined) {
      setIsLoading(false)
    }
  }, [allArbitrators, userInfo, minStake, isSuccess])
  
  const registerAsArbitrator = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to register as an arbitrator.",
        variant: "destructive"
      })
      return
    }
    
    try {
      const stakeInWei = parseEther(stakeAmount)
      
      if (minStake && stakeInWei < (minStake as bigint)) {
        toast({
          title: "Stake too low",
          description: `Minimum stake required is ${formatEther(minStake as bigint)} ETH.`,
          variant: "destructive"
        })
        return
      }
      
      writeContract({
        address: ARBITRATION_ADDRESS as `0x${string}`,
        abi: arbitrationAbi,
        functionName: 'registerAsArbitrator',
        value: stakeInWei
      })
    } catch (error) {
      toast({
        title: "Transaction Error",
        description: "Failed to register as arbitrator. Check the console for details.",
        variant: "destructive"
      })
      console.error("Transaction error:", error)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Shield className="w-16 h-16 text-primary/30" />
        <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
        <p className="text-muted-foreground text-center max-w-[500px]">
          Please connect your Ethereum wallet to view arbitration information.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-primary/30 animate-spin" />
        <h2 className="text-xl font-medium">Loading arbitration data...</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Arbitration</h2>
        <p className="text-muted-foreground">
          Register as an arbitrator to help resolve disputes and earn fees.
        </p>
      </div>

      <Separator />
      
      {arbitratorInfo?.isRegistered ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="mr-2 h-5 w-5 text-primary" />
              You are registered as an Arbitrator
            </CardTitle>
            <CardDescription>
              You have staked {formatEther(arbitratorInfo.stake)} ETH to provide arbitration services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              As a registered arbitrator, you can help resolve disputes between parties in escrow contracts. 
              When a dispute is raised, you'll be able to review the evidence and make a fair judgment.
            </p>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Minimum stake required: {minStake ? formatEther(minStake as bigint) : '0.1'} ETH
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Register as an Arbitrator</CardTitle>
            <CardDescription>
              Stake ETH to become an arbitrator and earn fees for resolving disputes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stake">Stake Amount (ETH)</Label>
              <Input
                id="stake"
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                min={minStake ? formatEther(minStake as bigint) : '0.1'}
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Minimum stake required: {minStake ? formatEther(minStake as bigint) : '0.1'} ETH. Higher stakes increase your chances of being selected for dispute resolution.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={registerAsArbitrator}
              disabled={isPending || isConfirming}
              className="w-full"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Scale className="mr-2 h-4 w-4" />
                  Register as Arbitrator
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Active Arbitrators</h3>
        
        {arbitrators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-muted/40 rounded-lg space-y-2">
            <Scale className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No arbitrators have registered yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {arbitrators.map((arbitratorAddress, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center">
                    <Scale className="mr-2 h-4 w-4" />
                    Arbitrator
                  </CardTitle>
                  <CardDescription className="font-mono">
                    {arbitratorAddress.slice(0, 6)}...{arbitratorAddress.slice(-4)}
                    {arbitratorAddress === address && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        You
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stake:</span>
                      <span className="font-medium">
                        {/* We would need to fetch this data for each arbitrator */}
                        {arbitratorAddress === address ? formatEther(arbitratorInfo?.stake || 0n) : '---'} ETH
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

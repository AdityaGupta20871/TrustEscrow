import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { readContract } from '@wagmi/core'
import { config } from '@/lib/wagmi'
import { escrowAbi } from '@/lib/abis/escrowAbi'
import { formatEther, formatAddress } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Shield, Clock, Check, AlertTriangle, Loader2 } from 'lucide-react'

enum MilestoneStatus {
  Pending = 0,
  Confirmed = 1,
  Released = 2,
  Disputed = 3
}

type MilestoneInfo = {
  id: number
  amount: bigint
  status: MilestoneStatus
  confirmations: number
}

type EscrowInfo = {
  balance: bigint
  requiredConfirmations: number
  timelock: number
  totalMilestones: number
  participants: string[]
  milestones: MilestoneInfo[]
}

export function EscrowDetails() {
  const { address } = useParams<{ address: string }>()
  const { address: userAddress, isConnected } = useAccount()
  const { toast } = useToast() // Used in confirm/release/dispute functions
  
  const [escrowInfo, setEscrowInfo] = useState<EscrowInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Get escrow general info
  const { data: basicInfo } = useReadContract({
    address: address as `0x${string}`,
    abi: escrowAbi,
    functionName: 'getEscrowInfo',
    query: {
      enabled: !!address,
    },
  })
  
  // Get participants
  const { data: participants } = useReadContract({
    address: address as `0x${string}`,
    abi: escrowAbi,
    functionName: 'getParticipants',
    query: {
      enabled: !!address && !!basicInfo,
    },
  })
  
  // Write contract calls
  const { data: hash, isPending, writeContract } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ 
    hash,
  })
  
  // Fetch milestone data
  useEffect(() => {
    const fetchMilestoneData = async () => {
      if (!basicInfo || !participants || !address) return
      
      const [balance, requiredConfirmations, timelock, totalMilestones] = basicInfo as unknown as [bigint, bigint, bigint, bigint]
      
      // Fetch data for each milestone directly from contract
      const milestonesData: MilestoneInfo[] = []
      for (let i = 0; i < Number(totalMilestones); i++) {
        try {
          // Use contract calls to get milestone data
          const milestoneAmount = await readContract(config, {
              address: address as `0x${string}`,
              abi: escrowAbi,
              functionName: 'getMilestoneAmount',
              args: [BigInt(i)]
          })
          
          const milestoneStatus = await readContract(config, {
              address: address as `0x${string}`,
              abi: escrowAbi,
              functionName: 'getMilestoneStatus',
              args: [BigInt(i)]
          })
          
          const confirmationCount = await readContract(config, {
              address: address as `0x${string}`,
              abi: escrowAbi,
              functionName: 'getMilestoneConfirmations',
              args: [BigInt(i)]
          })
          
          milestonesData.push({
            id: i,
            amount: milestoneAmount as bigint,
            status: Number(milestoneStatus) as MilestoneStatus,
            confirmations: Number(confirmationCount)
          })
        } catch (error) {
          console.error(`Error fetching milestone ${i}:`, error)
          // Fallback to estimate if contract call fails
          milestonesData.push({
            id: i,
            amount: (BigInt(balance) / BigInt(totalMilestones)),
            status: MilestoneStatus.Pending,
            confirmations: 0
          })
        }
      }
      
      setEscrowInfo({
        balance,
        requiredConfirmations: Number(requiredConfirmations),
        timelock: Number(timelock),
        totalMilestones: Number(totalMilestones),
        participants: participants as string[],
        milestones: milestonesData
      })
      
      setIsLoading(false)
    }
    
    fetchMilestoneData()
  }, [address, basicInfo, participants, isSuccess])
  
  // Confirm milestone
  const confirmMilestone = (milestoneId: number) => {
    if (!isConnected || !address) return
    
    writeContract({
      address: address as `0x${string}`,
      abi: escrowAbi,
      functionName: 'confirmMilestone',
      args: [BigInt(milestoneId)]
    })
  }
  
  // Release milestone
  const releaseMilestone = (milestoneId: number) => {
    if (!isConnected || !address) return
    
    writeContract({
      address: address as `0x${string}`,
      abi: escrowAbi,
      functionName: 'releaseMilestone',
      args: [BigInt(milestoneId)]
    })
  }
  
  // Start dispute
  const startDispute = (milestoneId: number) => {
    if (!isConnected || !address) return
    
    writeContract({
      address: address as `0x${string}`,
      abi: escrowAbi,
      functionName: 'startDispute',
      args: [BigInt(milestoneId)]
    })
  }
  
  // Get status text
  const getStatusText = (status: MilestoneStatus) => {
    switch (status) {
      case MilestoneStatus.Pending:
        return 'Pending'
      case MilestoneStatus.Confirmed:
        return 'Confirmed'
      case MilestoneStatus.Released:
        return 'Released'
      case MilestoneStatus.Disputed:
        return 'Disputed'
      default:
        return 'Unknown'
    }
  }
  
  // Get status color
  const getStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case MilestoneStatus.Pending:
        return 'text-yellow-500'
      case MilestoneStatus.Confirmed:
        return 'text-blue-500'
      case MilestoneStatus.Released:
        return 'text-green-500'
      case MilestoneStatus.Disputed:
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }
  
  // Check if user can confirm
  const canConfirm = (milestone: MilestoneInfo) => {
    if (!escrowInfo || !userAddress) return false
    
    return (
      escrowInfo.participants.includes(userAddress) &&
      milestone.status === MilestoneStatus.Pending
    )
  }
  
  // Check if user can release
  const canRelease = (milestone: MilestoneInfo) => {
    if (!escrowInfo || !userAddress) return false
    
    return (
      escrowInfo.participants.includes(userAddress) &&
      milestone.status === MilestoneStatus.Confirmed &&
      milestone.confirmations >= escrowInfo.requiredConfirmations
    )
  }
  
  // Check if user can dispute
  const canDispute = (milestone: MilestoneInfo) => {
    if (!escrowInfo || !userAddress) return false
    
    return (
      escrowInfo.participants.includes(userAddress) &&
      (milestone.status === MilestoneStatus.Pending || milestone.status === MilestoneStatus.Confirmed)
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-primary/30 animate-spin" />
        <h2 className="text-xl font-medium">Loading escrow details...</h2>
      </div>
    )
  }

  if (!escrowInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Shield className="w-12 h-12 text-destructive/30" />
        <h2 className="text-xl font-medium">Escrow not found</h2>
        <p className="text-muted-foreground">This escrow contract does not exist or has been removed.</p>
        <Link to="/">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Escrow Details</h2>
          <p className="text-muted-foreground">
            {formatAddress(address || '')}
          </p>
        </div>
        <Link to="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Separator />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatEther(escrowInfo.balance)} ETH
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Required Confirmations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {escrowInfo.requiredConfirmations} of {escrowInfo.participants.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time-Lock Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(escrowInfo.timelock / 86400)} days
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {escrowInfo.totalMilestones}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Participants</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {escrowInfo.participants.map((participant, index) => (
            <div key={index} className="p-2 border rounded-md flex justify-between items-center">
              <span className="font-mono text-sm">{formatAddress(participant)}</span>
              {participant === userAddress && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">You</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Milestones</h3>
        <div className="space-y-4">
          {escrowInfo.milestones.map((milestone) => (
            <Card key={milestone.id} className="overflow-hidden">
              <div className={`h-1 ${getStatusColor(milestone.status)} bg-opacity-30`}></div>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Milestone {milestone.id + 1}</span>
                  <span className={`text-sm ${getStatusColor(milestone.status)}`}>
                    {getStatusText(milestone.status)}
                  </span>
                </CardTitle>
                <CardDescription>
                  {formatEther(milestone.amount)} ETH
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Confirmations: {milestone.confirmations} of {escrowInfo.requiredConfirmations} required
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 flex-wrap">
                {canConfirm(milestone) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => confirmMilestone(milestone.id)}
                    disabled={isPending || isConfirming}
                  >
                    {isPending || isConfirming ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                    Confirm
                  </Button>
                )}
                
                {canRelease(milestone) && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => releaseMilestone(milestone.id)}
                    disabled={isPending || isConfirming}
                  >
                    {isPending || isConfirming ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                    Release Funds
                  </Button>
                )}
                
                {canDispute(milestone) && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setSelectedMilestone(milestone.id)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Dispute
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Start Dispute</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to start a dispute for Milestone {milestone.id + 1}? This will require arbitration to resolve.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            startDispute(milestone.id)
                            setSelectedMilestone(null)
                          }}
                          disabled={isPending || isConfirming}
                        >
                          {isPending || isConfirming ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 mr-1" />
                          )}
                          Start Dispute
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

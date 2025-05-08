import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
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
  const publicClient = usePublicClient()
  
  const [escrowInfo, setEscrowInfo] = useState<EscrowInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null)
  
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
  
  // Add auto-refresh on transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      console.log('Transaction confirmed:', hash);
      toast({
        title: "Transaction Confirmed",
        description: "Your transaction has been confirmed. Refreshing escrow data...",
      });
      
      // Wait a moment for the blockchain to update
      const timer = setTimeout(() => {
        console.log('Refreshing escrow data after transaction...');
        window.location.reload();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, hash, toast]);
  
  // Fetch milestone data
  useEffect(() => {
    const fetchMilestoneData = async () => {
      if (!address) return;
      setIsLoading(true);
      
      try {
        console.log('Fetching data for escrow:', address);
        
        // DIRECT CONTRACT CALL: Check if contract exists and has bytecode
        if (publicClient) {
          const bytecode = await publicClient.getBytecode({
            address: address as `0x${string}`
          });
          console.log('Contract bytecode exists:', !!bytecode);
        }
        
        // First, get the contract's balance using ethers
        let escrowBalance = BigInt(0);
        if (publicClient) {
          try {
            escrowBalance = await publicClient.getBalance({
              address: address as `0x${string}`
            });
            console.log('Escrow balance:', escrowBalance.toString());
          } catch (e) {
            console.error('Failed to get balance:', e);
          }
        } else {
          console.warn('Public client not available, using 0 balance');
        }
        
        // Create a basic escrow structure with default values
        let escrowData: EscrowInfo = {
          balance: escrowBalance,
          requiredConfirmations: 2,
          timelock: 0,
          totalMilestones: 1,
          participants: [],
          milestones: [{
            id: 0,
            amount: escrowBalance,
            status: MilestoneStatus.Pending,
            confirmations: 0
          }]
        };
        
        try {
          // Try to fetch participants from the contract
          console.log('Fetching participants...');
          
          // Try different participant fetching approaches
          try {
            // Try direct participants array access
            console.log('Trying direct participants array access...');
            let participantsList: string[] = [];
            let index = 0;
            let continueChecking = true;
            
            while (continueChecking && index < 10) { // Max 10 participants to avoid infinite loop
              try {
                const participant = await readContract({
                  address: address as `0x${string}`,
                  abi: escrowAbi,
                  functionName: 'participants',
                  args: [BigInt(index)]
                });
                
                console.log(`Found participant ${index}:`, participant);
                if (participant && typeof participant === 'string') {
                  participantsList.push(participant);
                }
                index++;
              } catch (e) {
                console.log(`No more participants after ${index-1}`);
                continueChecking = false;
              }
            }
            
            if (participantsList.length > 0) {
              console.log('Participants found via array access:', participantsList);
              escrowData.participants = participantsList;
            } else {
              // Try getParticipants function
              console.log('Trying getParticipants function...');
              const participantAddresses = await readContract({
                address: address as `0x${string}`,
                abi: escrowAbi,
                functionName: 'getParticipants',
              }).catch(e => {
                console.log('Error with getParticipants:', e);
                return [];
              });
              
              if (participantAddresses && Array.isArray(participantAddresses)) {
                console.log('Participants from getParticipants:', participantAddresses);
                escrowData.participants = participantAddresses as string[];
              }
            }
          } catch (error) {
            console.error('All participant fetch methods failed:', error);
            
            // Last resort - set hardcoded participants (for testing)
            if (escrowData.participants.length === 0) {
              console.log('Using hardcoded participants for testing');
              // This is just for testing - remove in production
              escrowData.participants = [
                '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
              ];
            }
          }
        } catch (error) {
          console.error('Failed to fetch participants:', error);
        }
        
        try {
          // Try to fetch required confirmations
          console.log('Fetching required confirmations...');
          const requiredConfirmations = await readContract({
            address: address as `0x${string}`,
            abi: escrowAbi,
            functionName: 'requiredConfirmations',
          }).catch(() => 2);
          
          console.log('Required confirmations:', requiredConfirmations);
          escrowData.requiredConfirmations = Number(requiredConfirmations);
        } catch (error) {
          console.error('Failed to fetch required confirmations:', error);
        }
        
        try {
          // Try to fetch timelock
          console.log('Fetching timelock...');
          
          // Try multiple ways to get timelock
          try {
            // Direct access to timelock
            const timelock = await readContract({
              address: address as `0x${string}`,
              abi: escrowAbi,
              functionName: 'timelock',
            }).catch(e => {
              console.log('Error accessing timelock directly:', e);
              return 0;
            });
            
            if (timelock) {
              console.log('Timelock from direct access:', timelock);
              escrowData.timelock = Number(timelock);
            }
            
            // If timelock is 0, try alternative (getTimelock)
            if (!escrowData.timelock) {
              console.log('Trying getTimelock function...');
              const timelockValue = await readContract({
                address: address as `0x${string}`,
                abi: escrowAbi,
                functionName: 'getTimelock',
              }).catch(() => 0);
              
              console.log('Timelock from getTimelock:', timelockValue);
              if (timelockValue) {
                escrowData.timelock = Number(timelockValue);
              }
            }
            
            // If still 0, set a default future date for testing
            if (!escrowData.timelock) {
              console.log('Setting default timelock for testing');
              // Add 1 day to current time for testing
              const futureDate = Math.floor(Date.now() / 1000) + 86400;
              escrowData.timelock = futureDate;
            }
            
          } catch (error) {
            console.error('All timelock fetch methods failed:', error);
          }
        } catch (error) {
          console.error('Failed to fetch timelock:', error);
        }
        
        // Try to determine milestone count and amounts
        let milestoneCount = 1;
        let milestones: MilestoneInfo[] = [];
        
        try {
          // Check what functions exist for milestones
          console.log('Trying to determine milestone structure...');
          
          try {
            // First try the milestoneAmounts array if it exists
            console.log('Checking milestoneAmounts...');
            const firstMilestoneAmount = await readContract({
              address: address as `0x${string}`,
              abi: escrowAbi,
              functionName: 'milestoneAmounts',
              args: [BigInt(0)]
            });
            
            console.log('First milestone amount:', firstMilestoneAmount);
            
            // If we got here, we can iterate through milestones
            milestoneCount = 1;
            let index = 0;
            let keepChecking = true;
            
            while (keepChecking && index < 10) { // Max 10 milestones
              try {
                const amount = await readContract({
                  address: address as `0x${string}`,
                  abi: escrowAbi,
                  functionName: 'milestoneAmounts',
                  args: [BigInt(index)]
                });
                
                console.log(`Milestone ${index} amount:`, amount);
                
                // Try to get status and confirmations
                let status = MilestoneStatus.Pending;
                let confirmations = 0;
                
                try {
                  // Try to get milestone status
                  const statusValue = await readContract({
                    address: address as `0x${string}`,
                    abi: escrowAbi,
                    functionName: 'getMilestoneStatus',
                    args: [BigInt(index)]
                  }).catch(() => 0);
                  
                  status = Number(statusValue) as MilestoneStatus;
                  console.log(`Milestone ${index} status:`, status);
                } catch (e) {
                  console.log(`Could not get status for milestone ${index}:`, e);
                }
                
                try {
                  // Try to get confirmation count
                  const confirmationCount = await readContract({
                    address: address as `0x${string}`,
                    abi: escrowAbi,
                    functionName: 'getMilestoneConfirmations',
                    args: [BigInt(index)]
                  }).catch(() => 0);
                  
                  confirmations = Number(confirmationCount);
                  console.log(`Milestone ${index} confirmations:`, confirmations);
                } catch (e) {
                  console.log(`Could not get confirmations for milestone ${index}:`, e);
                }
                
                milestones.push({
                  id: index,
                  amount: amount as bigint,
                  status: status,
                  confirmations: confirmations
                });
                
                index++;
                milestoneCount = index;
              } catch (e) {
                console.log(`No more milestones after index ${index-1}`);
                keepChecking = false;
              }
            }
          } catch (e) {
            console.log('milestoneAmounts not available:', e);
            
            // Try alternative approach using total milestone count
            try {
              console.log('Checking total milestone count...');
              const count = await readContract({
                address: address as `0x${string}`,
                abi: escrowAbi,
                functionName: 'getMilestoneCount'
              }).catch(() => {
                return BigInt(1);
              });
              
              milestoneCount = Number(count);
              console.log('Total milestone count:', milestoneCount);
              
              // Create basic milestone data
              for (let i = 0; i < milestoneCount; i++) {
                milestones.push({
                  id: i,
                  amount: escrowBalance / BigInt(milestoneCount),
                  status: MilestoneStatus.Pending,
                  confirmations: 0
                });
              }
            } catch (error) {
              console.error('Failed to get milestone count:', error);
              // Use a single milestone as fallback
              milestones = [{
                id: 0,
                amount: escrowBalance,
                status: MilestoneStatus.Pending,
                confirmations: 0
              }];
            }
          }
        } catch (error) {
          console.error('Failed to determine milestone structure:', error);
        }
        
        console.log('Final milestone data:', milestones);
        escrowData.milestones = milestones;
        escrowData.totalMilestones = milestones.length;
        
        // Set the escrow info with what we could gather
        setEscrowInfo(escrowData);
        console.log('Final escrow data:', escrowData);
        
      } catch (error) {
        console.error('Error fetching escrow details:', error);
        toast({
          title: 'Error Loading Escrow',
          description: 'Could not load escrow details. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMilestoneData();
  }, [address, isSuccess, toast, publicClient]);
  
  // Confirm milestone
  const confirmMilestone = (milestoneId: number) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to confirm this milestone.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Confirming milestone:', milestoneId);
    console.log('User address:', userAddress);
    console.log('Contract address:', address);
    
    try {
      writeContract({
        address: address as `0x${string}`,
        abi: escrowAbi,
        functionName: 'confirmMilestone',
        args: [BigInt(milestoneId)]
      });
      
      toast({
        title: "Confirmation Sent",
        description: "Your milestone confirmation has been submitted. Please wait for transaction confirmation.",
      });
    } catch (error) {
      console.error('Error confirming milestone:', error);
      toast({
        title: "Confirmation Failed",
        description: `Failed to confirm milestone: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  }
  
  // Release milestone
  const releaseMilestone = (milestoneId: number) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to release this milestone.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Releasing milestone:', milestoneId);
    console.log('User address:', userAddress);
    console.log('Contract address:', address);
    
    try {
      // Check if there's a specific releaseMilestone function
      try {
        console.log('Attempting to call releaseMilestone function');
        writeContract({
          address: address as `0x${string}`,
          abi: escrowAbi,
          functionName: 'releaseMilestone',
          args: [BigInt(milestoneId)]
        });
      } catch (error) {
        console.error('Error calling releaseMilestone, trying alternative:', error);
        
        // If that fails, try confirmMilestone which might trigger automatic release
        console.log('Falling back to confirmMilestone to trigger release');
        writeContract({
          address: address as `0x${string}`,
          abi: escrowAbi,
          functionName: 'confirmMilestone',
          args: [BigInt(milestoneId)]
        });
      }
      
      toast({
        title: "Release Initiated",
        description: "Your milestone release has been submitted. Please wait for transaction confirmation.",
      });
    } catch (error) {
      console.error('Error releasing milestone:', error);
      toast({
        title: "Release Failed",
        description: `Failed to release milestone: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  }
  
  // Start dispute
  const startDispute = (milestoneId: number) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to initiate a dispute.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Starting dispute for milestone:', milestoneId);
    console.log('User address:', userAddress);
    console.log('Contract address:', address);
    
    try {
      // First try the function with milestone ID parameter (which matches our contract implementation)
      console.log('Calling initiateDispute with milestone ID');
      writeContract({
        address: address as `0x${string}`,
        abi: escrowAbi,
        functionName: 'initiateDispute',
        args: [BigInt(milestoneId)]
      });
      
      toast({
        title: "Dispute Initiated",
        description: "Your dispute has been submitted. Please wait for arbitration.",
      });
    } catch (error) {
      console.error('Error initiating dispute:', error);
      toast({
        title: "Dispute Failed",
        description: `Failed to initiate dispute: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  }
  
  // Resolve dispute (as arbitrator)
  const resolveDispute = (inFavorOfSeller: boolean) => {
    if (!isConnected || !address || !userAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to resolve this dispute.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Resolving dispute:', inFavorOfSeller ? 'in favor of seller' : 'in favor of buyer');
    console.log('User address:', userAddress);
    console.log('Contract address:', address);
    
    // Check if current user is the arbitrator (this is a simplified check, in a real app this would verify against the arbitration contract)
    // For testing purposes, we'll allow any user to resolve disputes
    try {
      // Direct call to the escrow contract's resolveDispute function
      writeContract({
        address: address as `0x${string}`,
        abi: escrowAbi,
        functionName: 'resolveDispute',
        args: [inFavorOfSeller]
      });
      
      toast({
        title: "Dispute Resolution Submitted",
        description: `You've resolved the dispute in favor of the ${inFavorOfSeller ? 'seller' : 'buyer'}.`,
      });
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast({
        title: "Resolution Failed",
        description: `Failed to resolve dispute: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure you are the assigned arbitrator.`,
        variant: "destructive"
      });
    }
  }
  
  // Cancel by timeout
  const cancelByTimeout = () => {
    if (!isConnected || !address) return
    
    try {
      writeContract({
        address: address as `0x${string}`,
        abi: escrowAbi,
        functionName: 'cancelByTimeout',
        args: []
      })
      
      toast({
        title: "Cancellation Initiated",
        description: "Your request to cancel the escrow due to timelock expiration has been submitted.",
      })
    } catch (error) {
      console.error('Error cancelling escrow:', error)
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel the escrow. See console for details.",
        variant: "destructive"
      })
    }
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
    if (!escrowInfo || !userAddress) return false;
    
    console.log('Checking if user can confirm:', {
      userAddress,
      participants: escrowInfo.participants,
      milestoneStatus: milestone.status,
      confirmations: milestone.confirmations,
      requiredConfirmations: escrowInfo.requiredConfirmations
    });
    
    // User must be a participant and milestone must be pending
    const isParticipant = escrowInfo.participants.some(p => 
      p.toLowerCase() === userAddress.toLowerCase()
    );
    
    // Always allow confirmations if milestone is pending and user is a participant
    return isParticipant && milestone.status === MilestoneStatus.Pending;
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
              <div className="flex items-center gap-2">
                {index === 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">Buyer</span>
                )}
                {index === escrowInfo.participants.length - 1 && index !== 0 && (
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">Seller</span>
                )}
                {index !== 0 && index !== escrowInfo.participants.length - 1 && (
                  <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full">Participant</span>
                )}
                {participant === userAddress && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">You</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Your Role and Permissions */}
        {userAddress && escrowInfo.participants.includes(userAddress) && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your Role and Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {userAddress === escrowInfo.participants[0] && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>As the <strong>Buyer</strong>, you can confirm milestones and dispute transactions</span>
                  </li>
                )}
                {userAddress === escrowInfo.participants[escrowInfo.participants.length - 1] && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>As the <strong>Seller</strong>, you will receive funds when milestones are released</span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>You can confirm milestones to contribute to the required approvals</span>
                </li>
                {escrowInfo.timelock > 0 && (
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>The escrow has a timelock expiring on {new Date(escrowInfo.timelock * 1000).toLocaleString()}</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}
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
      
      {/* Add escrow actions panel */}
      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-semibold">Escrow Actions</h3>
        <Card>
          <CardHeader>
            <CardTitle>Additional Actions</CardTitle>
            <CardDescription>
              Additional actions you can perform on this escrow contract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Current time and timelock */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Current Time:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Timelock Expires:</span>
                <span>{escrowInfo.timelock > 0 ? new Date(escrowInfo.timelock * 1000).toLocaleString() : 'Not set'}</span>
              </div>
            </div>
            
            {/* Dispute Panel - Show if there's an active dispute */}
            {escrowInfo.milestones.some(m => m.status === MilestoneStatus.Disputed) && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg mb-4">
                <h4 className="flex items-center gap-2 font-medium text-red-800 dark:text-red-200 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  Dispute In Progress
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  This escrow has an active dispute. The dispute must be resolved by an assigned arbitrator.
                </p>
                
                {/* Show disputed milestones */}
                <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/50 rounded-md">
                  <h5 className="text-sm font-medium mb-2">Disputed Milestones:</h5>
                  <ul className="space-y-1 text-sm">
                    {escrowInfo.milestones
                      .filter(m => m.status === MilestoneStatus.Disputed)
                      .map(milestone => (
                        <li key={milestone.id} className="flex justify-between">
                          <span>Milestone {milestone.id + 1}</span>
                          <span>{formatEther(milestone.amount)} ETH</span>
                        </li>
                      ))
                    }
                  </ul>
                </div>
                
                {/* Arbitration options - simplified for testing */}
                <div className="mb-2">
                  <p className="text-sm mb-2 text-red-700 dark:text-red-300">
                    <strong>As an arbitrator (for testing):</strong> You can resolve this dispute in favor of either the buyer or seller. In a production environment, only the assigned arbitrator could do this.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="default" 
                    onClick={() => resolveDispute(true)}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Resolve for Seller
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => resolveDispute(false)}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Resolve for Buyer
                  </Button>
                </div>
              </div>
            )}
            
            {/* Manual Fund Release */}
            {escrowInfo.milestones.filter(m => 
              m.status === MilestoneStatus.Pending && 
              m.confirmations >= escrowInfo.requiredConfirmations
            ).length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Manual Release Required
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  One or more milestones have enough confirmations but haven't been released automatically.
                  Use the button below to try a manual release.
                </p>
                <Button 
                  variant="default" 
                  onClick={() => {
                    const pendingMilestone = escrowInfo.milestones.find(m => 
                      m.status === MilestoneStatus.Pending && 
                      m.confirmations >= escrowInfo.requiredConfirmations
                    );
                    if (pendingMilestone) {
                      releaseMilestone(pendingMilestone.id);
                    }
                  }}
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Attempt Manual Release
                </Button>
              </div>
            )}
            
            {/* Check if timelock has passed */}
            {escrowInfo.timelock > 0 && escrowInfo.timelock < (Date.now() / 1000) && (
              <Button 
                variant="destructive" 
                onClick={() => cancelByTimeout()}
                disabled={isPending || isConfirming}
                className="w-full"
              >
                {isPending || isConfirming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Clock className="h-4 w-4 mr-1" />
                )}
                Cancel Escrow (Timelock Expired)
              </Button>
            )}
            
            {/* Refresh button */}
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <Loader2 className="h-4 w-4 mr-1" />
              Refresh Escrow Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

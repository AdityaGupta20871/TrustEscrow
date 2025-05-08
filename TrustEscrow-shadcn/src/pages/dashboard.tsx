import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract, useReadContracts, usePublicClient } from 'wagmi'
import { readContract } from '@wagmi/core'
import { config } from '@/lib/wagmi'
import { formatEther, formatAddress } from '@/lib/utils'
import { FACTORY_ADDRESS } from '@/lib/contracts'
import { factoryAbi } from '@/lib/abis/factoryAbi'
import { escrowAbi } from '@/lib/abis/escrowAbi'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { Dices, ExternalLink, Clock, Shield, CheckCircle } from 'lucide-react'

type EscrowInfo = {
  address: string
  balance: bigint
  participantsCount: number
  milestonesCount: number
  activeDispute: boolean
}

export function Dashboard() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const publicClient = usePublicClient()
  const [escrows, setEscrows] = useState<string[]>([])
  const [escrowDetails, setEscrowDetails] = useState<Record<string, EscrowInfo>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Read the user's escrows from the factory contract
  const { data: userEscrows } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: factoryAbi,
    functionName: 'getUserEscrows',
    args: [address],
    query: {
      enabled: !!address,
    },
  })

  useEffect(() => {
    if (userEscrows) {
      setEscrows(userEscrows as string[])
      setIsLoading(false)
    }
  }, [userEscrows])
// Create a standalone function for fetching escrow details  
  const fetchEscrowDetails = async () => {
    if (!escrows.length || !isConnected) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    console.log('Fetching details for escrows:', escrows);
    
    try {
      const details: Record<string, EscrowInfo> = {};
      
      // Create a copy of the escrows array to avoid issues with async operations
      const escrowsToFetch = [...escrows];
      
      for (const escrowAddress of escrowsToFetch) {
        try {
          console.log('Fetching data for escrow:', escrowAddress);
          
          // Get contract balance using direct provider query instead of contract call
          let balance = BigInt(0);
          if (publicClient) {
            try {
              balance = await publicClient.getBalance({
                address: escrowAddress as `0x${string}`
              }).catch(() => 0n);
            } catch (e) {
              console.error('Failed to get balance:', e);
            }
          } else {
            console.warn('Public client not available, using 0 balance');
          }
          
          // Simple placeholder data if contract calls fail
          details[escrowAddress] = {
            address: escrowAddress,
            balance: balance || 0n,
            participantsCount: 2, // Default minimum number of participants
            milestonesCount: 1,   // Default minimum milestone count
            activeDispute: false
          };
          
          // Try to fetch real data but don't fail if there's an error
          try {
            const participants = await readContract({
              address: escrowAddress as `0x${string}`,
              abi: escrowAbi,
              functionName: 'getParticipants',
            }).catch(() => []);
            
            if (participants && Array.isArray(participants)) {
              details[escrowAddress].participantsCount = participants.length;
            }
          } catch (e) {
            console.warn(`Could not fetch participants for ${escrowAddress}`, e);
          }
          
          // Try to fetch milestones
          try {
            const milestoneCount = await readContract({
              address: escrowAddress as `0x${string}`,
              abi: escrowAbi, 
              functionName: 'getMilestoneCount',
            }).catch(() => 1);
            
            details[escrowAddress].milestonesCount = Number(milestoneCount) || 1;
          } catch (e) {
            console.warn(`Could not fetch milestone count for ${escrowAddress}`, e);
          }
          
          // Try to fetch dispute status
          try {
            const disputeStatus = await readContract({
              address: escrowAddress as `0x${string}`,
              abi: escrowAbi,
              functionName: 'isDisputed',
            }).catch(() => false);
            
            details[escrowAddress].activeDispute = Boolean(disputeStatus);
          } catch (e) {
            console.warn(`Could not fetch dispute status for ${escrowAddress}`, e);
          }
          
          console.log('Fetched data for escrow:', details[escrowAddress]);
        } catch (error) {
          console.error(`Error fetching data for escrow ${escrowAddress}:`, error);
          // Add fallback data on error
          details[escrowAddress] = {
            address: escrowAddress,
            balance: 0n,
            participantsCount: 2,
            milestonesCount: 1,
            activeDispute: false
          };
        }
      }
      
      setEscrowDetails(details);
    } catch (error) {
      console.error('Error in fetchEscrowDetails:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load escrow details. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Call fetchEscrowDetails when escrows or connection status changes
  useEffect(() => {
    if (isConnected && escrows.length > 0) {
      fetchEscrowDetails();
    } else if (!isConnected) {
      setIsLoading(false);
    }
  }, [escrows, isConnected]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Dices className="w-12 h-12 text-primary/30 animate-spin" />
        <h2 className="text-xl font-medium">Loading your escrows...</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your escrow contracts and track their status.
          </p>
        </div>
        <Link to="/create">
          <Button>
            Create New Escrow
          </Button>
        </Link>
      </div>

      <Separator />


      
      <h3 className="text-xl font-semibold mb-4">Your Escrows</h3>
      
      {escrows.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 bg-muted/40 rounded-lg p-8">
          <Shield className="w-12 h-12 text-primary/30" />
          <h3 className="text-xl font-medium">No Escrows Found</h3>
          <p className="text-muted-foreground text-center max-w-[400px]">
            You don't have any escrow contracts yet. Create your first secure transaction!
          </p>
          <Link to="/create">
            <Button variant="default">Create Escrow</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {escrows.map((escrowAddress) => {
            const escrow = escrowDetails[escrowAddress]
            return (
              <Link to={`/escrow/${escrowAddress}`} key={escrowAddress}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Shield className="mr-2 h-5 w-5" />
                      Escrow {formatAddress(escrowAddress)}
                    </CardTitle>
                    <CardDescription>
                      {escrow?.activeDispute ? (
                        <span className="flex items-center text-destructive">
                          <Clock className="mr-1 h-3 w-3" /> Dispute Active
                        </span>
                      ) : (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" /> Active
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex justify-between mb-2">
                      <div className="text-sm text-muted-foreground">Balance:</div>
                      <div className="font-medium">
                        {escrow?.balance ? formatEther(escrow.balance) : '0.0000'} ETH
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-sm text-muted-foreground">Participants:</div>
                      <div className="font-medium">{escrow?.participantsCount || 0}</div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      View Details
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

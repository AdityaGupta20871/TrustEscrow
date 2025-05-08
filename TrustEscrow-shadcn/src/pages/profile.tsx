import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatEther, formatAddress } from '@/lib/utils'
import { FACTORY_ADDRESS, ARBITRATION_ADDRESS } from '@/lib/contracts'
import { factoryAbi } from '@/lib/abis/factoryAbi'
import { arbitrationAbi } from '@/lib/abis/arbitrationAbi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Link } from 'react-router-dom'
import { Shield, User, Scale, ExternalLink, Clock } from 'lucide-react'

type ArbitratorInfo = {
  isRegistered: boolean
  stake: bigint
}

export function Profile() {
  const { address, isConnected } = useAccount()
  const [escrows, setEscrows] = useState<string[]>([])
  
  // Get user's escrows
  const { data: userEscrows } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: factoryAbi,
    functionName: 'getUserEscrows',
    args: [address],
    query: {
      enabled: !!address,
    },
  })
  
  // Get user's arbitrator info
  const { data: arbitratorInfo } = useReadContract({
    address: ARBITRATION_ADDRESS as `0x${string}`,
    abi: arbitrationAbi,
    functionName: 'getArbitratorInfo',
    args: [address],
    query: {
      enabled: !!address,
    },
  })
  
  useEffect(() => {
    if (userEscrows) {
      setEscrows(userEscrows as string[])
    }
  }, [userEscrows])
  
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <User className="w-16 h-16 text-primary/30" />
        <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
        <p className="text-muted-foreground text-center max-w-[500px]">
          Please connect your Ethereum wallet to view your profile.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Your Profile</h2>
        <p className="text-muted-foreground">
          Manage your account and view your activity
        </p>
      </div>

      <Separator />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Wallet Address</h4>
              <p className="font-mono text-sm">{address}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Active Escrows</h4>
              <p className="text-xl font-bold">{escrows.length}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Arbitrator Status</h4>
              {arbitratorInfo && (arbitratorInfo as ArbitratorInfo).isRegistered ? (
                <div className="flex items-center">
                  <Scale className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium">Registered Arbitrator</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Not Registered</span>
                </div>
              )}
            </div>
            
            {arbitratorInfo && (arbitratorInfo as ArbitratorInfo).isRegistered && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Arbitrator Stake</h4>
                <p className="text-xl font-bold">
                  {formatEther((arbitratorInfo as ArbitratorInfo).stake)} ETH
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link to="/create">
                <Button variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Create Escrow
                </Button>
              </Link>
              
              <Link to="/arbitration">
                <Button variant="outline" className="w-full">
                  <Scale className="h-4 w-4 mr-2" />
                  Arbitration
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Escrows</h3>
        
        {escrows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-muted/40 rounded-lg space-y-2">
            <Shield className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">You don't have any escrow contracts yet.</p>
            <Link to="/create">
              <Button variant="outline" size="sm">Create Your First Escrow</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {escrows.slice(0, 6).map((escrowAddress, index) => (
              <Link to={`/escrow/${escrowAddress}`} key={index}>
                <Card className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Escrow Contract</CardTitle>
                    <CardDescription className="font-mono">
                      {formatAddress(escrowAddress)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      View Details
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {escrows.length > 6 && (
              <Link to="/">
                <Card className="overflow-hidden h-full border-dashed flex items-center justify-center">
                  <CardContent className="py-8">
                    <Button variant="ghost">View All Escrows</Button>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

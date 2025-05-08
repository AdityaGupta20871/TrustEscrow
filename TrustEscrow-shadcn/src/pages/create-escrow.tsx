import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { parseEther } from 'ethers'
import { FACTORY_ADDRESS } from '@/lib/contracts'
import { factoryAbi } from '@/lib/abis/factoryAbi'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { PlusCircle, Trash2, ArrowRight, Loader2 } from 'lucide-react'
import { NetworkCheck } from '@/components/network-check'

export function CreateEscrow() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [participants, setParticipants] = useState<string[]>([''])
  const [requiredConfirmations, setRequiredConfirmations] = useState('2')
  const [timelock, setTimelock] = useState('86400') // Default to 24 hours from now in seconds
  const [milestones, setMilestones] = useState<string[]>(['0.1'])
  const [totalAmount, setTotalAmount] = useState('0.1')
  
  const { data: hash, isPending, writeContract, isError: isWriteError, error: writeError } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isConfirmError, error: confirmError } = useWaitForTransactionReceipt({ 
    hash,
  })
  
  // Handle successful transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      toast({
        title: "Escrow Created!",
        description: "Your escrow contract has been successfully created.",
      })
      // Navigate to dashboard after successful creation
      navigate('/')
    }
  }, [isConfirmed, hash, navigate, toast])
  
  // Handle transaction errors
  useEffect(() => {
    if (isWriteError && writeError) {
      console.error('Contract write error:', writeError)
      
      // Provide specific error message for timeouts
      const errorMessage = writeError.message || 'Unknown error'
      const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('took too long')
      
      toast({
        title: isTimeout ? "Network Timeout" : "Transaction Failed",
        description: isTimeout 
          ? "The Anvil/Hardhat network is experiencing delays. Please try again in a few moments." 
          : `Error: ${errorMessage}`,
        variant: "destructive",
        action: isTimeout ? {
          label: "Retry",
          onClick: () => createEscrow()
        } : undefined
      })
    }
    
    if (isConfirmError && confirmError) {
      console.error('Transaction confirmation error:', confirmError)
      toast({
        title: "Transaction Failed",
        description: `Error: ${confirmError.message || 'Failed to confirm transaction'}`,
        variant: "destructive"
      })
    }
  }, [isWriteError, writeError, isConfirmError, confirmError, toast])

  // Handle participants change
  const handleParticipantChange = (index: number, value: string) => {
    const newParticipants = [...participants]
    newParticipants[index] = value
    setParticipants(newParticipants)
  }

  // Add participant field
  const addParticipant = () => {
    setParticipants([...participants, ''])
  }

  // Remove participant field
  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      const newParticipants = [...participants]
      newParticipants.splice(index, 1)
      setParticipants(newParticipants)
    }
  }

  // Handle milestone change
  const handleMilestoneChange = (index: number, value: string) => {
    const newMilestones = [...milestones]
    newMilestones[index] = value
    setMilestones(newMilestones)
    
    // Calculate total
    const total = newMilestones.reduce((sum, milestone) => {
      return sum + (parseFloat(milestone) || 0)
    }, 0)
    
    setTotalAmount(total.toString())
  }

  // Add milestone field
  const addMilestone = () => {
    setMilestones([...milestones, '0.1'])
  }

  // Remove milestone field
  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      const newMilestones = [...milestones]
      newMilestones.splice(index, 1)
      setMilestones(newMilestones)
      
      // Recalculate total
      const total = newMilestones.reduce((sum, milestone) => {
        return sum + (parseFloat(milestone) || 0)
      }, 0)
      
      setTotalAmount(total.toString())
    }
  }

  // Create escrow contract
  const createEscrow = async () => {
    try {
      // Debug logging
      console.log('Creating escrow with:', {
        factory: FACTORY_ADDRESS,
        connected: isConnected,
        userAddress: address,
        chainId: chainId
      })
      
      // Check if on Anvil/Hardhat network (chainId 31337)
      if (chainId !== 31337) {
        toast({
          title: "Wrong Network",
          description: "Please connect to Anvil/Hardhat network to create an escrow.",
          variant: "destructive"
        })
        return
      }

      if (!isConnected) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to create an escrow.",
          variant: "destructive"
        })
        return
      }

      // Validate participants - ensure they are valid Ethereum addresses
      const validParticipants = participants
        .filter(p => p.trim() !== '')
        .map(p => p.trim().toLowerCase())
        .filter(p => /^0x[a-f0-9]{40}$/i.test(p))

      if (validParticipants.length < 2) {
        toast({
          title: "Invalid participants",
          description: "You need at least 2 valid Ethereum addresses for participants.",
          variant: "destructive"
        })
        return
      }

      // Include the current wallet address if not already included
      if (address && !validParticipants.includes(address.toLowerCase())) {
        validParticipants.push(address.toLowerCase())
      }

      // Validate confirmations
      const numConfirmations = parseInt(requiredConfirmations)
      if (isNaN(numConfirmations) || numConfirmations < 2 || numConfirmations > validParticipants.length) {
        toast({
          title: "Invalid confirmations",
          description: `You must require between 2 and ${validParticipants.length} confirmations.`,
          variant: "destructive"
        })
        return
      }
      
      // Convert timelock from seconds to a future timestamp
      // Get current time in seconds and add the timelock duration
      const currentTimestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
      const timelockValue = currentTimestamp + parseInt(timelock);
      
      if (isNaN(timelockValue) || timelockValue <= currentTimestamp) {
        toast({
          title: "Invalid timelock period",
          description: "The timelock period must be a valid positive number of seconds.",
          variant: "destructive"
        })
        return
      }
      
      console.log('Timelock calculated:', {
        currentTimestamp,
        durationSeconds: parseInt(timelock),
        futureTimestamp: timelockValue
      });
      
      // Validate each milestone value
      for (const milestone of milestones) {
        if (isNaN(parseFloat(milestone)) || parseFloat(milestone) <= 0) {
          toast({
            title: "Invalid milestone amount",
            description: "Each milestone must have a valid positive ETH amount.",
            variant: "destructive"
          })
          return
        }
      }
      
      // Convert milestone ETH values to wei
      const milestonesInWei = milestones.map(m => {
        try {
          return parseEther(m)
        } catch (e) {
          console.error('Error parsing ETH amount:', e)
          throw new Error(`Invalid ETH amount: ${m}`)
        }
      })
      
      // Calculate the exact sum of milestone amounts in wei
      const totalValueWei = milestonesInWei.reduce(
        (sum, amount) => sum + amount, 
        BigInt(0)
      )
      
      // When the factory creates an escrow, it takes a 0.5% fee
      // The amount that actually reaches the escrow is total * (1 - 0.005)
      // To make this work, we need to send more than the milestone sum
      const feeRate = 0.005; // 0.5%
      const valueToSend = totalValueWei * BigInt(10000) / BigInt(10000 - 50); // 50 basis points = 0.5%
      
      console.log('Milestone amounts:', {
        milestones,
        milestonesInWei: milestonesInWei.map(m => m.toString()),
        totalValueWei: totalValueWei.toString(),
        valueToSend: valueToSend.toString()
      })
      
      // Validate that all milestone amounts sum up to the total amount
      const totalEthValue = parseFloat(totalAmount);
      const sumOfMilestones = milestones.reduce((sum, m) => sum + parseFloat(m), 0);
      
      // Check for any difference greater than a tiny rounding error
      if (Math.abs(totalEthValue - sumOfMilestones) > 0.000001) {
        toast({
          title: "Milestone amount mismatch",
          description: `Total milestone amount (${sumOfMilestones} ETH) must exactly equal the total escrow amount (${totalEthValue} ETH).`,
          variant: "destructive"
        });
        return;
      }
      
      // Debug logging transaction details
      console.log('Transaction details:', {
        factoryAddress: FACTORY_ADDRESS,
        functionName: 'createEscrow',
        participants: validParticipants,
        confirmations: numConfirmations,
        timelock: timelockValue,
        milestonesInWei: milestonesInWei.map(m => m.toString()),
        totalValue: totalValueWei.toString(),
        valueToSend: valueToSend.toString()
      })
      
      // Extra debug logging right before transaction
      console.log('ABOUT TO SEND TRANSACTION', {
        address: FACTORY_ADDRESS,
        functionName: 'createEscrow',
        args: [
          validParticipants,
          numConfirmations,
          timelockValue,
          milestonesInWei
        ],
        value: valueToSend.toString(),
        isConnected,
        walletAddress: address
      });
      
      // Send the transaction
      try {
        console.log('Calling writeContract...');
        const result = await writeContract({
          address: FACTORY_ADDRESS as `0x${string}`,
          abi: factoryAbi,
          functionName: 'createEscrow',
          args: [
            validParticipants,
            BigInt(numConfirmations),
            BigInt(timelockValue),
            milestonesInWei
          ],
          value: valueToSend
        });
        console.log('writeContract completed with result:', result);
      } catch (txError) {
        console.error('Transaction submission error:', txError);
        throw txError; // Re-throw to be caught by the outer try/catch
      }
      
      // Toast notification for transaction sent
      toast({
        title: "Transaction Sent",
        description: "Your escrow creation transaction has been sent to the network.",
      })
      
    } catch (error: any) {
      console.error('Error creating escrow:', error)
      // Check for specific error types
      const errorMessage = error?.message || "Failed to create escrow. Check the console for details."
      const userRejected = errorMessage.includes('user rejected') || errorMessage.includes('User denied')
      
      // Special handling for milestone amount error
      if (errorMessage.includes('Milestone amounts must equal total escrow amount')) {
        toast({
          title: "Milestone Amount Error",
          description: "There's an issue with milestone amounts. Please try using a round number for your milestone like 20 ETH instead of 20.001 ETH to avoid precision issues.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: userRejected ? "Transaction Cancelled" : "Transaction Error",
        description: userRejected 
          ? "You cancelled the transaction." 
          : errorMessage,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Create Escrow</h1>
      <Separator className="mb-4" />
      
      {/* Network check component */}
      <NetworkCheck />
      
      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              Add all parties involved in this escrow. Your address will be automatically included.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {participants.map((participant, index) => (
              <div key={index} className="flex items-center gap-2">
                <Label htmlFor={`participant-${index}`} className="w-20">
                  Address {index + 1}
                </Label>
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    id={`participant-${index}`}
                    value={participant}
                    onChange={(e) => handleParticipantChange(index, e.target.value)}
                    placeholder="0x..."
                  />
                  {participants.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeParticipant(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={addParticipant}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Participant
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escrow Settings</CardTitle>
            <CardDescription>
              Configure confirmation requirements and time-lock period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirmations">Required Confirmations</Label>
              <Input
                id="confirmations"
                type="number"
                value={requiredConfirmations}
                onChange={(e) => setRequiredConfirmations(e.target.value)}
                min={2}
                max={participants.length}
              />
              <p className="text-xs text-muted-foreground">
                Number of participants that must confirm each milestone (minimum: 2).
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timelock">Time-Lock Period (seconds)</Label>
              <Input
                id="timelock"
                type="number"
                value={timelock}
                onChange={(e) => setTimelock(e.target.value)}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Time in seconds that must pass before a milestone can be released (86400 = 1 day).
                This will be converted to a future timestamp when creating the escrow.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>
              Define the payment milestones for this escrow contract (in ETH).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center gap-2">
                <Label htmlFor={`milestone-${index}`} className="w-32">
                  Milestone {index + 1}
                </Label>
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    id={`milestone-${index}`}
                    type="number"
                    value={milestone}
                    onChange={(e) => handleMilestoneChange(index, e.target.value)}
                    step="0.001"
                    min="0.001"
                  />
                  <span className="font-medium">ETH</span>
                  {milestones.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeMilestone(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              onClick={addMilestone}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
            
            <div className="flex flex-col p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold">{totalAmount} ETH</span>
              </div>
              
              {/* Calculate and display the platform fee */}
              <div className="flex justify-between mt-1 text-sm">
                <span className="text-muted-foreground">Platform Fee (0.5%):</span>
                <span>{(parseFloat(totalAmount) * 0.005).toFixed(4)} ETH</span>
              </div>
              
              {/* Calculate and display the total with fee */}
              <div className="flex justify-between mt-1 text-sm font-medium">
                <span>Total with Fee:</span>
                <span>{(parseFloat(totalAmount) * 1.005).toFixed(4)} ETH</span>
              </div>
              
              {/* Add validation tip */}
              <p className="text-xs text-muted-foreground mt-2">
                Note: To avoid precision issues, try to use simple round numbers for milestone amounts (e.g., 20 ETH instead of 20.001 ETH).
                The platform fee of 0.5% will be added to the total when you send the transaction.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 w-full">
            {isPending && (
              <div className="w-full p-2 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-md text-sm">
                <p className="font-medium">Waiting for wallet confirmation... Please check your wallet.</p>
              </div>
            )}
            
            {isConfirming && hash && (
              <div className="w-full p-2 bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-200 rounded-md text-sm">
                <p className="font-medium">Transaction submitted! Waiting for confirmation...</p>
                <p className="text-xs mt-1">Transaction hash: {hash.slice(0, 10)}...{hash.slice(-8)}</p>
                {/* No block explorer for local Anvil, so we just show the hash */}
                <p className="text-xs mt-1">
                  Anvil local transaction (no block explorer available)
                </p>
              </div>
            )}

            <div className="flex justify-end w-full">
              <Button 
                onClick={createEscrow}
                disabled={isPending || isConfirming}
              >
                {isPending || isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isPending ? 'Waiting for wallet...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    Create Escrow
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

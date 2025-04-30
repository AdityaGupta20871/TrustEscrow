import { useState } from 'react'
import { useConnect } from 'wagmi'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { MetaMaskIcon, CoinbaseIcon, WalletConnectIcon, BrowserIcon } from '@/components/wallet-icons'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, isPending, connectors } = useConnect()
  const { toast } = useToast()
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)

  // Define some static wallet options to always show
  const walletOptions = [
    { id: 'metamask', name: 'MetaMask', icon: MetaMaskIcon, description: 'Connect to your MetaMask wallet' },
    { id: 'coinbase', name: 'Coinbase Wallet', icon: CoinbaseIcon, description: 'Connect to your Coinbase wallet' },
    { id: 'walletconnect', name: 'WalletConnect', icon: WalletConnectIcon, description: 'Connect using WalletConnect' },
    { id: 'injected', name: 'Browser Wallet', icon: BrowserIcon, description: 'Connect using your browser\'s wallet' }
  ];

  // Debug what connectors are available
  console.log('Available connectors:', connectors.map(c => ({ 
    name: c.name, 
    id: c.id,
    ready: c.ready,
    uid: c.uid
  })));

  const handleConnect = (optionId: string) => {
    // Find a matching connector
    let connector = connectors.find(c => 
      c.name.toLowerCase().includes(optionId) || 
      c.id.toLowerCase().includes(optionId)
    );
    
    // Fallback to first connector if none match
    if (!connector && connectors.length > 0) {
      connector = connectors[0];
    }
    
    if (!connector) {
      toast({
        title: "Connection Error",
        description: "No wallet connectors available. Please make sure MetaMask is installed.",
        variant: "destructive"
      });
      return;
    }
    
    setConnectingWallet(optionId);
    
    connect({ connector })
      .then(() => {
        toast({
          title: "Wallet Connected",
          description: `Connected to ${connector.name}`
        });
        onClose();
      })
      .catch((error) => {
        console.error('Connection error:', error);
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect wallet. Make sure the wallet extension is installed.",
          variant: "destructive"
        });
      })
      .finally(() => {
        setConnectingWallet(null);
      });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Select a wallet provider to connect to TrustEscrow.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {walletOptions.map((option) => {
            const WalletIcon = option.icon;
            
            return (
              <Button
                key={option.id}
                variant="outline"
                className="flex justify-start items-center h-16 px-4"
                onClick={() => handleConnect(option.id)}
                disabled={isPending || connectingWallet !== null}
              >
                <WalletIcon className="h-8 w-8 mr-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{option.name}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
                {connectingWallet === option.id && (
                  <div className="ml-auto h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
              </Button>
            );
          })}
        </div>
        <div className="text-xs text-center text-muted-foreground pt-2">
          By connecting a wallet, you agree to TrustEscrow's Terms of Service and Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  )
}

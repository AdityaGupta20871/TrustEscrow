import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, LayoutDashboard, Target, Plus, User, Inbox } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Layout() {
  const { isConnected } = useAccount()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-6 md:gap-10">
            <Link to="/" className="flex items-center space-x-2">
              <Target className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">TrustEscrow</span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              <Link to="/" className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link to="/create" className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <Plus className="h-4 w-4" />
                Create Escrow
              </Link>
              <Link to="/arbitration" className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <Inbox className="h-4 w-4" />
                Submissions
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected && (
              <Link to="/profile">
                <Button variant="outline" size="sm" className="mr-2">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </Link>
            )}
            <ConnectButton showBalance={false} />
          </div>
          
          {/* Mobile menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <ChevronDown className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/create">Create Escrow</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/arbitration">Arbitration</Link>
              </DropdownMenuItem>
              {isConnected && (
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="container py-6 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            TrustEscrow © {new Date().getFullYear()} | Decentralized Multi-Signature Escrow with Time-Lock Features
          </p>
        </div>
      </footer>
    </div>
  )
}

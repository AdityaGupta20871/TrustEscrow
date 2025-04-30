import React from 'react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function MetaMaskIcon({ className, ...props }: IconProps) {
  return (
    <svg 
      width="40" 
      height="40" 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M34.4444 5L22.2222 14.4444L24.4444 8.8889L34.4444 5Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.55566 5L17.6668 14.5556L15.5557 8.8889L5.55566 5Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30.0001 26.6667L26.6667 31.6667L33.3334 33.5556L35.3334 26.7778L30.0001 26.6667Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.66675 26.7778L6.66675 33.5556L13.3334 31.6667L10.0001 26.6667L4.66675 26.7778Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.0001 18.2222L11.1112 21.3333L17.6668 21.6667L17.4445 14.4444L13.0001 18.2222Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M27.0002 18.2222L22.4446 14.3333L22.2224 21.6667L28.7779 21.3333L27.0002 18.2222Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.3334 31.6667L17.2223 29.5556L13.889 26.8889L13.3334 31.6667Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.7778 29.5556L26.6667 31.6667L26.1111 26.8889L22.7778 29.5556Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26.6667 31.6667L22.7778 29.5556L23.1111 32.3333L23.0778 33.4444L26.6667 31.6667Z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.3334 31.6667L16.9223 33.4444L16.9001 32.3333L17.2223 29.5556L13.3334 31.6667Z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.0001 24.8889L13.7778 23.8889L16.0001 22.7778L17.0001 24.8889Z" fill="#233447" stroke="#233447" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23.0002 24.8889L24.0002 22.7778L26.2224 23.8889L23.0002 24.8889Z" fill="#233447" stroke="#233447" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.3334 31.6667L13.9112 26.6667L10.0001 26.7778L13.3334 31.6667Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26.0889 26.6667L26.6667 31.6667L30.0001 26.7778L26.0889 26.6667Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28.7779 21.3333L22.2224 21.6667L23.0002 24.8889L24.0002 22.7778L26.2224 23.8889L28.7779 21.3333Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.7778 23.8889L16.0001 22.7778L17.0001 24.8889L17.6668 21.6667L11.1112 21.3333L13.7778 23.8889Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.1112 21.3333L13.889 26.8889L13.7778 23.8889L11.1112 21.3333Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26.2222 23.8889L26.1111 26.8889L28.8889 21.3333L26.2222 23.8889Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.6668 21.6667L17.0001 24.8889L17.8446 29.1111L18.1112 23.6667L17.6668 21.6667Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.2222 21.6667L21.7778 23.6444L22.1556 29.1111L23.0001 24.8889L22.2222 21.6667Z" fill="#E27525" stroke="#E27525" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23.0001 24.8889L22.1556 29.1111L22.7778 29.5556L26.1111 26.8889L26.2222 23.8889L23.0001 24.8889Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.7778 23.8889L13.889 26.8889L17.2223 29.5556L17.8445 29.1111L17.0001 24.8889L13.7778 23.8889Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23.0779 33.4444L23.1112 32.3333L22.8001 32.0667H17.2001L16.9001 32.3333L16.9223 33.4444L13.3334 31.6667L14.7779 32.8444L17.1557 34.4444H22.8223L25.2223 32.8444L26.6668 31.6667L23.0779 33.4444Z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.7778 29.5556L22.1556 29.1111H17.8445L17.2223 29.5556L16.9001 32.3333L17.2001 32.0667H22.8001L23.1112 32.3333L22.7778 29.5556Z" fill="#161616" stroke="#161616" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M34.889 15.5556L35.9999 10L34.4443 5L22.7777 14.1111L27.0001 18.2222L33.1111 20.2222L34.4444 18.6667L33.8888 18.2222L34.8888 17.3333L34.2222 16.7778L35.2222 16L34.889 15.5556Z" fill="#763E1A" stroke="#763E1A" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 15.5556L5.11108 16L4.11108 16.7778L4.77775 17.3333L3.77775 18.2222L4.33331 18.6667L3 20.2222L9.11108 18.2222L13.3333 14.1111L1.66665 5L4 15.5556Z" fill="#763E1A" stroke="#763E1A" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M33.1111 20.2222L27.0001 18.2222L28.7778 21.3333L26.1111 26.8889L30.0001 26.7778H35.3334L33.1111 20.2222Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.11108 18.2222L3.00008 20.2222L0.777832 26.7778H6.11115L10.0001 26.8889L7.33341 21.3333L9.11108 18.2222Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22.2222 21.6667L22.7777 14.1111L24.4444 8.8889H15.5556L17.2222 14.1111L17.6666 21.6667L17.8222 23.6889L17.8444 29.1111H22.1555L22.1777 23.6889L22.2222 21.6667Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function CoinbaseIcon({ className, ...props }: IconProps) {
  return (
    <svg 
      width="40" 
      height="40" 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="20" cy="20" r="20" fill="#0052FF"/>
      <path d="M20 28.75C14.9396 28.75 10.8334 24.6438 10.8334 19.5833C10.8334 14.5229 14.9396 10.4167 20 10.4167C25.0605 10.4167 29.1667 14.5229 29.1667 19.5833C29.1667 24.6438 25.0605 28.75 20 28.75ZM16.875 16.9583C16.4948 16.9583 16.1875 17.2656 16.1875 17.6458V21.5208C16.1875 21.901 16.4948 22.2083 16.875 22.2083H23.125C23.5052 22.2083 23.8125 21.901 23.8125 21.5208V17.6458C23.8125 17.2656 23.5052 16.9583 23.125 16.9583H16.875Z" fill="white"/>
    </svg>
  )
}

export function WalletConnectIcon({ className, ...props }: IconProps) {
  return (
    <svg 
      width="40" 
      height="40" 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="40" height="40" rx="6" fill="#3B99FC"/>
      <path d="M14.0157 14.8472C17.6772 11.2825 23.6025 11.2825 27.264 14.8472L27.8089 15.3785C28.0638 15.6274 28.0638 16.0296 27.8089 16.2785L25.9243 18.1172C25.7968 18.2416 25.5952 18.2416 25.4678 18.1172L24.7245 17.3911C22.2412 14.9684 19.0385 14.9684 16.5552 17.3911L15.7523 18.1765C15.6249 18.3009 15.4232 18.3009 15.2958 18.1765L13.4111 16.3378C13.1562 16.0889 13.1562 15.6867 13.4111 15.4378L14.0157 14.8472ZM30.3374 17.8486L31.9953 19.4695C32.2502 19.7184 32.2502 20.1206 31.9953 20.3695L24.7841 27.4033C24.5292 27.6522 24.1259 27.6522 23.8711 27.4033L18.8593 22.5018C18.7956 22.4396 18.6939 22.4396 18.6302 22.5018L13.6184 27.4033C13.3635 27.6522 12.9602 27.6522 12.7054 27.4033L5.50471 20.3695C5.2498 20.1206 5.2498 19.7184 5.50471 19.4695L7.1626 17.8486C7.41752 17.5997 7.82079 17.5997 8.07571 17.8486L13.0876 22.7501C13.1512 22.8123 13.2529 22.8123 13.3166 22.7501L18.3284 17.8486C18.5833 17.5997 18.9866 17.5997 19.2415 17.8486L24.2533 22.7501C24.317 22.8123 24.4187 22.8123 24.4824 22.7501L29.4943 17.8486C29.7492 17.5997 30.1525 17.5997 30.3374 17.8486Z" fill="white"/>
    </svg>
  )
}

export function BrowserIcon({ className, ...props }: IconProps) {
  return (
    <svg 
      width="40" 
      height="40" 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className} 
      {...props}
    >
      <rect width="40" height="40" rx="6" fill="#6F6F6F"/>
      <path d="M28.6667 8H11.3333C9.5 8 8 9.5 8 11.3333V28.6667C8 30.5 9.5 32 11.3333 32H28.6667C30.5 32 32 30.5 32 28.6667V11.3333C32 9.5 30.5 8 28.6667 8ZM13.3333 28.6667H11.3333V26.6667H13.3333V28.6667ZM13.3333 24.6667H11.3333V22.6667H13.3333V24.6667ZM13.3333 20.6667H11.3333V18.6667H13.3333V20.6667ZM13.3333 16.6667H11.3333V14.6667H13.3333V16.6667ZM13.3333 12.6667H11.3333V11.3333C11.3333 10.9667 11.6333 10.6667 12 10.6667H13.3333V12.6667ZM26.6667 28.6667H15.3333V10.6667H26.6667V28.6667ZM28.6667 28.6667H28V26.6667H28.6667V28.6667ZM28.6667 24.6667H28V22.6667H28.6667V24.6667ZM28.6667 20.6667H28V18.6667H28.6667V20.6667ZM28.6667 16.6667H28V14.6667H28.6667V16.6667ZM28.6667 12.6667H28V10.6667H28.6667C29.0333 10.6667 29.3333 10.9667 29.3333 11.3333V12.6667H28.6667Z" fill="white"/>
    </svg>
  )
}

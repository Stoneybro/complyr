import {QRCodeCanvas} from "qrcode.react";




export function WalletQR(walletAddress:{walletAddress:string}) {


  return (
    <div className="flex flex-col items-center p-4 bg-white shadow rounded-lg">
      <QRCodeCanvas value={walletAddress.walletAddress} bgColor="#0f172a" fgColor="#ffffff" size={160} />
      
    </div>
  )
}

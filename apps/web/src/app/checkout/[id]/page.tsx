"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { encodeFunctionData } from "viem";
import { ComplianceRegistryABI } from "@/lib/abi/ComplianceRegistryABI";
import { ComplianceRegistryAddress } from "@/lib/CA";
import { encryptMetadata, deriveAESKey, bufferToHex } from "@/lib/encryption";
import { parseUnits } from "viem";

const HashKeyLogo = () => (
    <svg width="131" height="40" viewBox="0 0 131 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="block max-w-none w-[13.25rem] h-[3.125rem]">
        <path d="M5.5015 1.20993L0.174029 0.00370093C0.0848566 -0.0164892 0 0.0513018 0 0.142732V21.1616C0 21.2519 0.0828613 21.3194 0.171289 21.3012L5.49876 20.2046C5.56502 20.191 5.61257 20.1327 5.61257 20.065V1.34896C5.61257 1.28236 5.56645 1.22463 5.5015 1.20993Z" fill="#1B2026"/>
        <path d="M14.6103 1.20981L19.9378 0.00357886C20.0269 -0.0166113 20.1118 0.0511797 20.1118 0.14261V21.1615C20.1118 21.2518 20.0289 21.3193 19.9405 21.3011L14.613 20.2045C14.5468 20.1909 14.4992 20.1326 14.4992 20.0649V1.34884C14.4992 1.28224 14.5453 1.22451 14.6103 1.20981Z" fill="#1B2026"/>
        <mask id="mask0_62_3046" style={{maskType: "alpha"}} maskUnits="userSpaceOnUse" x="7" y="7" width="6" height="7">
            <path d="M12.8623 13.2677C12.8623 13.3355 12.8073 13.3905 12.7395 13.3905H7.37255C7.30472 13.3905 7.24973 13.3355 7.24973 13.2677V7.90078C7.24973 7.83295 7.30472 7.77796 7.37255 7.77796H12.7395C12.8073 7.77796 12.8623 7.83295 12.8623 7.90078V13.2677Z" fill="#0072E5"/>
        </mask>
        <g mask="url(#mask0_62_3046)">
            <path d="M7.24991 7.7782H12.8624L7.24991 13.3907V7.7782Z" fill="#0080FF"/>
            <path d="M12.8622 13.3905H7.2497L12.8622 7.77796V13.3905Z" fill="#0072E5"/>
        </g>
        <path d="M75.2576 0.499023C75.1789 0.499023 75.115 0.562845 75.115 0.641574V8.36497C75.115 8.4437 75.0512 8.50753 74.9725 8.50753H67.0463C66.9675 8.50753 66.9037 8.4437 66.9037 8.36497V0.641574C66.9037 0.562845 66.8399 0.499023 66.7611 0.499023H62.5933C62.5146 0.499023 62.4508 0.562845 62.4508 0.641574V20.5953C62.4508 20.674 62.5146 20.7378 62.5933 20.7378H66.7611C66.8399 20.7378 66.9037 20.674 66.9037 20.5953V12.7561C66.9037 12.6774 66.9675 12.6136 67.0462 12.6136H74.9725C75.0512 12.6136 75.115 12.6774 75.115 12.7561V20.5953C75.115 20.674 75.1789 20.7378 75.2576 20.7378H79.4243C79.503 20.7378 79.5669 20.674 79.5669 20.5953V0.641574C79.5669 0.562845 79.503 0.499023 79.4243 0.499023H75.2576Z" fill="#1B2026"/>
        <path d="M32.6905 5.89735C32.7195 5.82654 32.8198 5.82654 32.8488 5.89735L35.4097 12.1491C35.4328 12.2054 35.3914 12.267 35.3306 12.267H30.2084C30.1476 12.267 30.1062 12.2054 30.1293 12.1491L32.6905 5.89735ZM30.869 0.355713C30.8118 0.355713 30.7602 0.389853 30.7378 0.442446L22.1855 20.5398C22.1455 20.6338 22.2145 20.7382 22.3167 20.7382H26.5445C26.6025 20.7382 26.6547 20.7031 26.6766 20.6494L28.4544 16.288C28.4763 16.2344 28.5284 16.1993 28.5864 16.1993H36.9526C37.0105 16.1993 37.0627 16.2344 37.0846 16.288L38.8628 20.6495C38.8847 20.7031 38.9368 20.7382 38.9948 20.7382H43.3388C43.441 20.7382 43.51 20.6338 43.4699 20.5398L34.9169 0.442441C34.8945 0.389851 34.8429 0.355713 34.7858 0.355713H30.869Z" fill="#1B2026"/>
        <path d="M43.9472 17.8806C43.8893 17.83 43.8828 17.7423 43.9321 17.6833L46.3843 14.7459C46.4345 14.6857 46.5241 14.6776 46.585 14.727C48.3728 16.1787 50.251 17.0954 52.5177 17.0954C54.3389 17.0954 55.4376 16.373 55.4376 15.1872V15.1295C55.4376 14.0017 54.7438 13.4237 51.3609 12.5565C47.2843 11.5155 44.6533 10.3877 44.6533 6.36951V6.31108C44.6533 2.63865 47.6021 0.210449 51.7365 0.210449C54.6358 0.210449 57.1171 1.10524 59.1502 2.70134C59.209 2.74748 59.2212 2.83141 59.1788 2.89291L57.0224 6.01964C56.9776 6.08456 56.8885 6.10063 56.8233 6.05621C55.0707 4.86153 53.3472 4.14231 51.6788 4.14231C49.973 4.14231 49.0771 4.92244 49.0771 5.9065V5.96383C49.0771 7.29405 49.9444 7.72765 53.4433 8.62353C57.5479 9.69395 59.8615 11.1682 59.8615 14.6951V14.7525C59.8615 18.7718 56.7968 21.0273 52.431 21.0273C49.4101 21.0276 46.3595 19.9876 43.9472 17.8806Z" fill="#1B2026"/>
        <path d="M95.1202 0.499023C95.0415 0.499023 94.9776 0.562845 94.9776 0.641574V20.5953C94.9776 20.674 95.0415 20.7378 95.1202 20.7378H110.245C110.324 20.7378 110.388 20.674 110.388 20.5953V16.9191C110.388 16.8404 110.324 16.7766 110.245 16.7766H99.5426C99.4639 16.7766 99.4 16.7127 99.4 16.634V12.669C99.4 12.5903 99.4639 12.5265 99.5426 12.5265H108.8C108.879 12.5265 108.942 12.4627 108.942 12.3839V8.70813C108.942 8.62941 108.879 8.56559 108.8 8.56559H99.5426C99.4639 8.56559 99.4 8.50176 99.4 8.42303V4.60283C99.4 4.5241 99.4639 4.46028 99.5426 4.46028H110.101C110.18 4.46028 110.244 4.39646 110.244 4.31773V0.641574C110.244 0.562845 110.18 0.499023 110.101 0.499023H95.1202Z" fill="#1B2026"/>
        <path d="M126.139 0.499023C126.089 0.499023 126.042 0.525103 126.017 0.567788L121.266 8.41988C121.211 8.51198 121.077 8.51146 121.022 8.41893L116.356 0.56874C116.33 0.525515 116.284 0.499023 116.233 0.499023H111.369C111.257 0.499023 111.189 0.623026 111.249 0.717934L118.865 12.723C118.879 12.7459 118.887 12.7723 118.887 12.7994V20.5953C118.887 20.674 118.951 20.7378 119.029 20.7378H123.198C123.276 20.7378 123.34 20.674 123.34 20.5953V12.7133C123.34 12.6861 123.348 12.6594 123.363 12.6365L130.977 0.718324C131.038 0.623436 130.97 0.499023 130.857 0.499023H126.139Z" fill="#1B2026"/>
        <path d="M87.0699 0.499634C87.0321 0.499634 86.9958 0.514648 86.9691 0.541374L83.8643 3.64549L80.8185 6.69128C80.7628 6.74695 80.7628 6.83721 80.8185 6.89288L83.7635 9.83752C83.8192 9.89319 83.9094 9.89319 83.9651 9.83752L87.0109 6.79208L90.1571 3.64549L93.1576 0.64565C93.2115 0.591772 93.1734 0.499634 93.0972 0.499634H87.0699Z" fill="#1B2026"/>
        <mask id="mask1_62_3046" style={{maskType: "alpha"}} maskUnits="userSpaceOnUse" x="80" y="11" width="14" height="10">
            <path d="M84.0046 11.5191C83.9489 11.4634 83.8587 11.4634 83.803 11.5191L80.8984 14.4239C80.8427 14.4796 80.8427 14.5698 80.8984 14.6255L86.9691 20.6961C86.9958 20.7228 87.0321 20.7378 87.0699 20.7378L93.0166 20.7382C93.0928 20.7383 93.131 20.6461 93.0771 20.5922L84.0046 11.5191Z" fill="#66B3FF"/>
        </mask>
        <g mask="url(#mask1_62_3046)">
            <path d="M87.0109 14.5239L83.904 11.4177L80.7979 14.5239H87.0109Z" fill="#0055CC"/>
            <path d="M80.7978 14.5247L83.904 17.6312L87.0109 14.5247H80.7978Z" fill="#0072E5"/>
            <path d="M90.1174 17.6312L87.0109 14.5247L83.904 17.6312H90.1174Z" fill="#0080FF"/>
            <path d="M83.904 17.6307L87.0109 20.7373L90.1174 17.6307H83.904Z" fill="#3392FF"/>
            <path d="M87.0108 20.7376H93.2235L90.117 17.6307L87.0108 20.7376Z" fill="#66B3FF"/>
        </g>
        <path d="M46.8183 29.8458C46.8183 29.7293 46.959 29.6707 47.0416 29.7528L51.9253 34.604C51.9767 34.655 51.9769 34.7379 51.926 34.7892L47.0422 39.7055C46.9598 39.7885 46.8183 39.7301 46.8183 39.6132V29.8458Z" fill="#1B2026"/>
        <path d="M53.9709 39.4492V29.3484H56.7099L59.3764 36.6813H59.0431L61.6951 29.3484H64.4341V39.4492H62.5646V31.5366L62.7385 31.5656L60.1155 38.5652H58.304L55.681 31.5656L55.681 31.5656V39.4492H53.9709ZM66.3824 39.4492V29.3484H73.1067V31.0294H68.2519V33.4351H72.7878V35.1017H68.2519V37.7682H73.1067V39.4492H66.3824ZM74.7606 39.4492V29.3484H78.0937C78.9149 29.3484 79.5767 29.4691 80.0791 29.7107C80.5815 29.9425 80.9486 30.2807 81.1805 30.7251C81.422 31.1599 81.5428 31.6767 81.5428 32.2757C81.5428 33.2032 81.2771 33.923 80.7457 34.435C80.224 34.9374 79.4752 35.2176 78.4995 35.2756C78.2773 35.2852 78.0502 35.29 77.8183 35.29C77.5865 35.29 77.3884 35.29 77.2242 35.29H76.63V39.4492H74.7606ZM80.253 39.4492L77.7169 35.0727L79.6298 34.8408L82.4123 39.4492H80.253ZM76.63 33.609H77.9053C78.2241 33.609 78.514 33.5752 78.7748 33.5075C79.0453 33.4303 79.2627 33.2998 79.4269 33.1163C79.5912 32.923 79.6733 32.6525 79.6733 32.3047C79.6733 31.9473 79.5912 31.6767 79.4269 31.4932C79.2627 31.3096 79.0453 31.1888 78.7748 31.1309C78.514 31.0632 78.2241 31.0294 77.9053 31.0294H76.63V33.609ZM87.8138 39.6811C86.8573 39.6811 86.012 39.4589 85.2777 39.0145C84.5531 38.57 83.9879 37.9517 83.5821 37.1595C83.1764 36.3673 82.9735 35.4446 82.9735 34.3916C82.9735 33.3385 83.1764 32.4207 83.5821 31.6381C83.9879 30.8459 84.5531 30.2275 85.2777 29.7831C86.012 29.3387 86.8573 29.1165 87.8138 29.1165C88.8862 29.1165 89.8088 29.387 90.5817 29.9281C91.3643 30.4594 91.9246 31.1937 92.2628 32.1308L90.4948 32.783C90.2822 32.1936 89.9441 31.7347 89.4803 31.4062C89.0263 31.0777 88.4707 30.9135 87.8138 30.9135C87.2148 30.9135 86.6882 31.0536 86.2342 31.3338C85.7897 31.6139 85.4468 32.0149 85.2052 32.5366C84.9734 33.0486 84.8574 33.667 84.8574 34.3916C84.8574 35.1161 84.9734 35.7393 85.2052 36.261C85.4468 36.7827 85.7897 37.1837 86.2342 37.4638C86.6882 37.744 87.2148 37.8841 87.8138 37.8841C88.4707 37.8841 89.0263 37.7199 89.4803 37.3914C89.9441 37.0629 90.2822 36.604 90.4948 36.0146L92.2628 36.6523C91.9246 37.5894 91.3643 38.3285 90.5817 38.8695C89.8088 39.4106 88.8862 39.6811 87.8138 39.6811ZM93.6538 39.4492V29.3484H95.5232V33.3916H99.8853V29.3484H101.755V39.4492H99.8853V35.1161H95.5232V39.4492H93.6538ZM102.847 39.4492L106.905 29.3484H108.31L112.368 39.4492H110.325L107.629 32.1163L104.89 39.4492H102.847ZM105.513 37.4783L106.093 35.7973H109.136L109.745 37.4783H105.513ZM113.467 39.4492V29.3484H115.394L120.104 37.0001H119.64V29.3484H121.51V39.4492H119.568L114.873 31.783H115.336V39.4492H113.467ZM125.777 39.4492V31.0294H122.647V29.3484H130.791V31.0294H127.676V39.4492H125.777Z" fill="#3273E2"/>
    </svg>
);

function CheckoutContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // URL Params
    const flowId = typeof params.id === 'string' ? params.id : "mock_flow_id";
    const amountParam = searchParams.get("amount") || "0.00";
    const tokenParam = searchParams.get("token") || "USD";
    const complianceParam = searchParams.get("compliance");

    const [status, setStatus] = useState<"loading" | "ready" | "processing" | "success">("ready");

    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");

    const handlePay = async () => {
        setStatus("processing");
        
        try {
            const smartAccountClient = await getClient();
            if (!smartAccountClient || !owner?.address) {
                throw new Error("Wallet not connected");
            }

            // Parse compliance metadata
            let encryptedPayloadHex = "0x";
            const proxyAddress = smartAccountClient.account!.address;
            const amountInUnits = parseUnits(amountParam, tokenParam === "USDC" ? 6 : 18);

            // Generate a unique mock txHash for this payment since it's processed by HSP
            const txHashBytes = window.crypto.getRandomValues(new Uint8Array(32));
            const mockTxHash = bufferToHex(txHashBytes) as `0x${string}`;

            // If compliance data was passed, encrypt and submit to on-chain registry
            if (complianceParam) {
                const decodedCompliance = atob(complianceParam);
                const complianceObj = JSON.parse(decodedCompliance);
                
                // Construct the exact payload format the auditor portal expects
                const payloadData = [{
                    recipient: "0x0000000000000000000000000000000000000000", // HSP gateway address
                    category: complianceObj.categories?.[0] ?? 0,
                    jurisdiction: complianceObj.jurisdictions?.[0] ?? 0,
                    referenceId: complianceObj.referenceIds?.[0] ?? ""
                }];
                
                const jsonPayload = JSON.stringify({ payments: payloadData });
                const aesKey = await deriveAESKey(owner.address);
                const encryptedBytes = await encryptMetadata(jsonPayload, aesKey);
                encryptedPayloadHex = bufferToHex(encryptedBytes);

                // Call ComplianceRegistry directly to append the record
                const call = {
                    to: ComplianceRegistryAddress as `0x${string}`,
                    value: 0n,
                    data: encodeFunctionData({
                        abi: ComplianceRegistryABI,
                        functionName: "recordTransaction",
                        args: [mockTxHash, proxyAddress, ["0x0000000000000000000000000000000000000000"], [amountInUnits], encryptedPayloadHex as `0x${string}`]
                    })
                };

                const hash = await smartAccountClient.sendUserOperation({
                    account: smartAccountClient.account,
                    calls: [call],
                });

                await smartAccountClient.waitForUserOperationReceipt({ hash });
            } else {
                // If no compliance data, just simulate a brief delay for the mock gateway
                await new Promise(r => setTimeout(r, 2000));
            }

            // Save to local mock history to display in the dashboard table
            const history = JSON.parse(localStorage.getItem('mockTxHistory') || '[]');
            const txRecord: any = {
                id: flowId,
                title: "HSP E-Commerce Checkout",
                type: 'HSP Checkout',
                amount: amountParam,
                currency: tokenParam,
                timestamp: Math.floor(Date.now() / 1000),
                txHash: mockTxHash
            };
            if (complianceParam) {
                const decodedCompliance = atob(complianceParam);
                txRecord.compliance = JSON.parse(decodedCompliance);
            }
            history.push(txRecord);
            localStorage.setItem('mockTxHistory', JSON.stringify(history));

            setStatus("success");
            toast.success("HSP Payment successful!");
            
            // Redirect back to wallet after a brief delay
            setTimeout(() => {
                router.push("/wallet");
            }, 2000);

        } catch (error: any) {
            console.error("HSP Mock Payment Error:", error);
            toast.error(error.message || "Failed to process HashKey payment");
            setStatus("ready");
        }
    };

    if (status === "success") {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-semibold text-[#1B2026]">Payment Successful</h2>
                <p className="text-[#717182] text-sm">Redirecting back to merchant...</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header / Logo */}
            <div className="flex flex-col gap-[1.9375rem] items-center pb-0 px-4 relative w-full pt-[3.125rem]">
                <div className="flex items-center justify-center relative shrink-0 w-full">
                    <HashKeyLogo />
                </div>
            </div>

            <div className="flex flex-col gap-2.5 items-center relative shrink-0 w-full pt-[1.875rem]">
                {/* Merchant Name */}
                <div className="text-[#1B2026] text-lg text-center">Complyr Business Account</div>

                {/* Amount Display */}
                <div className="h-12 flex flex-row gap-1 items-baseline">
                    <div className="shrink-0 text-[#1B2026] text-4xl font-semibold">{amountParam}</div>
                    <div className="shrink-0 text-[#1B2026] text-4xl font-semibold">{tokenParam}</div>
                </div>

                <div className="flex flex-col gap-4 items-start px-6 relative shrink-0 w-full mt-6">
                    {/* Network Selector (Visual Mock) */}
                    <div className="flex py-3 items-center justify-between relative shrink-0 w-full">
                        <div className="relative shrink-0">
                            <p className="font-normal leading-5 text-[#1B2026] text-sm text-nowrap">Network</p>
                        </div>
                        <div className="relative">
                            <button type="button" className="border border-[#E2E8F0] py-1.5 border-solid relative rounded-full shrink-0 flex items-center gap-2 px-3 hover:bg-slate-50 transition-colors">
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                    H
                                </div>
                                <p className="font-medium leading-4 text-[#1B2026] text-xs text-nowrap">HashKey Chain Testnet</p>
                                <ChevronDown className="size-3 text-[#717182]" />
                            </button>
                        </div>
                    </div>

                    {/* Token Selection (Visual Mock) */}
                    <div className="flex py-3 items-center justify-between relative shrink-0 w-full">
                        <div className="relative shrink-0">
                            <p className="font-normal leading-5 text-[#1B2026] text-sm text-nowrap">Pay with</p>
                        </div>
                        <div className="relative">
                            <button type="button" className="border border-[#E2E8F0] py-1.5 border-solid relative rounded-full shrink-0 flex items-center gap-2 px-3 hover:bg-slate-50 transition-colors">
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                    {tokenParam[0]}
                                </div>
                                <p className="font-medium leading-4 text-[#1B2026] text-xs text-nowrap">{tokenParam}</p>
                                <ChevronDown className="size-3 text-[#717182]" />
                            </button>
                        </div>
                    </div>

                    <div className="flex py-3 items-center justify-between relative shrink-0 w-full">
                        <div className="relative shrink-0">
                            <p className="font-normal leading-5 text-[#1B2026] text-sm text-nowrap">Network fee</p>
                        </div>
                        <span className="text-sm font-medium text-[#10B981]">Sponsored</span>
                    </div>

                    <div className="flex py-3 items-center justify-between relative shrink-0 w-full mt-2 border-t border-[#F1F5F9] pt-4">
                        <div className="relative shrink-0">
                            <p className="font-semibold leading-5 text-[#1B2026] text-base text-nowrap">Total</p>
                        </div>
                        <div className="flex items-center gap-2 relative shrink-0">
                            <p className="font-semibold leading-5 text-[#1B2026] text-base text-nowrap">{amountParam}</p>
                            <p className="font-semibold leading-5 text-[#1B2026] text-base text-nowrap">{tokenParam}</p>
                        </div>
                    </div>
                </div>

                {complianceParam && (
                    <div className="mt-4 mx-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                            <strong className="font-semibold">DEMO MODE:</strong> This mock HSP gateway will simulate the payment while executing a real smart contract transaction to securely encrypt and log your compliance metadata to the Complyr on-chain registry.
                        </p>
                    </div>
                )}

                {/* Action Button */}
                <div className="w-full px-6 mt-6">
                    <Button 
                        className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all active:scale-[0.98]" 
                        onClick={handlePay}
                        disabled={status === "processing"}
                    >
                        {status === "processing" ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Confirm Payment"
                        )}
                    </Button>
                </div>

                {/* Footer Content inside Card */}
                <div className="w-full mt-8 px-6 pb-6 border-t border-[#F1F5F9] pt-6 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-[#94A3B8]">
                        <span>supported by</span>
                        <span className="font-semibold text-[#64748B]">HashKey Group</span>
                    </div>
                    <div className="flex gap-4 text-[10px] text-[#94A3B8]">
                        <a href="#" className="hover:text-[#475569] transition-colors">Terms</a>
                        <a href="#" className="hover:text-[#475569] transition-colors">Privacy</a>
                        <a href="#" className="hover:text-[#475569] transition-colors">Support</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Real HashKey Background Pattern */}
            <div className="fixed inset-0 -z-10 overflow-hidden bg-[#F8FAFC]">
                <div className="absolute inset-0" style={{ 
                    backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.8) 1px, transparent 1px), linear-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)", 
                    backgroundSize: "10px 10px", 
                    opacity: 1 
                }}></div>
                <div className="absolute -inset-[20%]" style={{ 
                    background: "radial-gradient(800px, rgba(147, 197, 253, 0.15), rgba(191, 219, 254, 0.05) 40%, transparent 70%)",
                    opacity: 1,
                    transform: "translate(6.05876%, -3.02938%)"
                }}></div>
                <div className="absolute -inset-[20%]" style={{ 
                    background: "radial-gradient(600px, rgba(191, 219, 254, 0.1), transparent 60%)",
                    opacity: 1,
                    transform: "translate(19.9922%, -9.9961%)"
                }}></div>
            </div>

            <div className="mx-4 w-full max-w-[29.25rem] relative">
                {/* Main Card */}
                <div className="bg-white border border-[rgba(0,0,0,0.1)] border-solid flex flex-col items-center p-1 relative rounded-xl shadow-[0rem_0.625rem_0.9375rem_-0.1875rem_rgba(0,0,0,0.1),0rem_0.25rem_0.375rem_-0.25rem_rgba(0,0,0,0.1)] w-full">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-[#717182] text-sm font-medium">Initializing Secure Environment...</p>
                        </div>
                    }>
                        <CheckoutContent />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}


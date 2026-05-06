import { zeroAddress } from "viem";

const getAddressConfig = (value: string | undefined): `0x${string}` => (value ?? zeroAddress) as `0x${string}`;

export const RegistryAddress = getAddressConfig(process.env.NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS);
export const SmartWalletFactoryAddress = getAddressConfig(process.env.NEXT_PUBLIC_SMART_WALLET_FACTORY_ADDRESS);
export const AuditRegistryAddress = getAddressConfig(process.env.NEXT_PUBLIC_AUDIT_REGISTRY_ADDRESS);
export const MockUSDCAddress = getAddressConfig(process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS);
export const ENTRY_POINT_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

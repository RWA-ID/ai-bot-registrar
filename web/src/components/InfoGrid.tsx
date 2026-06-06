import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { ABI, REGISTRAR_ADDRESS } from "../lib/contract";

export function InfoGrid() {
  const { data: price } = useReadContract({
    address: REGISTRAR_ADDRESS,
    abi: ABI,
    functionName: "registrationPrice",
  });

  const stats = [
    {
      label: "Registration Fee",
      value: price ? `${formatEther(price)} ETH` : "0.001 ETH",
      sub: "One-time, no renewals",
    },
    {
      label: "Standard",
      value: "ERC-8004",
      sub: "Trustless Agents Standard",
    },
    {
      label: "Contract",
      value: "Verified",
      sub: "Ethereum Mainnet",
      link: "https://etherscan.io/address/0x309b7AA8C5713Df1a25D05AA6DE07Ec6971Edf89",
    },
    {
      label: "Ownership",
      value: "100% Yours",
      sub: "Non-custodial, onchain",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="card p-4 flex flex-col gap-1 hover:border-[rgba(6,182,212,0.2)] transition-colors"
        >
          <p className="text-[#444] text-xs uppercase tracking-wider">{stat.label}</p>
          {stat.link ? (
            <a
              href={stat.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#06b6d4] font-bold text-sm hover:underline"
            >
              {stat.value} ↗
            </a>
          ) : (
            <p className="text-[#f0f0f0] font-bold text-sm">{stat.value}</p>
          )}
          <p className="text-[#333] text-xs">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

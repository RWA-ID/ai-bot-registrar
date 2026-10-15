import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { ABI, REGISTRAR_ADDRESS } from "../lib/contract";
import { ArrowNE } from "./ArrowNE";

export function InfoGrid() {
  const { data: price } = useReadContract({
    address: REGISTRAR_ADDRESS,
    abi: ABI,
    functionName: "fee",
  });

  const stats = [
    {
      label: "Registration fee",
      value: price ? `${formatEther(price)} ETH` : "0.001 ETH",
      sub: "One-time, no renewal fees",
    },
    {
      label: "Website",
      value: "$0.25",
      sub: "Per deploy, USDC on Base",
    },
    {
      label: "Contract",
      value: "Verified",
      sub: "Ethereum mainnet",
      link: `https://etherscan.io/address/${REGISTRAR_ADDRESS}`,
    },
    {
      label: "Ownership",
      value: "100%",
      sub: "The parent can't revoke it",
    },
  ];

  return (
    <section className="bg-[var(--lime)] text-[var(--bg)]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-7 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        {stats.map((stat, i) => {
          const body = (
            <>
              <span className="eyebrow font-semibold">{stat.label}</span>
              <span className="font-display font-bold text-[40px] leading-none inline-flex items-center gap-2">
                {stat.value}
                {stat.link && <ArrowNE className="text-[28px]" />}
              </span>
              <span className="text-[13px] font-medium">{stat.sub}</span>
            </>
          );
          const cls = `py-[34px] px-6 flex flex-col gap-1.5 ${i === 0 ? "sm:pl-0" : ""} ${
            i < stats.length - 1 ? "border-b sm:border-b-0 sm:border-r border-[rgba(11,12,10,.18)]" : ""
          }`;
          return stat.link ? (
            <a
              key={stat.label}
              href={stat.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`${cls} text-[var(--bg)] hover:text-[var(--bg)] hover:bg-[var(--lime-press)] transition-colors`}
            >
              {body}
            </a>
          ) : (
            <div key={stat.label} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}

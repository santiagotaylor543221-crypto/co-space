import Image from "next/image";
import Link from "next/link";

export default function Brand() {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center gap-2.5 font-heading text-xl font-semibold tracking-tight text-ink">
      <Image src="/brand/co-space.svg" width={32} height={32} alt="" />
      <span>co-space</span>
    </Link>
  );
}

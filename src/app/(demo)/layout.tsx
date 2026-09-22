import { PhoneShell } from "@/components/phone/PhoneShell";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PhoneShell>{children}</PhoneShell>;
}

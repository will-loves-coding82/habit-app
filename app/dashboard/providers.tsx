import {HeroUIProvider} from '@heroui/system'
import {ToastProvider} from "@heroui/toast";

export default function Providers({children}: {
  children: React.ReactNode;
}) {
  return (
    <HeroUIProvider className="min-h-screen w-full flex flex-col items-center">
      <ToastProvider />
      {children}
    </HeroUIProvider>
  )
}
"use client"
import {HeroUIProvider} from '@heroui/system'
import {ToastProvider} from "@heroui/toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function ToastProviders({children}: {
  children: React.ReactNode;
}) {

    const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>

    <HeroUIProvider className="min-h-screen w-full flex flex-col items-center">
      <ToastProvider />
      {children}
    </HeroUIProvider>
   </QueryClientProvider >

  )
}
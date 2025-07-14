import { useState } from "react";



export function useChatMessages() {

  const [chatMessages, setChatMessages] = useState<any[]>([])




  return {chatMessages}
}
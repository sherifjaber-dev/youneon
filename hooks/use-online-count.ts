"use client";

import { useEffect, useState } from "react";
import { subscribeToOnlineCount, waitHintFromOnlineCount } from "@/lib/online-count";

export function useOnlineCount() {
  const [count, setCount] = useState(0);

  useEffect(() => subscribeToOnlineCount(setCount), []);

  return {
    count,
    hint: waitHintFromOnlineCount(count),
  };
}

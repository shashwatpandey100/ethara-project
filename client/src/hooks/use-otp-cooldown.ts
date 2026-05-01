"use client";

import * as React from "react";

export function useOtpCooldown(seconds = 60) {
  const [remaining, setRemaining] = React.useState(0);

  React.useEffect(() => {
    if (remaining === 0) return;
    const id = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const start = () => setRemaining(seconds);

  return { remaining, isActive: remaining > 0, start };
}

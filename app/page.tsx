'use client';

import React, { useState, useEffect } from 'react';
import App from '../App';

export default function Page() {
  // Ensure we only render on client to avoid hydration mismatch with complex context providers
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-screen w-screen items-center justify-center bg-slate-50">Loading ScrumOwl...</div>;
  }

  return <App />;
}
"use client";

import dynamic from 'next/dynamic';

// Dynamically import the InstallPWA component
const InstallPWA = dynamic(() => import('./InstallPWA'), { ssr: false });

export default function InstallPWAWrapper() {
  return <InstallPWA />;
} 
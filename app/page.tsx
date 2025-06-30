"use client";

import React, { useState } from 'react';
import Image from "next/image";
import CampaignTable from '../components/CampaignTable';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <CampaignTable />
    </main>
  );
}

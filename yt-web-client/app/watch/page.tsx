"use client";

import { useSearchParams } from "next/navigation";

import React, { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ShowVideo />
    </Suspense>
  );
}

function ShowVideo() {
  const searchParams = useSearchParams();
  const videoPrefix =
    "https://storage.googleapis.com/prac-nc-yt-processed-videos/";
  const videoSrc = searchParams.get("v");

  return (
    <div>
      <h1>Watch Page</h1>
      <video controls src={videoPrefix + videoSrc} />
    </div>
  );
}
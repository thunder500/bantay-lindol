import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>BantayLindol · Philippine Earthquake Monitor</title>
        <meta name="description" content="Live Philippine earthquake monitor with PHIVOLCS, EMSC, and USGS data, active faults, trenches, and instant alerts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

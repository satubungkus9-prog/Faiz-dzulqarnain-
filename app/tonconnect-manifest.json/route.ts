import { NextResponse } from "next/server"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET() {
  const headersList = await headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const forwardedProto = headersList.get("x-forwarded-proto")
  const protocol = forwardedProto ?? (host.startsWith("localhost") ? "http" : "https")
  const origin = `${protocol}://${host}`

  return NextResponse.json(
    {
      url: origin,
      name: "Wallet Login",
      iconUrl: `${origin}/wallet-icon.png`,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    },
  )
}

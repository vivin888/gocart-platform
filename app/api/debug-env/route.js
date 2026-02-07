export async function GET() {
  return Response.json({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY ? "exists" : "missing",
    endpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  })
}

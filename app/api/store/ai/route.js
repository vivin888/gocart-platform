import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function main(base64Image, mimeType) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const prompt = `
You are a product listing assistant.

Respond ONLY with valid JSON.
No markdown. No explanation.

Schema:
{
  "name": string,
  "description": string
}
`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    },
    prompt,
  ]);

  const raw = result.response.text();
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("AI did not return valid JSON");
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId || !(await authSeller(userId))) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 401 }
      );
    }

    const { base64Image, mimeType } = await request.json();

    if (!base64Image || !mimeType) {
      return NextResponse.json(
        { error: "Image data missing" },
        { status: 400 }
      );
    }

    const result = await main(base64Image, mimeType);
    return NextResponse.json(result);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "AI failed" },
      { status: 400 }
    );
  }
}

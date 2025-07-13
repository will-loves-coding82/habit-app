import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});


export async function POST(req: Request) {

  // const isAuth = (await cookies()).get("sb-127-auth-token");

  // if (!isAuth) {
  //   return NextResponse.json({
  //     error: "Unauthorized",
  //   }, { status: 403 });
  // }


  const request = await req.json();

  if (!req?.text) {
    return NextResponse.json(
      {
        error: "No input provided",
      }, 
      { status: 400 }
    );
  }


  try {
    const result = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: request.text,
      encoding_format: "float"
    })

    const embedding = result.data[0].embedding;
    const token = result.usage.total_tokens

    return NextResponse.json(
      {
        embedding: embedding,
        token: token
      }, 
      { status: 200}
    );
  }

  catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create embedding",
        details: error instanceof Error ? error.message : "Unknown error",
      }, 
      { status: 500 }
    );
  }
}


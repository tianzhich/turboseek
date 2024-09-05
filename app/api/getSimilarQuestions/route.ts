import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let { question } = await request.json();
  let similarQuestions: string[] = [];

  let response: any = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      headers: {
        "Content-Type": "application/json",
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `
          You are a helpful assistant that helps the user to ask related questions, based on user's original question. Please identify worthwhile topics that can be follow-ups, and write 3 questions no longer than 20 words each. Please make sure that specifics, like events, names, locations, are included in follow up questions so they can be asked standalone. For example, if the original question asks about "the Manhattan project", in the follow up question, do not just say "the project", but use the full name "the Manhattan project". Your related questions must be in the same language as the original question.

          Please provide these 3 related questions as a JSON format. Do NOT repeat the original question. ONLY return the JSON string, I will get fired if you don't return JSON. Here is the user's original question:`,
          },
          {
            role: "user",
            content: question,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "mySchema",
            schema: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  minItems: 3,
                  maxItems: 3,
                },
              },
              required: ["questions"],
            },
          },
        },
        model: "gpt-4o-mini",
      }),
    },
  );
  response = await response.json();
  response = response.choices[0].message.content;
  try {
    similarQuestions = JSON.parse(response).questions;
  } catch (error) {
    similarQuestions = [];
  }

  return NextResponse.json(similarQuestions);
}

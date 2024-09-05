import { AIStreamPayload, AIStream } from "@/utils/AIStream";

export const maxDuration = 45;

export async function POST(request: Request) {
  const EXA_API_KEY = process.env["EXA_API_KEY"];
  if (!EXA_API_KEY) {
    throw new Error("EXA_API_KEY is required");
  }

  let { question, sources } = await request.json();
  let results: string[] = [];

  console.log("[getAnswer] Fetching text from source URLS");
  const resultUrls = sources.map((result: any) => result.url);
  try {
    const response = await fetch("https://api.exa.ai/contents", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": EXA_API_KEY,
      },
      body: JSON.stringify({
        ids: resultUrls,
      }),
    });
    const rawJSON = await response.json();
    results = rawJSON.results.map((r: any) => r.text);
  } catch (e) {
    console.log("Error fetching text from source URLs: ", e);
  }

  const mainAnswerPrompt = `
  Given a user question and some context, please write a clean, concise and accurate answer to the question based on the context. You will be given a set of related contexts to the question, each starting with a reference number like [[citation:x]], where x is a number. Please use the context when crafting your answer.

  Your answer must be correct, accurate and written by an expert using an unbiased and professional tone. Please limit to 1024 tokens. Do not give any information that is not related to the question, and do not repeat. Say "information is missing on" followed by the related topic, if the given context do not provide sufficient information.

  Here are the set of contexts:

  <contexts>
  ${results.map((result, index) => `[[citation:${index}]] ${result} \n\n`)}
  </contexts>

  Remember, don't blindly repeat the contexts verbatim and don't tell the user how you used the citations – just respond with the answer. It is very important for my career that you follow these instructions. Here is the user question:
    `;

  const payload: AIStreamPayload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: mainAnswerPrompt },
      {
        role: "user",
        content: question,
      },
    ],
    stream: true,
  };

  try {
    console.log(
      "[getAnswer] Fetching answer stream from Together API using text and question",
    );
    const stream = await AIStream(payload);
    // TODO: Need to add error handling here, since a non-200 status code doesn't throw.
    return new Response(stream, {
      headers: new Headers({
        "Cache-Control": "no-cache",
      }),
    });
  } catch (e) {
    // If for some reason streaming fails, we can just call it without streaming
    console.log(
      "[getAnswer] Answer stream failed. Try fetching non-stream answer.",
    );

    let answer = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({ ...payload, stream: false }),
    });
    let parsedAnswer = await answer.json();
    parsedAnswer = parsedAnswer.choices![0].message?.content;

    console.log("Error is: ", e);
    return new Response(parsedAnswer, { status: 202 });
  }
}

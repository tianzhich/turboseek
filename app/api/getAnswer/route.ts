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
    results = rawJSON.results.map(({ text, url }: any) => ({ text, url }));
  } catch (e) {
    console.log("Error fetching text from source URLs: ", e);
  }

  const mainAnswerPrompt = `
  Given a user question and some context, please write a verbose answer with a lot of details to the question based on the context. You will be given a set of related contexts to the question, each starting with a reference number. Please use the context when crafting your answer. 
  
  You must respond back ALWAYS IN MARKDOWN. Say "No relevant results found.", if the given context do not provide sufficient information.

  Here are the set of contexts:

  <contexts>
  ${results.map(({ text, url }: any, index) => `${url ? `[${index + 1}](${url})` : index + 1}. ${text} \n\n`)}
  </contexts>

  Remember, you have to cite the answer using [[number]](url) notation so the user can know where the information is coming from.
  Place these citations at the end of that particular sentence. You can cite the same sentence multiple times if it is relevant to the user's query like [number1][number2].
  However you do not need to cite it using the same number. You can use different numbers to cite the same sentence multiple times. The number refers to the number of the search result (passed in the context) used to generate that part of the answer.
  
  It is very important for my career that you follow these instructions. Here is the user question:
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

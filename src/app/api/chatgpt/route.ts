import { OpenAI } from "langchain/llms/openai";
import dotenv from "dotenv";
import { LLMChain } from "langchain/chains";
import { StreamingTextResponse, LangChainStream } from "ai";
import clerk from "@clerk/clerk-sdk-node";
import { CallbackManager } from "langchain/callbacks";
import { PromptTemplate } from "langchain/prompts";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import MemoryManager from "@/app/utils/memory";
import { rateLimit } from "@/app/utils/rateLimit";

dotenv.config({ path: `.env.local` });

export async function POST(req: Request) {
  try { // Added try-catch block for overall error handling
    let clerkUserId;
    let user;
    let clerkUserName;
    const { prompt, isText, userId, userName } = await req.json();

    console.log("INFO: Received request JSON"); // Added log

    const identifier = req.url + "-" + (userId || "anonymous");
    const { success } = await rateLimit(identifier);
    if (!success) {
      console.log("INFO: rate limit exceeded"); // Existing log
      return new NextResponse(
        JSON.stringify({ Message: "Hi, the companions can't talk this fast." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("INFO: Passed rate limit check"); // Added log

    const name = req.headers.get("name");
    const companionFileName = name + ".txt";

    console.log("INFO: Retrieved companion name and file"); // Added log

    if (isText) {
      clerkUserId = userId;
      clerkUserName = userName;
    } else {
      user = await currentUser();
      clerkUserId = user?.id;
      clerkUserName = user?.firstName;
    }

    console.log("INFO: Set Clerk user ID and name"); // Added log

    if (!clerkUserId || !!!(await clerk.users.getUser(clerkUserId))) {
      console.log("ERROR: User not authorized"); // Updated log
      return new NextResponse(
        JSON.stringify({ Message: "User not authorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("INFO: User authorized"); // Added log

    const fs = require("fs").promises;
    const data = await fs.readFile("companions/" + companionFileName, "utf8");

    console.log("INFO: Read companion file"); // Added log

    const presplit = data.split("###ENDPREAMBLE###");
    const preamble = presplit[0];
    const seedsplit = presplit[1].split("###ENDSEEDCHAT###");
    const seedchat = seedsplit[0];

    const companionKey = {
      companionName: name!,
      modelName: "chatgpt",
      userId: clerkUserId,
    };
    const memoryManager = await MemoryManager.getInstance();

    console.log("INFO: Initialized MemoryManager"); // Added log

    const records = await memoryManager.readLatestHistory(companionKey);
    if (records.length === 0) {
      await memoryManager.seedChatHistory(seedchat, "\n\n", companionKey);
    }

    console.log("INFO: Checked and possibly seeded chat history"); // Added log

    await memoryManager.writeToHistory("Human: " + prompt + "\n", companionKey);
    let recentChatHistory = await memoryManager.readLatestHistory(companionKey);

    console.log("INFO: Updated chat history"); // Added log

    const similarDocs = await memoryManager.vectorSearch(
      recentChatHistory,
      companionFileName
    );

    console.log("INFO: Performed vector search"); // Added log

    let relevantHistory = "";
    if (!!similarDocs && similarDocs.length !== 0) {
      relevantHistory = similarDocs.map((doc) => doc.pageContent).join("\n");
    }

    const { stream, handlers } = LangChainStream();

    const model = new OpenAI({
      streaming: true,
      modelName: "gpt-3.5-turbo-16k",
      openAIApiKey: process.env.OPENAI_API_KEY,
      callbackManager: CallbackManager.fromHandlers(handlers),
    });
    model.verbose = true;

    console.log("INFO: Initialized OpenAI model"); // Added log

    const replyWithTwilioLimit = isText
      ? "You reply within 1000 characters."
      : "";

    const chainPrompt = PromptTemplate.fromTemplate(`
      You are ${name} and are currently talking to ${clerkUserName}.
      ${preamble}
      You reply with answers that range from one sentence to one paragraph and with some details. ${replyWithTwilioLimit}
      Below are relevant details about ${name}'s past
      ${relevantHistory}
      Below is a relevant conversation history
      ${recentChatHistory}`);

    const chain = new LLMChain({
      llm: model,
      prompt: chainPrompt,
    });

    const result = await chain
      .call({
        relevantHistory,
        recentChatHistory: recentChatHistory,
      })
      .catch(console.error);

    console.log("INFO: Generated chat response"); // Added log

    const chatHistoryRecord = await memoryManager.writeToHistory(
      result!.text + "\n",
      companionKey
    );

    console.log("INFO: Updated chat history with new response"); // Added log

    if (isText) {
      return NextResponse.json(result!.text);
    }
    return new StreamingTextResponse(stream);
  } catch (error) { // Catch any unhandled errors
    console.error("ERROR: An unhandled error occurred", error); // Log the error
    return new NextResponse(
      JSON.stringify({ Message: "Internal Server Error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

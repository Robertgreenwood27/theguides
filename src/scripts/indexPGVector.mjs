import dotenv from "dotenv";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { CharacterTextSplitter } from "langchain/text_splitter";
import fs from "fs";
import path from "path";

dotenv.config({ path: `.env.local` });

async function main() {
  try {
    const fileNames = fs.readdirSync("companions");
    const splitter = new CharacterTextSplitter({
      separator: " ",
      chunkSize: 200,
      chunkOverlap: 50,
    });

    const langchainDocs = await Promise.all(
      fileNames.map(async (fileName) => {
        if (fileName.endsWith(".txt")) {
          const filePath = path.join("companions", fileName);
          const fileContent = fs.readFileSync(filePath, "utf8");
          const lastSection = fileContent.split("###ENDSEEDCHAT###").slice(-1)[0];
          const splitDocs = await splitter.createDocuments([lastSection]);
          return splitDocs.map((doc) => {
            return new Document({
              metadata: { fileName },
              pageContent: doc.pageContent,
            });
          });
        }
      })
    );

    if (process.env.VECTOR_DB === "pinecone") {
      // Add your Pinecone logic here
    } else {
      const auth = {
        detectSessionInUrl: false,
        persistSession: false,
        autoRefreshToken: false,
      };

      const client = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PRIVATE_KEY,
        { auth }
      );

      await SupabaseVectorStore.fromDocuments(
        langchainDocs.flat().filter((doc) => doc !== undefined),
        new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
        {
          client,
          tableName: "documents",
        }
      );
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();

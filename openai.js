import { config } from "dotenv";
config();
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import axios from "axios";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

async function askQuestion() {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "case",
      message: "What can I do to you, that a human can't?",
      choices: ["Chat", "Editor chat", "Generate image"],
    },
  ]);
  return answers.case === "Chat"
    ? startChat("input")
    : answers.case === "Editor chat"
    ? startChat("editor")
    : createImage();
}

askQuestion();

async function createImage() {
  const message = { type: "input", name: "Image Request" };
  const input = await inquirer.prompt(message);
  console.log("Generating image...");

  const response = await openai.createImage({
    prompt: input["Image Request"],
    n: 2,
    size: "1024x1024",
  });
  const imageUrl = response.data.data[0].url;
  const res = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });
  const imageBuffer = res.data;
  const imageFolderPath = path.join(".", "images");
  const imagePath = path.join(imageFolderPath, `image.png`); // use add-filename-increment to increment filename to avoid overwriting
  // Create the images folder if it doesn't exist
  !fs.existsSync(imageFolderPath) && fs.mkdirSync(imageFolderPath);
  // Write the image file to disk
  fs.writeFileSync(imagePath, imageBuffer);
  console.log("Image successfully generated and saved to /images");
}

function startChat(type) {
  async function askGPT() {
    const message = { type: type, name: "Message" };
    const input = await inquirer.prompt(message);
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: input.Message }],
    });
    const gptAnswer = response.data.choices[0].message.content;
    console.log(gptAnswer);
    askGPT();
  }
  askGPT();
}

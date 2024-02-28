// index.js
const app = require("express")();
const OpenAI = require('openai');
const apiKey = "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";
const assistantId = "asst_4H5fTUrVfne0q3vNHwWLmEA9";

const get_charity = require("./charityInformation");
global.get_charity = get_charity;

const hardcodedQuestion = "Tell me about World Vision Canada";

const openai = new OpenAI({ apiKey });

app.get("/", async (request, response) => {
    try {
        const assistant = await openai.beta.assistants.retrieve(assistantId);
        const thread = await openai.beta.threads.create();

        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: "Tell me about World Vision Canada",
        });

        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: assistant.id,
        });

        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

        while (runStatus.status !== "completed") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

            if (runStatus.status === "requires_action") {
                const toolCalls = runStatus.required_action.submit_tool_outputs.tool_calls;
                const toolOutputs = [];

                for (const toolCall of toolCalls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    const argsArray = Object.keys(args).map((key) => args[key]);
                    const output = await global[functionName].apply(null, argsArray);

                    toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: output,
                    });
                }

                await openai.beta.threads.runs.submitToolOutputs(
                    thread.id,
                    run.id,
                    { tool_outputs: toolOutputs }
                );

                continue;
            }

            if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
                console.log(
                  `Run status is '${runStatus.status}'. Unable to complete the request.`
                );
                break; // Exit the loop if the status indicates a failure or cancellation
            }

            const messages = await openai.beta.threads.messages.list(thread.id);

            const lastMessageForRun = messages.data
                .filter((message) => message.run_id === run.id && message.role === "assistant")
                .pop();

            if (lastMessageForRun) {

                // console.log('Entered here')
                // console.log(`${lastMessageForRun.content[0].text.value} \n`);

                if (lastMessageForRun.content[0]?.text?.value) {
                    return response.send(`${lastMessageForRun.content[0].text.value} \n`);
                }

                

                // return response.status(200).json({ answer: lastMessageForRun.content[0].text.value }); 
            } else if (
                !["failed", "cancelled", "expired"].includes(runStatus.status)
            ) {
                console.log("No response received from the assistant.");
            }
        }

    
    } catch (error) {
        console.error("Error retrieving assistant:", error);
        return response.status(500).send("An error occurred while retrieving the assistant.");
    }
});

app.listen(4000, () => console.log("Server running!!!"));
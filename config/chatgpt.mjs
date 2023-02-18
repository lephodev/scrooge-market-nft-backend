import { Configuration, OpenAIApi } from 'openai';
import * as db from './mongodb.mjs';
import dotenv from 'dotenv';
const envconfig = dotenv.config();
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

export async function getAIMessage(req) {
    let resp;
    const prompt = req.params.prompt;
    const user_id = req.params.user_id;
    const completion = await openai.createCompletion({
        model: "text-curie-001",
        prompt: prompt,
        max_tokens: 300,
    });

    const query = await db.get_affiliatesDB().findOne({"user_id" : user_id}).then(async (user)=>{
        if (user) {
            const query2 = await db.get_affiliatesDB().findOneAndUpdate({"user_id" : user_id},{$inc:{"ai_tickets":-1}}).then(async (trans)=>{
                resp = completion.data.choices[0].text;
            });
        }
        
    });
    //resp = completion.data.choices[0].text;
    return resp;
}
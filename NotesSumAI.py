import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dotenv import load_dotenv

from openai import OpenAI


MODEL="gpt-3.5-turbo"


filename = 'c:\\sac\\dev\\OpenAI-Key1.txt'

with open(filename, 'r')as keyfile:
    key = keyfile.readline()
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
client = OpenAI(api_key=key)


# MODEL = os.getenv("MODEL", "gpt-4o-mini")

app = FastAPI(title="AI Notes Summarizer")

#  set up the middleware right after the app reinitialization
origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:8080", # if you're serving the frontend on a different port
    "file://", # This is for when you open the file directly in the browser
    "null" # Some browsers, especially Safari, use "null" for file:// origins
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, we'll allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
##################


class SummarizeIn(BaseModel):
    text: str
    max_words: int = 200  # keep it short by default


@app.post("/summarize")
def summarize(payload: SummarizeIn):
    text = payload.text.strip()

    PROMPT = f'''
                            Summarize the following text in under {payload.max_words} words.
                            Keep key facts, ignore fluff unless things are tense or swear words are used.
                            First, in the summary section, state the main takeaways, topics or issues discussed. 
                            Then, If any  actions were assigned or -taken by self specify them clearly in the following format - \n
                                                        Action items - 
                            - [Attendee] 
                                    - <Action items assigned>
                            - [Attendee] ... and so on.. 
                            Do not repeat any of the actions in the summary section. 
                            
                            TEXT:\n{text}
            '''

    print(PROMPT)

    if not text:
        raise HTTPException(status_code=400, detail="No text provided.")
    print ('Starting to sumamrize')
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a concise, neutral summarizer."},
                {
                    "role": "user",
                    "content": PROMPT,
                },
            ],
            temperature=0.2,
        )
        print ('summary completed successfuly')
        summary = resp.choices[0].message.content.strip()
        print (f'message received = {resp.choices[0].message.content.strip()}')
        return {"summary": summary}
    except Exception as e:
        print (f'EXCEPTION: {e}')
        raise HTTPException(status_code=500, detail=str(e))

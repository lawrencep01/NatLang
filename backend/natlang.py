from openai import OpenAI
from config import Config

OpenAI.api_key = Config.OPENAI_API_KEY
openai_client = OpenAI(api_key=OpenAI.api_key)


def convert_query(prompt, schema_description):
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are specialized in generating SQL queries suitable for PostgreSQL."
                    f"Provide only the SQL queries without any extra text, explanation, formatting, or markdowns."
                    f"Handle multi-step operations if required and output the queries in order of execution."
                    f"Assume the table schema is as follows:\n{schema_description}"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Convert the following natural language query into SQL queries that are executable: {prompt}"
                ),
            },
        ],
        max_tokens=300,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()

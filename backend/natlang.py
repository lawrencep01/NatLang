from openai import OpenAI
from config import Config

OpenAI.api_key = Config.OPENAI_API_KEY
openai_client = OpenAI(api_key=OpenAI.api_key)


def convert_query(prompt, schema):
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are an expert at converting natural language requests into technical SQL commands."
                    f"Provided is the table schema for the database you are working with:\n{schema}\n"
                    f"Decompose complex operations into smaller, logically ordered steps if needed."
                    f"The output should contain only valid SQL query text, no formatting, or markdown syntax such as '''sql."
                    f"You should not provide any additional comments or explanations in the output."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Convert the following natural language request into SQL query(s)\n"
                    f"{prompt}"
                ),
            },
        ],
        max_tokens=300,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()

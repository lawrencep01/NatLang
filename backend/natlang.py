from openai import OpenAI
from config import Config

OpenAI.api_key = Config.OPENAI_API_KEY
openai_client = OpenAI(api_key=OpenAI.api_key)


def convert_query(prompt, schema):
    schema_str = format_schema(schema)
    print(schema_str)
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert at converting natural language requests into technical SQL commands. "
                    "Provided is the available database schema you are working with:\n"
                    f"{schema_str}\n"
                    "When converting the request, ensure the following:\n"
                    "1. Verify that all referenced columns exist in the schema.\n"
                    "2. Utilize foreign key relationships to join tables when necessary.\n"
                    "3. If a column does not exist in the specified table, check related tables through foreign keys.\n"
                    "4. Use schema-qualified table names to avoid ambiguity.\n"
                    "5. Decompose complex operations into smaller, logically ordered steps if needed.\n"
                    "The output should contain only valid SQL query text, no formatting, or markdown syntax such as '''sql.\n"
                    "You should not provide any additional comments or explanations in the output."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Convert the following natural language request into SQL query(s):\n"
                    f"{prompt}"
                ),
            },
        ],
        max_tokens=300,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()


def analyze_query(query, schema):
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are an expert at analyzing SQL commands."
                    f"Provided is the table schema for the database you are working with:\n{schema}\n"
                    f"Analyze the command and provide a suitable table name and description for the data that would be returned."
                    f"The table name should be short, formatted like a book title with spaces between words, and tailored around the command itself."
                    f"The description should be concise and informative, while remaining small enough to fit in a single line."
                    f"You should only provide the table name and table description, no additional comments or explanations."
                    f"The output should be formatted as follows 'table_name|table_description'."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Get a table name and description natural language request: \n"
                    f"{query}"
                ),
            },
        ],
        max_tokens=100,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def generate_details(missing_descriptions, schema):
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert at generating SQL table and column descriptions. "
                    "Generate SQL commands to put these descriptions in the database. "
                    f"Provided is the table schema for the database you are working with:\n{schema}\n"
                    f"Also provided are the tables and columns in the database that are missing descriptions:\n{missing_descriptions}\n"
                    "The output should contain only valid SQL query text, no formatting, or markdown syntax such as '''sql. "
                    "The descriptions should be concise and informative."
                    "Only be provided for tables and columns that are missing descriptions. "
                    "You should not provide any additional comments or explanations in the output. "
                    "Ensure that any single quotes within the descriptions are properly escaped by doubling them (e.g., ' becomes '')."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Generate SQL commands to provide detailed descriptions of the database's tables and columns."
                ),
            },
        ],
        max_tokens=3000,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def format_schema(schema):
    lines = []
    for schema_name, tables in schema.items():
        lines.append(f"Schema: {schema_name}")
        for table, columns in tables.items():
            lines.append(f"  Table: {table}")
            for column in columns:
                column_info = (
                    f"    - {column['name']} ({column['type']})"
                    f" [Nullable: {'YES' if column['nullable'] else 'NO'}]"
                    f" [Default: {column['default'] or 'None'}]"
                )
                if column["primary_key"]:
                    column_info += " [Primary Key]"
                if column["foreign_keys"]:
                    fks = ", ".join(
                        [
                            f"{fk['table']}.{fk['column']}"
                            for fk in column["foreign_keys"]
                        ]
                    )
                    column_info += f" [Foreign Keys: {fks}]"
                if column["description"]:
                    column_info += f" → {column['description']}"
                lines.append(column_info)
            lines.append("")

    max_length = max(len(line) for line in lines)
    header = "Available Database Schema:"
    centered_header = header.center(max_length)

    schema_str = centered_header + "\n" + "\n".join(lines)
    return schema_str

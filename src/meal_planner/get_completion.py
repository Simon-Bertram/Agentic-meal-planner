import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client = OpenAI()  # SDK reads OPENAI_API_KEY; no import os


def get_completion(prompt, system_prompt="You are a helpful assistant.", json_mode=False):
	response = client.chat.completions.create(
		model="gpt-4o",
		messages=[
			{"role": "system", "content": system_prompt},
			{"role": "user", "content": prompt}
		],
		response_format={"type": "json_object"} if json_mode else None
	)
	return response.choices[0].message.content

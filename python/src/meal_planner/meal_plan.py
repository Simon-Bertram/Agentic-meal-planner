import json
from get_completion import get_completion
from user_inputs import user_inputs

# Here we draft a meal plan for the week that should align with the user input's parameters.

schema_string = """
{
    "menu": [
    {
        "day": "",
        "dish": "",
        "ingredients": [],
        "calories": 0,
        "estimated_cost_usd": 0
    }],
    "total_cost": 0
}
"""

def draft_meal_plan(user_inputs):

    system_prompt = f"""You are a registered dietician who writes weekly dinner plans."""

    user_prompt = f"""
    <instructions>
    Your task is to create a {user_inputs["days"]}-day **dinner** plan for a family of {user_inputs["people"]} people.

    - Assign around {user_inputs["daily_calories"]} calories *per person* each day.
    - Keep your estimated total cost less than or equal to {user_inputs["budget"]} USD.
    - One or more of the family members have the following allergies: {", ".join(user_inputs["allergens"])}.
    Do not include any dishes that contain these allergens.
    IMPORTANT: we already have these ingredients on hand:
    {", ".join(user_inputs["pantry"])}
    Use as MANY of those pantry items as your reasonably can while still meeting the other constraints.
    </instructions>

    <schema>
    Return your answer as pure JSON (no markdown, no comments) that matches the following schema:
    {schema_string}
    </schema>
    """

    raw_response = get_completion(user_prompt, system_prompt, json_mode=True)
    parsed_response = json.loads(raw_response)
    return parsed_response


if __name__ == "__main__":
    meal_plan = draft_meal_plan(user_inputs)
    print(json.dumps(meal_plan, indent=2))

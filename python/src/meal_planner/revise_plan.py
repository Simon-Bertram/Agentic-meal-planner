import json
from get_completion import get_completion
from meal_plan import schema_string

def revise_plan(plan, fixes, suggestions, user_inputs):

    system_prompt = f"""You are an experienced registered dietician who revises meal plans."""

    user_prompt = f"""
    <instructions>
    Your task is to apply the following fixes and suggestions to the proposed plan:
    {json.dumps(plan, indent=2)}

    Here are the mandatory fixes:
    {json.dumps(fixes, indent=2)}

    Optional but welcome suggestions:
    {json.dumps(suggestions, indent=2)}

    Apply every fix. Use suggestions only if they don't break any of the rules.
    Return the **updated** plan as plain JSON (same schema, no extra text).
    </instructions>

    <schema>
    Return your answer as pure JSON (no markdown, no comments) that matches the following schema:
    {schema_string}
    </schema>
    """

    raw_response = get_completion(user_prompt, system_prompt, json_mode=True)
    return json.loads(raw_response)

def build_grocery_list(plan, pantry):

    system_prompt = f"""You are a registered dietician who builds grocery lists."""

    user_prompt = f"""
    <instructions>
    Using the dinner plan below, create a shopping list for one week of groceries.
    Do **not** include any ingredients that are already in the pantry:
    ({', '.join(pantry)}).

    Return JSON exactly like this:
    {{"shopping_list": [{{"item": "","estimated_quantity":""}}]}}

    Plan JSON:
    {json.dumps(plan, indent=2)}
    </instructions>
    """

    raw_response = get_completion(user_prompt, system_prompt, json_mode=True)
    return json.loads(raw_response)
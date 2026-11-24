import json
from get_completion import get_completion
from meal_plan import schema_string

def critique_plan(plan, user_inputs):

    system_prompt = f"""You are a registered dietician QA inspector who critiques meal plans."""

    user_prompt = f"""
    <instructions>
    Here is the proposed plan (raw JSON):

    {json.dumps(plan, indent=2)}

    Check for rule violations:

    1. The total cost should be less than or equal to {user_inputs["budget"]} USD.
    2. Each day's calories must be within +15% of the target calories {user_inputs["daily_calories"]}.
    3. NONE of these allergens should be in any of the dishes: {", ".join(user_inputs["allergens"])}.
    4. *Every* pantry item ({', '.join(user_inputs["pantry"])}) must be used in at least one dish. 
    Bonus points for using them more often.

    Please any violations inside **fixes**.

    Then think of nice-to-have tweeks (better variety, seasonal veg, quicker prep, etc.). Put those
    ideas in **suggestions**.
    </instructions>

    <schema>
    Reply with JSON matching this schema:
    {{"fixes": [], "suggestions": []}}
    Output only the JSON, nothing else. No markdown backticks, no comments, no extra text.
    </schema>
    """

    raw_response = get_completion(system_prompt, user_prompt, json_mode=True)
    return json.loads(raw_response)
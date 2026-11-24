import json
from user_inputs import user_inputs
from meal_plan import draft_meal_plan
from critique_plan import critique_plan
from revise_plan import revise_plan, build_grocery_list

MAX_PASSES = 3

def build_plan(user_inputs):

    plan = draft_meal_plan(user_inputs)

    for _ in range(MAX_PASSES):

        critique = critique_plan(plan, user_inputs)

        if not critique["fixes"] and not critique["suggestions"]:
            break

        plan = revise_plan(plan, critique["fixes"], critique["suggestions"], user_inputs)

    return plan

if __name__ == "__main__":

    final_plan = build_plan(user_inputs)
    print("\n\nFINAL PLAN:\n")
    print(json.dumps(final_plan, indent=2))

    groceries = build_grocery_list(final_plan, user_inputs["pantry"])

    print("\n\nGROCERY LIST:\n")
    print(json.dumps(groceries, indent=2))
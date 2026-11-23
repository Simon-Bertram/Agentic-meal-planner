Ever have left over groceries in your refrigerator that you don’t want to go to waste? In this agentic workflow, we’ll generate a meal plan that makes use of all your existing groceries, generating a daily series of meals at specified caloric levels and under a certain budget.

First, the user will specify the following parameters:

    the number of people for whom we’ll cook
    the number of days for which to make meal plans
    the daily calorie target to aim for
    a list of food allergens
    our budget in USD
    a list of the existing groceries we have in our pantry

The workflow will first draft a list of meals, then refine itself via a feedback step, evaluatively routing itself through repeated refinements until the plan is ready. Then, once the meal plan is done, we’ll also create a grocery list that you can take shopping.

In the process, we’ll cover prompt chaining, JSON mode, orchestration, and evaluation. 
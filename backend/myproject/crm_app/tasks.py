from celery import shared_task
from .utils import scrape_recipe_data, create_or_fork_recipe
from .models import ScrapedPage, Recipe, Ingredient, RecipeIngredient, RecipeStep, Restaurant
import uuid

@shared_task(name="crm_app.tasks.scrape_recipe_task")
def scrape_recipe_task(url, restaurant_id):
    if ScrapedPage.objects.filter(url=url).exists():
        return {"message": "This URL has already been imported."}

    try:
        data = scrape_recipe_data(url)
    except Exception as e:
        return {"error": f"Error during scraping: {str(e)}"}

    try:
        restaurant = Restaurant.objects.get(id=restaurant_id)
    except Restaurant.DoesNotExist:
        return {"error": "Restaurant not found."}

    scraped_page = ScrapedPage.objects.create(url=url, html_content="")

    try:
        recipe, created = create_or_fork_recipe(data)
    except Exception as e:
        return {"error": str(e)}

    if recipe is None:
        recipe = Recipe.objects.create(
            name=data["title"],
            description="Imported recipe",
            prep_time=data["details"].get("prep_time"),
            cook_time=data["details"].get("cook_time"),
            additional_time=data["details"].get("additional_time"),
            total_time=data["details"].get("total_time"),
            servings=data["details"].get("servings"),
            image_url=data["image_url"],
        )
        created = True

    recipe.restaurants.add(restaurant)

    for ingredient_name in data["ingredients"]:
        base_ingredient, _ = Ingredient.objects.get_or_create(name=ingredient_name)

        RecipeIngredient.objects.create(
            id=uuid.uuid4(),
            recipe=recipe,
            ingredient=base_ingredient,
            restaurant=restaurant
        )

    for step_data in data["steps"]:
        RecipeStep.objects.create(
            recipe=recipe,
            step_number=step_data["step_number"],
            description=step_data["instruction"]
        )

    scraped_page.recipe = recipe
    scraped_page.save()

    msg = "Recipe successfully imported." if created else "Existing recipe reused."
    return {"message": msg, "recipe_id": str(recipe.id)}

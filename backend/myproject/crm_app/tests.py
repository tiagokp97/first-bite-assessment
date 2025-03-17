from django.conf import settings
settings.SILENCED_SYSTEM_CHECKS = ['fields.E331', 'fields.E340', 'fields.E336']

import sys
import importlib
if "crm_app.models" in sys.modules:
    del sys.modules["crm_app.models"]
import myproject.crm_app.models as models
models.Restaurant._meta.app_label = "myproject.crm_app"
models.ScrapedPage._meta.app_label = "myproject.crm_app"
models.Recipe._meta.app_label = "myproject.crm_app"
models.Ingredient._meta.app_label = "myproject.crm_app"
models.RecipeIngredient._meta.app_label = "myproject.crm_app"
models.RecipeStep._meta.app_label = "myproject.crm_app"
sys.modules["crm_app.models"] = models
importlib.reload(models)

from django.test import TestCase
from unittest.mock import patch
from crm_app.models import Restaurant, ScrapedPage, Recipe, Ingredient, RecipeIngredient, RecipeStep
from crm_app.tasks import scrape_recipe_task

class DummyManager:
    def __init__(self):
        self._restaurants = []
    def add(self, *args, **kwargs):
        self._restaurants.extend(args)
    def all(self):
        return self._restaurants

dummy_manager = DummyManager()

class ScrapeRecipeTaskTestCase(TestCase):
    def setUp(self):
        self.restaurant = Restaurant.objects.create(name="Test Restaurant")
        self.url = "http://example.com/recipe"

    @patch("crm_app.tasks.scrape_recipe_data")
    @patch("crm_app.tasks.create_or_fork_recipe")
    def test_scrape_recipe_success(self, mock_create_or_fork_recipe, mock_scrape_recipe_data):
        fake_data = {
            "title": "Test Recipe",
            "image_url": "http://example.com/image.jpg",
            "ingredients": ["ingredient1", "ingredient2"],
            "details": {
                "prep_time": "10 minutes",
                "cook_time": "20 minutes",
                "additional_time": "5 minutes",
                "total_time": "35 minutes",
                "servings": "4"
            },
            "steps": [
                {"step_number": 1, "instruction": "Do something"},
                {"step_number": 2, "instruction": "Do something else"}
            ]
        }
        mock_scrape_recipe_data.return_value = fake_data
        dummy_recipe = Recipe.objects.create(
            name=fake_data["title"],
            description="Imported recipe",
            prep_time=fake_data["details"].get("prep_time"),
            cook_time=fake_data["details"].get("cook_time"),
            additional_time=fake_data["details"].get("additional_time"),
            total_time=fake_data["details"].get("total_time"),
            servings=fake_data["details"].get("servings"),
            image_url=fake_data["image_url"],
        )
        class DummyManager:
            def __init__(self):
                self._restaurants = []
            def add(self, *args, **kwargs):
                self._restaurants.extend(args)
            def all(self):
                return self._restaurants
        dummy_manager = DummyManager()
        original_restaurants = Recipe.restaurants
        Recipe.restaurants = property(lambda self: dummy_manager)
        try:
            mock_create_or_fork_recipe.return_value = (dummy_recipe, True)
            result = scrape_recipe_task(self.url, str(self.restaurant.id))
            self.assertIn("Recipe successfully imported.", result.get("message", ""))
            recipe = Recipe.objects.get(name="Test Recipe")
            self.assertIsNotNone(recipe)
            self.assertIn(self.restaurant, dummy_manager.all())
            scraped_page = ScrapedPage.objects.get(url=self.url)
            self.assertEqual(scraped_page.recipe, recipe)
        finally:
            Recipe.restaurants = original_restaurants

    @patch("crm_app.tasks.scrape_recipe_data")
    def test_scrape_recipe_failure_due_to_scrape_error(self, mock_scrape_recipe_data):
        mock_scrape_recipe_data.side_effect = Exception("Test scraping error")
        result = scrape_recipe_task(self.url, str(self.restaurant.id))
        self.assertIn("Error during scraping", result.get("error", ""))

    def test_already_imported_url(self):
        ScrapedPage.objects.create(url=self.url, html_content="")
        result = scrape_recipe_task(self.url, str(self.restaurant.id))
        self.assertIn("This URL has already been imported.", result.get("message", ""))

import uuid
from django.db import models
from django.contrib.auth.models import User

class Restaurant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    users = models.ManyToManyField(User, related_name="restaurants")

    def __str__(self):
        return self.name

class Ingredient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class Recipe(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField()
    ingredients = models.ManyToManyField(
        Ingredient,
        through="RecipeIngredient",
        related_name="recipes"
    )
    restaurants = models.ManyToManyField(Restaurant, related_name="recipes") 
    image_url = models.URLField(max_length=500, blank=True, null=True)
    
    prep_time = models.CharField(max_length=50, blank=True, null=True)
    cook_time = models.CharField(max_length=50, blank=True, null=True)  
    additional_time = models.CharField(max_length=50, blank=True, null=True) 
    total_time = models.CharField(max_length=50, blank=True, null=True)  
    
    servings = models.PositiveIntegerField(blank=True, null=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class RecipeStep(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="steps")
    step_number = models.PositiveIntegerField()  
    description = models.TextField()  
    
    class Meta:
        db_table = "crm_app_recipe_step"
        ordering = ["step_number"]  

    def __str__(self):
        return f"Step {self.step_number}: {self.recipe.name}"

class RecipeIngredient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="recipe_ingredients")
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True) 


    class Meta:
        db_table = "crm_app_recipe_ingredients"
        unique_together = ("recipe", "ingredient", "restaurant")  

class ScrapedPage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    url = models.URLField(unique=True)
    html_content = models.TextField()
    recipe = models.OneToOneField(Recipe, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.url

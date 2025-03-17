

![First bite logo](https://cdn.prod.website-files.com/63bfc1212564937de4cb22ff/654aa1770a18bd285f50231f_Name%20-%20Green%20Transparent.svg)


You can check this initial technical documentation at:
https://docs.google.com/document/d/1SM_jO0XEg1hWUjq366HwRcxWeqC4XKZv/edit



![Interface Preview](/backend/Documentation/register.png)

In the project’s logic, this login screen is for administrators, so it already displays the restaurant’s name. The idea is that each admin starts with at least one restaurant, though later on you can add others.

This is the first screen you see when you enter the application. In this case, the user already has some restaurants registered, which makes the carousel work perfectly. On the left, you’ll see a list of all recipes available to the restaurant group, while on the right are the recipes linked to the selected restaurant. You can drag and drop recipes to assign them to the restaurant. Currently, there is no option to delete or update recipes on this screen, even though the backend for these functions is already implemented.

![Interface Preview](/backend/Documentation/scrap.png)

This is the screen for creating recipes. Here, you can see all the ingredients from the recipes that have been created or scraped.

Although the complete recipe creation feature is still pending – as is the option to add quantities and units (like cups, spoons, etc.) for each ingredient – you can already add a recipe to a selected restaurant, complete with its ingredients, name, description, step-by-step instructions, and preparation time.

We are using recipes from this site – https://www.allrecipes.com
Example URL for scraping: https://www.allrecipes.com/recipe/7095/irresistible-irish-soda-bread/

![Interface Preview](/backend/Documentation/polling.png)

The application supports running multiple scrapes simultaneously thanks to Celery and Redis, and it maps the status of each operation using polling. On this screen, I’m planning to add an extra feature: an accordion that, when expanded, displays the titles of the recipes, making it easier to manage many scrapes at once.


![Interface Preview](/backend/Documentation/update_scrape.png)

Once a scrape finishes, a form appears with all the recipe data. There are a few improvements to be made here: currently, when updating a recipe, the system keeps the same ID, which can cause problems if another user tries to import the same recipe. To avoid duplicates, the database checks if the URL has already been used and returns the existing recipe.

So far, three tests have been created for the scraping function.

Other tasks and improvements I plan to implement include:

Visual indicators on the sidebar to show the current route.
Notifications for all administrators when a new recipe is added to the group, specifying whether the recipe was scraped or created manually, and including details about who performed the action and when.
Implementing password validation using ZOD together with React Hook Form to enforce minimum requirements (such as more than eight characters, at least one uppercase letter, and one symbol) and provide proper error feedback.
Using Redux to manage global state—like storing restaurant data—to avoid repeated requests.
When updating a recipe with the description "Imported recipe", the system should create a copy of the recipe with a new ID, change the description to "Customized recipe", and remove the imported version from the user’s profile.
Enhancing SEO quality.
Creating a TypeScript architecture to support reusable interfaces.
Developing a management system that allows CRUD operations for creating users for your group or for specific restaurants, as well as the deletion of restaurants and recipes.
Adding new restaurant types, such as "steak house" and "poke".Once a scrape finishes, a form appears with all the recipe data. There are a few improvements to be made here: currently, when updating a recipe, the system keeps the same ID, which can cause problems if another user tries to import the same recipe. To avoid duplicates, the database checks if the URL has already been used and returns the existing recipe.

So far, three tests have been created for the scraping function.

Other tasks and improvements I plan to implement include:

Visual indicators on the sidebar to show the current route.
Notifications for all administrators when a new recipe is added to the group, specifying whether the recipe was scraped or created manually, and including details about who performed the action and when.
Implementing password validation using ZOD together with React Hook Form to enforce minimum requirements (such as more than eight characters, at least one uppercase letter, and one symbol) and provide proper error feedback.
Using Redux to manage global state—like storing restaurant data—to avoid repeated requests.
When updating a recipe with the description "Imported recipe", the system should create a copy of the recipe with a new ID, change the description to "Customized recipe", and remove the imported version from the user’s profile.
Enhancing SEO quality.
Creating a TypeScript architecture to support reusable interfaces.
Developing a management system that allows CRUD operations for creating users for your group or for specific restaurants, as well as the deletion of restaurants and recipes.



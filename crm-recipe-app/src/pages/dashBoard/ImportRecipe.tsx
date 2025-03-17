import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { scrapeRecipe, checkTaskStatus, getMyRestaurants, updateRecipe } from "../../api/dashboard.ts";
import { Trash2 } from "lucide-react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";


interface Restaurant {
    id: string;
    name: string;
}

interface Ingredient {
    id: string;
    ingredient_name: string;
    unity: string;
    quantity: string;
}

interface Step {
    step_number: number;
    description: string;
}

interface Recipe {
    id: string;
    name: string;
    description: string;
    ingredient_objects: Ingredient[];
    steps: Step[];
    prep_time: string;
    cook_time: string;
    additional_time: string;
    total_time: string;
    servings: number;
    restaurants: string[];
}

export default function ImportRecipe() {
    const { register, handleSubmit, control } = useForm();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(false);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [scrapingTasks, setScrapingTasks] = useState<Array<{
        taskId: string;
        url: string;
        progress: number;
        status: string;
        recipe: Recipe | null;
    }>>([]);

    React.useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const data = await getMyRestaurants();
                setRestaurants(data);
            } catch (error) {
                console.error("Error fetching restaurants:", error);
            }
        };
        fetchRestaurants();
    }, []);

    const onSubmit = async (data: any) => {
        try {
            setLoading(true);
            const response = await scrapeRecipe(data.url, data.restaurantId);
            const newTask = { taskId: response.task_id, url: data.url, progress: 0, status: "PENDING", recipe: null };
            setScrapingTasks((prev) => [...prev, newTask]);
            const taskIndex = scrapingTasks.length;
            handleCheckTaskStatus(response.task_id, taskIndex);
            setTaskId(response.task_id);
            checkTaskStatus(response.task_id, setRecipe, setLoading);
            setLoading(false);
        } catch (error) {
            console.error("Error scraping recipe:", error);
            setLoading(false);
        }
    };


    const handleRemoveIngredient = (index: number) => {
        if (!recipe) return;
        const updatedIngredients = recipe.ingredient_objects.filter((_, i) => i !== index);
        setRecipe({ ...recipe, ingredient_objects: updatedIngredients });
    };

    const handleRemoveStep = (index: number) => {
        if (!recipe) return;
        const updatedSteps = recipe.steps.filter((_, i) => i !== index);
        setRecipe({ ...recipe, steps: updatedSteps });
    };

    const handleUpdate = async (data: any) => {
        if (!recipe) return;

        try {
            setLoading(true);

            const updatedFields = {
                name: data.name,
                description: data.description,
                prep_time: data.prep_time,
                cook_time: data.cook_time,
                additional_time: data.additional_time,
                total_time: data.total_time,
                servings: data.servings,
                ingredients: recipe.ingredient_objects.map((ingredient, index) => ({
                    name: data.ingredients?.[index]?.name || ingredient.ingredient_name,
                })),
                steps: recipe.steps.map((step, index) => ({
                    step_number: index + 1,
                    description: data.steps?.[index]?.description || step.description,
                })),
            };

            const updatedRecipe = await updateRecipe(recipe.id, updatedFields);

            const formattedRecipe = {
                ...updatedRecipe,
                ingredient_objects: updatedRecipe.ingredients.map((ingredient: Ingredient) => ({
                    id: ingredient.id || crypto.randomUUID(),
                    ingredient_name: ingredient.name,
                })),
            };

            setRecipe(formattedRecipe);
            setLoading(false);
        } catch (error) {
            console.error("Error updating recipe:", error);
            setLoading(false);
        }
    };

    const handleCheckTaskStatus = (taskId: string, taskIndex: number) => {
        checkTaskStatus(
            taskId,
            (recipeData: Recipe) => {
                setScrapingTasks((prev) =>
                    prev.map((task, i) =>
                        i === taskIndex ? { ...task, recipe: recipeData, status: "SUCCESS", progress: 100 } : task
                    )
                );
            },
            (loading: boolean) => {
                if (!loading) {
                    setScrapingTasks((prev) =>
                        prev.map((task, i) =>
                            i === taskIndex && !task.recipe ? { ...task, status: "FAILURE" } : task
                        )
                    );
                }
            }
        );

        let simulatedProgress = 0;
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`${API_URL}/task-status/${taskId}/`);
                if (response.data.status === "SUCCESS" || response.data.status === "FAILURE") {
                    clearInterval(interval);
                    return;
                }
                simulatedProgress = Math.min(simulatedProgress + 25, 99);
                setScrapingTasks((prev) =>
                    prev.map((task, i) =>
                        i === taskIndex ? { ...task, progress: simulatedProgress, status: response.data.status } : task
                    )
                );
            } catch (error) {
                console.error("Error checking task status:", error);
                clearInterval(interval);
            }
        }, 3000);
    };
    return (
        <div className="flex gap-6 p-6 bg-gray-100 min-h-screen">
            <form onSubmit={handleSubmit(onSubmit)} className="w-1/3 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4">Scrape Recipe</h2>
                <input
                    {...register("url")}
                    placeholder="Recipe URL"
                    required
                    className="w-full border rounded-lg p-2 mb-4 focus:outline-none focus:ring focus:ring-blue-300"
                />
                <Controller
                    name="restaurantId"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <select {...field} className="w-full border rounded-lg p-2 mb-4">
                            <option value="">Select a restaurant</option>
                            {restaurants.map((resto) => (
                                <option key={resto.id} value={resto.id}>{resto.name}</option>
                            ))}
                        </select>
                    )}
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600">
                    {loading ? "Scraping..." : "Import Recipe"}
                </button>

                <div className="mt-4 space-y-2">
                    {scrapingTasks.map((task) => (
                        <div key={task.taskId} className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">URL: {task.url}</span>
                                <span className="text-sm">
                                    {task.status} ({task.progress}%)
                                </span>
                            </div>
                            <div className="relative w-full h-2 bg-gray-200 rounded-full">
                                <div
                                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300"
                                    style={{ width: `${task.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </form>
            {recipe && (
                <form onSubmit={handleSubmit(handleUpdate)} className="w-2/3 bg-white p-6 rounded-lg shadow-md max-h-[90vh] overflow-auto">
                    <h2 className="text-lg font-semibold mb-4">Edit Recipe</h2>
                    <input {...register("name")} defaultValue={recipe.name} className="w-full border rounded-lg p-2 mb-4" />
                    <textarea {...register("description")} defaultValue={recipe.description} className="w-full border rounded-lg p-2 mb-4" />
                    <div className="flex gap-2 w-full justify-between">
                        <h3 className="text-md font-semibold mb-2">Ingredients</h3>
                    </div>
                    {recipe.ingredient_objects.map((ingredient, index) => (
                        <div key={ingredient.id} className="flex gap-2 items-center">
                            <input {...register(`ingredients.${index}.name`)} defaultValue={ingredient.ingredient_name} className="w-full border rounded-lg p-2 mb-2" />
                            <Trash2 className="cursor-pointer text-red-500" onClick={() => handleRemoveIngredient(index)} />
                        </div>
                    ))}
                    {recipe.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <label className="font-medium">Step {index + 1}</label>
                            <textarea {...register(`steps.${index}.description`)} defaultValue={step.description} className="w-full border rounded-lg p-2 mb-2" />
                            <Trash2 className="cursor-pointer text-red-500" onClick={() => handleRemoveStep(index)} />
                        </div>
                    ))}
                    <button type="submit" className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600">Update Recipe</button>
                </form>
            )}
        </div>
    );
}

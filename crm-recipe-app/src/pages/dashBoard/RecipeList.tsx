import { useState, useEffect } from "react";
import {
    getMyRestaurants,
    getRecipesBrief,
    getRecipesDetail,
    uploadRestaurantImage,
    createRestaurant,
    addRecipeToRestaurant,
    fetchRestaurantRecipes,
} from "../../api/dashboard.ts";
import RestaurantCarousel from "./RestaurantCarousel.tsx";
import { Clock, Users, X } from "lucide-react";
import { toast } from 'react-toastify';
import { Link } from "react-router-dom";

import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export interface Restaurant {
    id: string;
    name: string;
    image_url?: string;
}

export interface RecipeDetail extends Restaurant {
    description?: string;
    prep_time?: string;
    cook_time?: string;
    additional_time?: string;
    total_time?: string;
    servings?: string;
    ingredient_objects?: Array<{
        id: string;
        ingredient_name: string;
    }>;
    steps?: Array<{
        step_number: number;
        description: string;
    }>;
}

export default function RecipeList() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [recipes, setRecipes] = useState<Restaurant[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [selectedRestaurantRecipes, setSelectedRestaurantRecipes] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [detailLoading, setDetailLoading] = useState<boolean>(false);
    const [imageInputs, setImageInputs] = useState<{ [key: string]: string }>({});
    const [newRestaurantName, setNewRestaurantName] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [isIngredientLoading, setIsIngredientLoading] = useState(false);
    const [activeIngredientId, setActiveIngredientId] = useState<string | null>(null);

    const [isLeftScrollEnabled, setIsLeftScrollEnabled] = useState(true);
    const [isRightScrollEnabled, setIsRightScrollEnabled] = useState(true);

    console.log("Render: selectedRestaurant =", selectedRestaurant);

    const handleRestaurantSelect = async (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant);
        console.log("restaurant", restaurant);
        try {
            const resRecipes = await fetchRestaurantRecipes(restaurant.id);
            setSelectedRestaurantRecipes(resRecipes);
        } catch (err) {
            console.error("Error fetching restaurant recipes:", err);
            toast.error("Failed to fetch restaurant recipes.");
        }
    };

    const handleAddRecipeToRestaurant = async (recipeId: string) => {
        if (!selectedRestaurant) {
            toast.dismiss();
            toast.error("Please select a restaurant first!");
            return;
        }
        setIsAdding(true);
        toast("Adding recipe...");
        try {
            await addRecipeToRestaurant(selectedRestaurant.id, recipeId);
            toast.dismiss();
            toast(`Recipe added to "${selectedRestaurant.name}" successfully!`);
            const updatedRecipes = await fetchRestaurantRecipes(selectedRestaurant.id);
            setSelectedRestaurantRecipes(updatedRecipes);
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to add recipe to restaurant.");
        } finally {
            setIsAdding(false);
        }
    };

    useEffect(() => {
        async function fetchRestaurants() {
            try {
                const restaurantsData = await getMyRestaurants();
                setRestaurants(restaurantsData);
            } catch (error) {
                setError("Failed to load restaurants.");
            }
        }
        fetchRestaurants();
    }, []);

    useEffect(() => {
        async function fetchRecipes() {
            try {
                const recipesData = await getRecipesBrief();
                setRecipes(recipesData);
            } catch (error) {
                setError("Failed to load recipes.");
            } finally {
                setLoading(false);
            }
        }
        fetchRecipes();
    }, []);

    const handleRecipeClick = async (recipe: Restaurant) => {
        try {
            setSelectedRecipe({ ...recipe });
            setIsLeftScrollEnabled(false);
            setDetailLoading(true);
            const details = await getRecipesDetail(recipe.id);
            setSelectedRecipe(details);
        } catch (error) {
            toast.dismiss();
            toast("Failed to load recipe details.");
            setIsLeftScrollEnabled(true);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedRecipe(null);
        setIsLeftScrollEnabled(true);
    };

    const handleUploadImage = async (restaurantId: string) => {
        const imageUrl = imageInputs[restaurantId];
        if (!imageUrl) {
            toast("Please enter an image URL.");
            return;
        }
        try {
            await uploadRestaurantImage(restaurantId, imageUrl);
            setRestaurants((prev) =>
                prev.map((r) => (r.id === restaurantId ? { ...r, image_url: imageUrl } : r))
            );
            setImageInputs((prev) => ({ ...prev, [restaurantId]: "" }));
            toast.dismiss();
            toast("Image uploaded successfully!");
        } catch (error) {
            toast.dismiss();
            toast("Failed to upload image.");
        }
    };

    const handleCreateRestaurant = async () => {
        if (!newRestaurantName.trim()) {
            toast("Please enter a restaurant name.");
            return;
        }
        try {
            const newRestaurant = await createRestaurant(newRestaurantName);
            setRestaurants((prev) => [...prev, newRestaurant.restaurant]);
            setNewRestaurantName(newRestaurant.restaurant.name);
            toast.dismiss();
            toast("Restaurant created successfully!");
        } catch (error) {
            toast.dismiss();
            toast("Failed to create restaurant.");
        }
    };

    const columns = [[], [], []];
    if (selectedRecipe?.ingredient_objects) {
        selectedRecipe.ingredient_objects.forEach((ingredient, idx) => {
            columns[Math.floor(idx / 5) % 3].push(ingredient);
        });
    }

    let isDisabled = !selectedRecipe;

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-3 gap-8 pl-8 pr-8 pb-8">
                <RestaurantCarousel
                    restaurants={restaurants}
                    handleUploadImage={handleUploadImage}
                    imageInputs={imageInputs}
                    setImageInputs={setImageInputs}
                    setSelectedRestaurant={setSelectedRestaurant}
                    selectedRestaurant={selectedRestaurant}
                    onRestaurantSelect={handleRestaurantSelect}
                />

                <div className="col-span-3 flex justify-end mt-4 pr-4">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        {selectedRecipe && (
                            <div className="p-4 flex flex-col gap-4 overflow-auto">
                                <button
                                    disabled={isDisabled || isAdding}
                                    onClick={() => {
                                        if (selectedRecipe) {
                                            handleAddRecipeToRestaurant(selectedRecipe.id);
                                        }
                                    }}
                                    className={
                                        isDisabled || isAdding
                                            ? "bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
                                            : "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                    }
                                >
                                    {isAdding ? "Adding..." : "Add this Recipe to Selected Restaurant"}
                                </button>
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder="New restaurant name..."
                            value={newRestaurantName}
                            onChange={(e) => setNewRestaurantName(e.target.value)}
                            className="p-2 border rounded text-sm bg-white"
                        />
                        <button
                            onClick={handleCreateRestaurant}
                            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-300 text-sm"
                        >
                            Create Restaurant
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pr-8 pl-8">
                <div className={`p-4 rounded-xl bg-gray-50 shadow ${isLeftScrollEnabled ? "overflow-auto" : "overflow-hidden"} h-[50vh] relative`}>
                    <h3 className="text-2xl font-semibold text-gray-700 mb-4">Recipes</h3>
                    {loading ? (
                        <p className="text-gray-500">Loading recipes...</p>
                    ) : recipes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recipes.map((recipe) => (
                                <DraggableRecipe
                                    key={recipe.id}
                                    recipe={recipe}
                                    onClick={() => handleRecipeClick(recipe)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">
                            No recipes found. Click{" "}
                            <Link to="/create" className="text-blue-500 underline">
                                here
                            </Link>{" "}
                            to create your first one.
                        </p>
                    )}
                    {selectedRecipe && (
                        <div className="absolute top-0 left-0 w-full bg-white shadow-xl z-10 flex flex-col">
                            <div className="p-4 flex flex-col gap-4 overflow-auto h-[50vh]">
                                {detailLoading ? (
                                    <RecipeDetailSkeleton onClose={closeModal} />
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <h2 className="text-2xl font-semibold text-gray-700">
                                                    {selectedRecipe.name}
                                                </h2>
                                                <p className="text-gray-700 text-sm mt-2">
                                                    {selectedRecipe.description}
                                                </p>
                                            </div>
                                            <button
                                                className="text-gray-800 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer self-start"
                                                onClick={closeModal}
                                            >
                                                <X />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex gap-4 justify-around mt-2 w-full text-gray-700">
                                                <InfoBox icon={<Clock />} label="Prep Time" value={selectedRecipe.prep_time} />
                                                <InfoBox icon={<Clock />} label="Cook Time" value={selectedRecipe.cook_time} />
                                                <InfoBox icon={<Clock />} label="Additional" value={selectedRecipe.additional_time} />
                                                <InfoBox icon={<Clock />} label="Total" value={selectedRecipe.total_time} />
                                                <InfoBox icon={<Users />} label="Servings" value={selectedRecipe.servings} />
                                            </div>
                                            <div className="bg-white p-3 rounded-md shadow flex-grow">
                                                <h3 className="text-lg font-semibold mb-2 text-gray-700">Ingredients</h3>
                                                <div className="grid grid-cols-3 gap-x-4 overflow-y-auto h-[100px] pl-5 text-sm text-gray-700">
                                                    {columns.map((col, colIndex) => (
                                                        <ul key={colIndex} className="list-disc">
                                                            {col.map((ingredient) => (
                                                                <li
                                                                    key={ingredient.id}
                                                                    className={`cursor-pointer ${activeIngredientId === ingredient.id ? "font-bold" : ""}`}
                                                                    onClick={() => {
                                                                        if (isIngredientLoading) return;
                                                                        setIsIngredientLoading(true);
                                                                        setActiveIngredientId(ingredient.id);
                                                                        setTimeout(() => {
                                                                            setIsIngredientLoading(false);
                                                                        }, 1000);
                                                                    }}
                                                                >
                                                                    {ingredient.ingredient_name}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="text-lg font-semibold mb-2 text-gray-700">Steps</h3>
                                            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                                                {selectedRecipe.steps?.map((step) => (
                                                    <li key={step.step_number}>{step.description}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DroppableRecipeList
                    title={
                        selectedRestaurant
                            ? `Recipes - ${selectedRestaurant.name}`
                            : "Select a Restaurant to see its Recipes"
                    }
                    recipes={selectedRestaurantRecipes}
                    onDropRecipe={(draggedRecipe) => handleAddRecipeToRestaurant(draggedRecipe.id)}
                    selectedRestaurant={selectedRestaurant}
                    isScrollEnabled={isRightScrollEnabled}
                />
            </div>
        </DndProvider>
    );
}

function DraggableRecipe({
    recipe,
    onClick,
}: {
    recipe: Restaurant;
    onClick: () => void;
}) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "RECIPE",
        item: { recipe },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            onClick={onClick}
            className={`bg-white shadow-md rounded-lg border p-4 h-full cursor-pointer ${isDragging ? "opacity-50" : ""}`}
        >
            <p className="text-lg font-semibold text-gray-800">{recipe.name}</p>
        </div>
    );
}

function DroppableRecipeList({
    title,
    recipes,
    onDropRecipe,
    selectedRestaurant,
    isScrollEnabled,
}: {
    title: string;
    recipes: Restaurant[];
    onDropRecipe: (draggedRecipe: Restaurant) => void;
    selectedRestaurant: Restaurant | null;
    isScrollEnabled: boolean;
}) {
    const [{ isOver }, drop] = useDrop(
        () => ({
            accept: "RECIPE",
            drop: (item: { recipe: Restaurant }) => {
                if (!selectedRestaurant) {
                    return;
                }
                onDropRecipe(item.recipe);
            },
            collect: (monitor) => ({
                isOver: !!monitor.isOver(),
            }),
        }),
        [selectedRestaurant]
    );

    return (
        <div
            ref={drop}
            className={`p-4 rounded-xl bg-gray-50 shadow ${isScrollEnabled ? "overflow-auto" : "overflow-hidden"} h-[50vh] transition-colors ${isOver ? "bg-green-100" : ""}`}
        >
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">{title}</h3>
            {recipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recipes.map((r) => (
                        <div key={r.id} className="bg-white shadow-md rounded-lg border p-4 h-full">
                            <p className="text-lg font-semibold text-gray-800">{r.name}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No recipes found.</p>
            )}
        </div>
    );
}

function InfoBox({
    icon,
    label,
    value,
}: {
    icon?: JSX.Element;
    label: string;
    value?: string;
}) {
    return (
        <div className="flex flex-col items-center bg-white p-3 rounded-md shadow min-w-[60px]">
            <div className="text-gray-600 w-6 h-6">{icon}</div>
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-sm">{value}</span>
        </div>
    );
}

function RecipeDetailSkeleton({ onClose }: { onClose: () => void }) {
    return (
        <>
            <button
                className="text-gray-800 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer self-end"
                onClick={onClose}
            >
                <X />
            </button>
            <div className="animate-pulse flex flex-col gap-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="flex gap-4 justify-around mt-2 w-full">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center bg-white p-3 rounded-md shadow min-w-[60px]"
                        >
                            <div className="w-6 h-6 bg-gray-200 rounded" />
                            <div className="h-4 bg-gray-200 rounded w-16 mt-2" />
                            <div className="h-4 bg-gray-200 rounded w-12 mt-1" />
                        </div>
                    ))}
                </div>
                <div className="bg-white p-3 rounded-md shadow flex-grow">
                    <div className="h-5 bg-gray-200 w-1/3 rounded mb-2"></div>
                    <div className="grid grid-cols-3 gap-x-4 overflow-y-auto h-[150px] text-sm text-gray-700">
                        {[...Array(3)].map((_, colIndex) => (
                            <ul key={colIndex} className="list-disc space-y-2">
                                {[...Array(3)].map((__, liIndex) => (
                                    <li key={liIndex}>
                                        <div className="w-24 h-4 bg-gray-200 rounded" />
                                    </li>
                                ))}
                            </ul>
                        ))}
                    </div>
                </div>
                <div className="mt-4">
                    <div className="h-5 bg-gray-200 w-1/4 rounded mb-2"></div>
                    <ul className="list-decimal space-y-2 pl-5">
                        {[...Array(3)].map((_, i) => (
                            <li key={i}>
                                <div className="w-3/4 h-4 bg-gray-200 rounded" />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}

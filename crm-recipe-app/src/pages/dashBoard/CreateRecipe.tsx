import { useEffect, useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Trash2, PlusCircle } from "lucide-react";
import { createRecipe, getIngredients, getMyRestaurants } from "../../api/dashboard.ts";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { toast } from "react-toastify";

interface Ingredient {
    id: string;
    name: string;
}



export default function CreateRecipe() {
    const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
    const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
    const [restaurants, setRestaurants] = useState<string[]>([]);
    const [ingredientsList, setIngredientsList] = useState<string[]>([]);

    const [recipeName, setRecipeName] = useState("");
    const [description, setDescription] = useState("");
    const [prepTime, setPrepTime] = useState("");
    const [cookTime, setCookTime] = useState("");
    const [additionalTime, setAdditionalTime] = useState("");
    const [totalTime, setTotalTime] = useState("");
    const [servings, setServings] = useState("");
    const [steps, setSteps] = useState<string[]>([]);


    useEffect(() => {
        const fetchIngredients = async () => {
            try {
                const ingredientsData = await getIngredients();
                setIngredientsList(ingredientsData);
            } catch (error) {
                console.error("Error fetching ingredients:", error);
            }
        };
        fetchIngredients();
    }, []);

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const restaurantsData = await getMyRestaurants();
                setRestaurants(restaurantsData);
            } catch (error) {
                console.error("Error fetching restaurants:", error);
            }
        };
        fetchRestaurants();
    }, []);

    const addStep = () => setSteps([...steps, ""]);
    const updateStep = (index: number, value: string) => {
        const updatedSteps = [...steps];
        updatedSteps[index] = value;
        setSteps(updatedSteps);
    };
    const removeStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const addIngredient = (ingredient: Ingredient) => {
        setSelectedIngredients((prev) =>
            prev.some((i) => i.id === ingredient.id) ? prev : [...prev, ingredient]
        );
    };

    const removeIngredient = (id: string) => {
        setSelectedIngredients((prev) => prev.filter((ing) => ing.id !== id));
    };

    const handleCreateRecipe = async () => {
        const payload = {
            name: recipeName,
            description: 'created',
            prep_time: prepTime,
            cook_time: cookTime,
            additional_time: additionalTime,
            total_time: totalTime,
            servings,
            ingredients: selectedIngredients.map((ing) => ing.id),
            restaurants: selectedRestaurants,
            steps: steps.map((description, index) => ({
                step_number: index + 1,
                description,
            })),
        };

        try {
            const result = await createRecipe(payload);
            toast.success("Recipe created successfully!");

        } catch (error) {
            console.error("Error creating recipe:", error);
            toast.error("Failed to create recipe.");
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-3 gap-8  pl-8 pr-8">


                <div className="col-span-3 w-full relative">
                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={4}
                        slidesPerView="auto"
                        direction="horizontal"
                        navigation={{
                            nextEl: ".next-btn",
                            prevEl: ".prev-btn",
                        }}
                        className="relative w-full overflow-hidden h-[150px] "
                    >
                        {restaurants.map((restaurant) => (
                            <SwiperSlide key={restaurant.id} className="!h-full flex justify-center items-center  max-w-[180px]">
                                <div
                                    onClick={() => setSelectedRestaurants([restaurant.id])}

                                    className={
                                        selectedRestaurants.includes(restaurant.id)
                                            ? "h-full cursor-pointer bg-white shadow-md rounded-lg overflow-hidden border-2 border-blue-500 hover:shadow-lg transition duration-300 flex flex-col"
                                            : "cursor-pointer bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition duration-300 flex flex-col"
                                    }
                                >
                                    <img
                                        src={
                                            restaurant.image_url ||
                                            "https://static.vecteezy.com/ti/vetor-gratis/p1/9291628-restaurante-logo-design-vetor.jpg"
                                        }
                                        alt={restaurant.name}
                                        className="w-full h-24 object-cover border-b border-gray-300"
                                    />
                                    <h3 className="text-base font-semibold text-gray-800 capitalize my-auto px-3 truncate">
                                        {restaurant.name}
                                    </h3>
                                </div>
                            </SwiperSlide>
                        ))}

                    </Swiper>

                </div>

                <div className="col-span-3 flex justify-end mt-4 pr-4">
                    <button
                        onClick={handleCreateRecipe}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                        Create Recipe
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-8 p-8">
                <IngredientsColumn
                    ingredients={ingredientsList}
                    selectedIngredients={selectedIngredients}
                    addIngredient={addIngredient}
                    setIngredientsList={setIngredientsList}
                />

                <RecipeColumn
                    selectedIngredients={selectedIngredients}
                    removeIngredient={removeIngredient}
                    addIngredient={addIngredient}
                />

                <RecipeForm
                    recipeName={recipeName}
                    setRecipeName={setRecipeName}
                    description={description}
                    setDescription={setDescription}
                    prepTime={prepTime}
                    setPrepTime={setPrepTime}
                    cookTime={cookTime}
                    setCookTime={setCookTime}
                    additionalTime={additionalTime}
                    setAdditionalTime={setAdditionalTime}
                    totalTime={totalTime}
                    setTotalTime={setTotalTime}
                    servings={servings}
                    setServings={setServings}
                    steps={steps}
                    addStep={addStep}
                    updateStep={updateStep}
                    removeStep={removeStep}
                />


            </div>
        </DndProvider>
    );
}

function IngredientsColumn({
    ingredients,
    selectedIngredients,
    addIngredient,
    setIngredientsList,
}: {
    ingredients: Ingredient[];
    selectedIngredients: Ingredient[];
    addIngredient: (ingredient: Ingredient) => void;
    setIngredientsList: (ingredients: Ingredient[]) => void;
}) {
    const [newIngredientName, setNewIngredientName] = useState("");

    const availableIngredients = ingredients.filter(
        (i) => !selectedIngredients.some((si) => si.id === i.id)
    );

    const handleAddNewIngredient = () => {
        if (newIngredientName.trim() === "") return;
        const newIng: Ingredient = {
            id: crypto.randomUUID(),
            name: newIngredientName,
        };
        setIngredientsList((prev) => [...prev, newIng]);
        setNewIngredientName("");
    };

    return (
        <div className="p-4 rounded-xl bg-gray-50 shadow border overflow-auto box-border h-[65vh]">
            <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
            <div className="mt-4 flex gap-2 items-center mb-2">
                <input
                    type="text"
                    placeholder="New Ingredient"
                    value={newIngredientName}
                    onChange={(e) => setNewIngredientName(e.target.value)}
                    className="flex-1 p-2 border rounded-md"
                />
                <button
                    onClick={handleAddNewIngredient}
                    className="p-2 bg-blue-500 text-white rounded-md"
                >
                    <PlusCircle size={22} />
                </button>
            </div>
            <div className="space-y-2">
                {availableIngredients.map((ingredient) => (
                    <DraggableIngredient
                        key={ingredient.id}
                        ingredient={ingredient}
                        addIngredient={addIngredient}
                    />
                ))}
            </div>
        </div>
    );
}

function DraggableIngredient({
    ingredient,
    addIngredient,
}: {
    ingredient: Ingredient;
    addIngredient: (ingredient: Ingredient) => void;
}) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "INGREDIENT",
        item: ingredient,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className={`p-3 bg-white rounded-lg shadow flex justify-between items-center cursor-pointer border ${isDragging ? "opacity-50" : ""
                }`}
        >
            <span>{ingredient.name}</span>
            <PlusCircle
                className="text-blue-500 cursor-pointer flex-shrink-0"
                style={{ width: "22px", height: "22px" }}
                onClick={() => addIngredient(ingredient)}
            />
        </div>
    );
}

function RecipeColumn({
    selectedIngredients,
    removeIngredient,
    addIngredient,
}: {
    selectedIngredients: Ingredient[];
    removeIngredient: (id: string) => void;
    addIngredient: (ingredient: Ingredient) => void;
}) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: "INGREDIENT",
        drop: (item: Ingredient) => {
            addIngredient(item);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div
            ref={drop}
            className={`p-4 rounded-xl shadow border ${isOver ? "bg-green-100" : "bg-white"}    overflow-auto     box-border
    max-h-screen`}
        >
            <h2 className="text-xl font-semibold mb-4">Selected Ingredients</h2>
            <div className="flex flex-col gap-3">
                {selectedIngredients.length === 0 ? (
                    <p className="text-gray-500">Drag or click on an ingredient.</p>
                ) : (
                    selectedIngredients.map((ingredient) => (
                        <div
                            key={ingredient.id}
                            className="flex gap-2 items-center justify-between p-2 bg-gray-50 rounded-lg shadow-sm border"
                        >
                            <span>{ingredient.name}</span>
                            <Trash2
                                size={24}
                                className="text-red-500 cursor-pointer flex-shrink-0"
                                onClick={() => removeIngredient(ingredient.id)}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function RecipeForm({
    recipeName,
    setRecipeName,
    description,
    setDescription,
    prepTime,
    setPrepTime,
    cookTime,
    setCookTime,
    additionalTime,
    setAdditionalTime,
    totalTime,
    setTotalTime,
    servings,
    setServings,
    steps,
    addStep,
    updateStep,
    removeStep,
}: any) {
    return (
        <div className="p-4 rounded-xl bg-gray-50 shadow border  overflow-auto     box-border
    h-[65vh]">
            <h2 className="text-xl font-semibold mb-4">Recipe Details</h2>
            <input
                type="text"
                placeholder="Recipe Name"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="w-full p-2 border rounded-md mb-2"
            />
            <input
                type="text"
                placeholder="Prep Time"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full p-2 border rounded-md mb-2"
            />
            <input
                type="text"
                placeholder="Cook Time"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className="w-full p-2 border rounded-md mb-2"
            />
            <input
                type="text"
                placeholder="Additional Time"
                value={additionalTime}
                onChange={(e) => setAdditionalTime(e.target.value)}
                className="w-full p-2 border rounded-md mb-2"
            />
            <input
                type="text"
                placeholder="Total Time"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
                className="w-full p-2 border rounded-md mb-2"
            />
            <input
                type="text"
                placeholder="Servings"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-full p-2 border rounded-md mb-2"
            />
            <div className="space-y-2">
                {steps.map((step: string, index: number) => (
                    <div key={index} >
                        <label>Step {index + 1}</label>
                        <div className="flex gap-2 items-center">
                            <textarea
                                value={step}
                                onChange={(e) => updateStep(index, e.target.value)}
                                className="w-full p-2 border rounded-md mb-2"
                            />
                            <Trash2
                                className="text-red-500 cursor-pointer"
                                onClick={() => removeStep(index)}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={addStep}
                className="w-full mt-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
                Add Step
            </button>
        </div>
    );
}

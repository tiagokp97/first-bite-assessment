import axios from "axios";

const API_URL = "http://127.0.0.1:8000";


const getAuthHeaders = () => {
    const token = localStorage.getItem("access");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    };
};

export const uploadRestaurantImage = async (restaurantId: string, imageUrl: string) => {
    const response = await axios.post(
        `${API_URL}/api/restaurants/${restaurantId}/upload-image/`,
        { image_url: imageUrl },
        getAuthHeaders()
    );
    return response.data;
};

export const createRestaurant = async (name: string) => {
    const response = await axios.post(
        `${API_URL}/api/restaurants/create_restaurant/`,
        { name: name },
        getAuthHeaders()
    );
    return response.data;
};


/**
 * @param url 
 * @param restaurantId 
 */
export const scrapeRecipe = async (url: string, restaurantId: string) => {
    const response = await axios.post(
        `${API_URL}/scrape_recipe/`,
        { url, restaurant_id: restaurantId },
        getAuthHeaders()
    );
    return response.data;
};

export const fetchRecipe = async (recipe_id: string, setRecipe: (data: any) => void, setLoading: (loading: boolean) => void) => {

    try {
        const response = await axios.get(`${API_URL}/api/recipes/${recipe_id}/`,
        getAuthHeaders()
        
        );
        setRecipe(response.data);
        setLoading(false);
    } catch (error) {
        console.error("Error fetching recipe:", error);
        setLoading(false);
    }
};

export const fetchRestaurantRecipes = async (restaurant_id: string) => {
       try {
        const response = await axios.get(`${API_URL}/api/restaurants/${restaurant_id}/my-recipes/`,
        getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        console.error("Error updating recipe:", error);
        throw error;
    }
};



export const updateRecipe = async (recipeId: string, updatedFields: Record<string, any>) => {
    try {
        const response = await axios.patch(
            `${API_URL}/api/recipes/${recipeId}/update/`,
            updatedFields,
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        console.error("Error updating recipe:", error);
        throw error;
    }
};


export const createRecipe = async (newRecipeFields: Record<string, any>) => {
    try {
        const response = await axios.post(
            `${API_URL}/api/recipes/`,
            newRecipeFields,
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        console.error("Error creating recipe:", error);
        throw error;
    }
};

export const addRecipeToRestaurant = async (restaurant_id: string, recipe_id: string) => {
    try {
        const response = await axios.post(
            `${API_URL}/api/restaurants/${restaurant_id}/add-recipe/`,
            {recipe_id: recipe_id},
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        console.error("Error creating recipe:", error);
        throw error;
    }
};


export const getIngredients = async () => {
      try {
    const response = await axios.get(`${API_URL}/api/ingredients/my-ingredients/`, getAuthHeaders());
    return response.data;
    } catch (error) {
        console.error("Error updating recipe:", error);
        throw error;
    }
};



export const getRecipesBrief = async () => {
    const response = await axios.get(`${API_URL}/api/recipes/my_recipes_brief/`, getAuthHeaders());
    return response.data;
};

export const getRecipesDetail = async (id: string) => {
    const response = await axios.get(`${API_URL}/api/recipes/${id}/my_recipe_detail/`, getAuthHeaders());
    return response.data;
};

export const getMyRestaurants = async () => {
    const response = await axios.get(`${API_URL}/api/restaurants/my-restaurants/`, getAuthHeaders());
    return response.data;
};

export const checkTaskStatus = async (taskId: string, setRecipe: (data: any) => void, setLoading: (loading: boolean) => void) => {
    const interval = setInterval(async () => {
        try {
            const response = await axios.get(`${API_URL}/task-status/${taskId}/`);
            console.log("Task status:", response.data);

            if (response.data.status === "SUCCESS") {
                clearInterval(interval);
                fetchRecipe(response.data.result.recipe_id, setRecipe, setLoading);
            } else if (response.data.status === "FAILURE") {
                clearInterval(interval);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error checking task status:", error);
            clearInterval(interval);
        }
    }, 3000);
};





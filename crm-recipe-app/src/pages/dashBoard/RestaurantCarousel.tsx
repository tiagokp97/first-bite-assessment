import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { ImageUp } from "lucide-react";
import { ChevronLeft, ChevronRight } from 'lucide-react';


interface Restaurant {
    id: string;
    name: string;
    image_url?: string;
}


interface Props {
    restaurants: Restaurant[];
    selectedRestaurant: Restaurant | null;
    setSelectedRestaurant: React.Dispatch<React.SetStateAction<Restaurant | null>>;
    onRestaurantSelect: (restaurant: Restaurant) => void;
    handleUploadImage: (restaurantId: string, imageUrl: string) => void;
    imageInputs: { [key: string]: string };
    setImageInputs: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

export default function RestaurantCarousel({
    restaurants,
    selectedRestaurant,
    setSelectedRestaurant,
    onRestaurantSelect,
    handleUploadImage,
    imageInputs,
    setImageInputs,
}: Props) {
    return (
        <div className="col-span-3 w-full relative">
            <Swiper
                modules={[Navigation]}
                spaceBetween={2}
                slidesPerView={4}
                direction="horizontal"
                navigation={{ nextEl: ".next-btn", prevEl: ".prev-btn" }}
                className="relative w-full overflow-hidden h-[220px]"
            >
                {restaurants.map((restaurant) => (
                    <SwiperSlide key={restaurant.id} className="!h-[240px]">
                        <div
                            onClick={() => {
                                setSelectedRestaurant(restaurant);
                                onRestaurantSelect(restaurant);
                            }}
                            className={
                                selectedRestaurant && selectedRestaurant.id === restaurant.id
                                    ? "cursor-pointer w-[240px] bg-white shadow-md rounded-lg overflow-hidden border-2 border-blue-500 hover:shadow-lg transition duration-300 flex flex-col"
                                    : "cursor-pointer w-[240px] bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition duration-300 flex flex-col"
                            }
                        >
                            <img
                                src={
                                    restaurant.image_url ||
                                    "https://static.vecteezy.com/ti/vetor-gratis/p1/9291628-restaurante-logo-design-vetor.jpg"
                                }
                                alt={restaurant.name}
                                className="w-full h-28 object-cover border border-gray-300"
                            />
                            <h3 className="text-lg font-semibold text-gray-800 capitalize mt-3 pl-3 pb-1">
                                {restaurant.name}
                            </h3>
                            <div className="mt-1 flex pb-3 gap-2 pl-3">
                                <input
                                    type="text"
                                    placeholder="Enter image URL..."
                                    value={imageInputs[restaurant.id] || ""}
                                    onChange={(e) =>
                                        setImageInputs((prev) => ({
                                            ...prev,
                                            [restaurant.id]: e.target.value,
                                        }))
                                    }
                                    className="p-2 border rounded w-[170px] text-sm"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (imageInputs[restaurant.id]) {
                                            handleUploadImage(restaurant.id, imageInputs[restaurant.id]);
                                        }
                                    }}
                                    className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-300 text-sm w-[38px] h-[38px] flex items-center justify-center"
                                >
                                    <ImageUp size={16} />
                                </button>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <div className="prev-btn absolute top-1/2 -translate-y-1/2 left-2 z-10">
                <button className="bg-blue-500 px-3 py-1 rounded-md hover:bg-blue-600 text-white">
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>
            <div className="next-btn absolute top-1/2 -translate-y-1/2 right-2 z-10">
                <button className="bg-blue-500 px-3 py-1 rounded-md hover:bg-blue-600 text-white">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

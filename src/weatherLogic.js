// This function handles the "Logic" of what to wear
export const getClothingSuggestions = (temp, condition) => {
  let suggestions = [];
  
  if (temp < 10) suggestions = ["Heavy Coat", "Scarf", "Gloves"];
  else if (temp < 20) suggestions = ["Light Jacket", "Hoodie", "Jeans"];
  else suggestions = ["T-Shirt", "Shorts", "Sunglasses"];

  // Add rain protection if needed
  if (condition.toLowerCase().includes("rain")) {
    suggestions.push("Umbrella", "Waterproof Boots");
  }
  
  return suggestions;
};

// This function handles what to do based on weather
export const getActivitySuggestions = (temp, condition) => {
  const isBadWeather = condition.toLowerCase().includes("rain") || temp < 12;
  
  return isBadWeather 
    ? ["Visit the Van Abbemuseum", "Coffee at Strijp-S", "Cinema at Natlab"]
    : ["Walk in Genneper Parken", "Cycling to Nuenen", "Drinks at the Markt"];
};

// This function translates weather into Foursquare Category IDs
export const getCategoryIds = (temp, condition) => {
  const isBadWeather = condition.toLowerCase().includes("rain") || temp < 12;

  // Foursquare Category IDs:
  // Indoor: Museum (10027), Coffee Shop (13032), Movie Theater (10024)
  // Outdoor: Park (16032), Hiking Trail (16019), Scenic Lookout (16043)
  return isBadWeather ? "10027,13032,10024" : "16032,16019,16043";
};
const { createClient } = require("redis");

async function getConnection() {
  let clientRedis = createClient();
  clientRedis.on("error", (err) => console.log("Redis Client Error", err));
  await clientRedis.connect();

  console.log("Connected to Redis");
  return clientRedis;
}

async function getUser(userId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();

    return await clientRedis.HGETALL(`customer:${userId}`);
  } finally {
    clientRedis.quit();
  }
}

async function getBrand(brandId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    return await clientRedis.HGETALL(`brand:${brandId}`);
  } finally {
    clientRedis.quit();
  }
}

async function getBrands() {
  let clientRedis;
  try {
    clientRedis = await getConnection();

    const brandsId = await clientRedis.SMEMBERS("brands");

    console.log("got brands", brandsId);

    const brandsList = [];
    for (let brId of brandsId) {
      const brand = await getBrand(brId);
      brandsList.push(brand);
    }

    return brandsList;
  } finally {
    clientRedis.quit();
  }
}

async function getMealsBy(brandId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();

    const mealsIds = await clientRedis.SMEMBERS(`brand:${brandId}:meals`);

    console.log("got meals", mealsIds);

    const meals = [];
    for (let mealId of mealsIds) {
      const meal = await getMeal(brandId, mealId);
      meals.push(meal);
    }

    return meals;
  } finally {
    clientRedis.quit();
  }
}

async function getMeal(brandId, mealId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    return await clientRedis.HGETALL(`brand:${brandId}:meal:${mealId}`);
  } finally {
    clientRedis.quit();
  }
}

async function getLocations() {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    const locationsIds = await clientRedis.SMEMBERS("locations");

    console.log("got locations", locationsIds);

    const locationsList = [];
    for (let locId of locationsIds) {
      const loc = await getLocation(locId);
      locationsList.push(loc);
    }

    return locationsList;
  } finally {
    clientRedis.quit();
  }
}

async function getLocation(locId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    return await clientRedis.HGETALL(`location:${locId}`);
  } finally {
    clientRedis.quit();
  }
}

async function getPickupTypes() {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    const pickup_typeIds = await clientRedis.SMEMBERS("pickup_types");

    console.log("got pickup types", pickup_typeIds);

    const pickup_typeList = [];
    for (let typeId of pickup_typeIds) {
      const type = await getPickupType(typeId);
      pickup_typeList.push(type);
    }

    return pickup_typeList;
  } finally {
    clientRedis.quit();
  }
}

async function getPickupType(typeId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    return await clientRedis.HGETALL(`pickup_type:${typeId}`);
  } finally {
    clientRedis.quit();
  }
}

async function createOrder(
  orderQuantity,
  currentPickup,
  currentLocation,
  currentMeal,
  userID
) {
  let clientRedis;
  try {
    clientRedis = await getConnection();

    const nextId = await clientRedis.incr("orderCount");
    console.log(`nextId ${nextId}`);

    // await clientRedis.hSet(`order:${nextId}`, { user: user, text: text });
    console.log(`order ${nextId} added`);

    await clientRedis.SADD(
      `orders:customer:${userID}:current_orders`,
      `${nextId}`
    );

    const time_ordered = new Date(Date.now());

    await clientRedis.sendCommand([
      "HSET",
      `orders:customer:${userID}:current_order:${nextId}`,
      "id",
      `${nextId}`,
      "customer_id",
      `${userID}`,
      "location_id",
      `${currentLocation.id.toString()}`,
      "location_address",
      `${currentLocation.address}`,
      "location_state",
      `${currentLocation.state}`,
      "location_phone",
      `${currentLocation.phone_number}`,
      "meal_id",
      `${currentMeal.meal_id.toString()}`, //TODO is not the same as meal_id above!!! see if I need this information
      "meal_name",
      `${currentMeal.meal_name}`,
      "meal_desc",
      `${currentMeal.meal_desc}`,
      "meal_price",
      `${currentMeal.price}`,
      "order_time",
      time_ordered.toLocaleString(),
      "pickup_id",
      `${currentPickup.id.toString()}`,
      "pickup_type",
      `${currentPickup.type}`,
      "pickup_time",
      "null",
      "order_quantity",
      `${orderQuantity.toString()}`,
    ]);
  } finally {
    await clientRedis.quit();
  }
}

async function getOrdersBy(userId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    const currentOrdersIds = await clientRedis.SMEMBERS(
      `orders:customer:${userId}:current_orders`
    );

    console.log("got current orders", currentOrdersIds);

    const ordersList = [];
    for (let orderId of currentOrdersIds) {
      const order = await getOrder(userId, orderId);
      ordersList.push(order);
    }
  
    return ordersList;
  } finally {
    clientRedis.quit();
  }
}

async function getOrder(userId, orderId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    return await clientRedis.HGETALL(
      `orders:customer:${userId}:current_order:${orderId}`
    );
  } finally {
    clientRedis.quit();
  }
}

//Jiayi

async function createMeal(meal, brand_name, brandID) {
  let clientRedis;
  try {
    clientRedis = await getConnection();

    const nextId = await clientRedis.incr("mealCount");
    console.log(`nextId ${nextId}`);

    // await clientRedis.hSet(`order:${nextId}`, { user: user, text: text });
    console.log(`meal${nextId} added`);

    await clientRedis.SADD(
      `brand:${brandID}:meals`,
      `${nextId.toString()}`
    );
    await clientRedis.sendCommand([
      "HSET",
      `brand:${brandID.toString()}:meal:${nextId.toString()}`,
      "brand_id",
      `${brandID.toString()}`,
      "brand_name",
      `${brand_name}`,
      "meal_id",
      `${nextId.toString()}`,
      "meal_name",
      `${meal.meal_name}`,
      "meal_desc",
      `${meal.meal_desc}`,
      "calories",
      `${meal.calories.toString()}`,
      "price",
      `${meal.price.toString()}`
    ]);
  } finally {
    await clientRedis.quit();
  }
}

// async function deleteMeal(mealIDtoDelete) {
//   let clientRedis;
//   try {
//     clientRedis = await getRConnection();

//     const key = `tweet:${tweetId}`;
//     await clientRedis.lRem("tweets", 0, key);
//     await clientRedis.del(key);
//   } finally {
//     rclient.quit();
//   }
// }
async function getAllCurrentOrders() {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    const currentOrdersIds = await clientRedis.SMEMBERS(
      `orders:current_orders`
    );

    console.log("got current orders", currentOrdersIds);

    const ordersList = [];
    for (let orderId of currentOrdersIds) {
      const order = await getAllCurrentOrder(orderId);
      ordersList.push(order);
    }
    //console.log(ordersList);
    return ordersList;
  } finally {
    clientRedis.quit();
  }
}

async function getAllCurrentOrder(orderId) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    return await clientRedis.HGETALL(
      `orders:current_order:${orderId}`
    );
  } finally {
    clientRedis.quit();
  }
}

async function updatePickupTime(orderID) {
  let clientRedis;
  try {
    clientRedis = await getConnection();
    const pickup_time = new Date(Date.now());
    return await clientRedis.sendCommand([
      "HSET",
      `orders:current_order:${orderID}`,
      "pickup_time",
      `${pickup_time.toString()}`
    ]);
  } finally {
    clientRedis.quit();
  }
}


module.exports = {
  getUser,
  getBrand,
  getBrands,
  getMealsBy,
  getMeal,
  getLocations,
  getLocation,
  getPickupType,
  getPickupTypes,
  createOrder,
  getOrdersBy,
  getOrder,
  createMeal,
  getAllCurrentOrders,
  getAllCurrentOrder,
  updatePickupTime
};

//useful documentation
//https://github.com/redis/node-redis
